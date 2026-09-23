/**
 * Eliminar Espacio desde Platform Admin.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient, type Db } from "mongodb";
import {
  ADL_TENANT_ID,
  DOMAINS_COLLECTION,
  SEM_TENANT_ID,
  SITE_CONFIG_COLLECTION,
  SITES_COLLECTION,
  TENANTS_COLLECTION,
} from "../../src/core/tenant/constants";
import {
  createPlatformSpace,
} from "../../src/core/tenant/create-platform-space";
import {
  DeletePlatformSpaceError,
  deletePlatformSpace,
  isProtectedPlatformSpace,
} from "../../src/core/tenant/delete-platform-space";
import { setPlatformSpaceStatus } from "../../src/core/tenant/space-status";
import { loadEnvLocal } from "../../src/core/migrations/env";

const ROOT = process.cwd();

function readSrc(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

function loadEnvFile(filename: string): void {
  const envPath = resolve(ROOT, filename);
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function loadTestMongoEnv(): void {
  loadEnvLocal();
  loadEnvFile(".env");
}

async function withDb(run: (db: Db) => Promise<void>): Promise<void> {
  loadTestMongoEnv();
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  if (!uri || !dbName) {
    console.warn("skip: MONGODB_URI/MONGODB_DB no configurados");
    return;
  }
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 12_000 });
  await client.connect();
  try {
    await run(client.db(dbName));
  } finally {
    await client.close();
  }
}

describe("eliminar Espacio — contrato", () => {
  it("protege SEM y ADL; API DELETE y UI de confirmación", () => {
    assert.equal(isProtectedPlatformSpace(SEM_TENANT_ID), true);
    assert.equal(isProtectedPlatformSpace(ADL_TENANT_ID), true);
    assert.equal(isProtectedPlatformSpace("fundacion-mueve"), false);

    const route = readSrc("src/app/api/platform/spaces/[tenantId]/route.ts");
    assert.match(route, /export async function DELETE/);
    assert.match(route, /deletePlatformSpace/);
    assert.match(route, /requirePlatformOperator/);

    const panel = readSrc("src/components/platform/PlatformDeleteSpacePanel.tsx");
    assert.match(panel, /Eliminar Espacio/);
    assert.match(panel, /confirmSlug/);
    assert.match(panel, /method:\s*"DELETE"/);

    const detail = readSrc("src/components/platform/PlatformSpaceDetailView.tsx");
    assert.match(detail, /PlatformDeleteSpacePanel/);
    const catalog = readSrc("src/components/platform/PlatformSpacesCatalog.tsx");
    const menu = readSrc("src/components/platform/PlatformSpaceActionsMenu.tsx");
    assert.match(catalog, /PlatformSpaceActionsMenu/);
    assert.match(menu, /Activar/);
    assert.match(menu, /Desactivar/);
    assert.match(menu, /Suspender/);
    assert.match(menu, /Archivar/);
    assert.match(menu, /Eliminar/);
  });
});

describe("eliminar Espacio — Mongo", () => {
  it("borra un Espacio creado y rechaza SEM/confirmación incorrecta", async () => {
    await withDb(async (db) => {
      const stamp = Date.now().toString(36);
      const slug = `ot-del-${stamp}`;
      const actor = `actor-del-${stamp}`;

      try {
        await createPlatformSpace(
          db,
          {
            name: "Espacio a borrar",
            slug,
            type: "other",
            host: `${slug}.localhost:3000`,
          },
          actor
        );

        let protectedErr: unknown;
        try {
          await deletePlatformSpace(db, {
            tenantId: SEM_TENANT_ID,
            confirmSlug: SEM_TENANT_ID,
            actorUserId: actor,
          });
        } catch (error) {
          protectedErr = error;
        }
        assert.ok(protectedErr instanceof DeletePlatformSpaceError);
        assert.equal(
          (protectedErr as DeletePlatformSpaceError).code,
          "protected_space"
        );

        let confirmErr: unknown;
        try {
          await deletePlatformSpace(db, {
            tenantId: slug,
            confirmSlug: "otro-slug",
            actorUserId: actor,
          });
        } catch (error) {
          confirmErr = error;
        }
        assert.ok(confirmErr instanceof DeletePlatformSpaceError);
        assert.equal(
          (confirmErr as DeletePlatformSpaceError).code,
          "confirm_mismatch"
        );

        const result = await deletePlatformSpace(db, {
          tenantId: slug,
          confirmSlug: slug,
          actorUserId: actor,
        });
        assert.equal(result.tenantId, slug);

        assert.equal(
          await db.collection(TENANTS_COLLECTION).countDocuments({ tenantId: slug }),
          0
        );
        assert.equal(
          await db.collection(SITES_COLLECTION).countDocuments({ tenantId: slug }),
          0
        );
        assert.equal(
          await db.collection(DOMAINS_COLLECTION).countDocuments({ tenantId: slug }),
          0
        );
        assert.equal(
          await db
            .collection(SITE_CONFIG_COLLECTION)
            .countDocuments({ tenantId: slug }),
          0
        );

        const audit = await db.collection("identity_audit").findOne({
          action: "platform.space.delete",
          entityId: slug,
        });
        assert.ok(audit);
      } finally {
        await db.collection(TENANTS_COLLECTION).deleteMany({ tenantId: slug });
        await db.collection(SITES_COLLECTION).deleteMany({ tenantId: slug });
        await db.collection(DOMAINS_COLLECTION).deleteMany({ tenantId: slug });
        await db.collection(SITE_CONFIG_COLLECTION).deleteMany({ tenantId: slug });
        await db.collection("cms_menus").deleteMany({ tenant: slug });
        await db.collection("cms_pages").deleteMany({ tenant: slug });
        await db.collection("identity_roles").deleteMany({ tenantId: slug });
        await db.collection("platform_integrations").deleteMany({ tenantId: slug });
      }
    });
  });

  it("suspende, archiva y reactiva sin borrar el Espacio", async () => {
    await withDb(async (db) => {
      const stamp = Date.now().toString(36);
      const slug = `ot-st-${stamp}`;
      const actor = `actor-st-${stamp}`;

      try {
        await createPlatformSpace(
          db,
          {
            name: "Espacio estado",
            slug,
            type: "other",
            host: `${slug}.localhost:3000`,
          },
          actor
        );

        const suspended = await setPlatformSpaceStatus(db, {
          tenantId: slug,
          status: "suspended",
          actorUserId: actor,
        });
        assert.equal(suspended.status, "suspended");
        assert.equal(suspended.changed, true);

        const archived = await setPlatformSpaceStatus(db, {
          tenantId: slug,
          status: "archived",
          actorUserId: actor,
        });
        assert.equal(archived.previousStatus, "suspended");

        const active = await setPlatformSpaceStatus(db, {
          tenantId: slug,
          status: "active",
          actorUserId: actor,
        });
        assert.equal(active.status, "active");

        const row = await db.collection(TENANTS_COLLECTION).findOne({ tenantId: slug });
        assert.equal(row?.status, "active");
      } finally {
        await deletePlatformSpace(db, {
          tenantId: slug,
          confirmSlug: slug,
          actorUserId: actor,
        }).catch(() => undefined);
      }
    });
  });
});
