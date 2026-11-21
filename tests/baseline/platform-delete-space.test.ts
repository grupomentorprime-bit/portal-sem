/**
 * Eliminar Espacio desde Platform Admin.
 */
import { isolatedDatabaseName, loadTestProcessEnv } from "./mongo-isolation";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient, type Db } from "mongodb";
import {
  DOMAINS_COLLECTION,
  PROTECTED_OPERATIONAL_SPACE_IDS,
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

const OPERATIONAL_SPACES = [
  "seminario-ipn",
  "ipn-chile",
  "adl",
  "fundacion-mueve",
  "mentor-prime-capacitacion",
  "cumple",
] as const;

/** Slugs de fixtures. No son los clientes `cumple` ni `mentor-prime-capacitacion`. */
const SYNTHETIC_ALIASES = ["mentor-cumple", "mentor-capacitacion"] as const;

const ROOT = process.cwd();

function readSrc(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}


function loadTestMongoEnv(): void {
  loadTestProcessEnv();
}

async function withDb(run: (db: Db) => Promise<void>): Promise<void> {
  loadTestMongoEnv();
  const uri = process.env.MONGODB_URI;
  const dbName = isolatedDatabaseName(import.meta.url);
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

function databaseThatMustNotBeUsed(): Db {
  return new Proxy({} as Db, {
    get() {
      throw new Error("la base no debe recibir operaciones");
    },
  });
}

describe("eliminar Espacio — contrato", () => {
  it("protege los seis Espacios operativos y no los alias sintéticos", () => {
    assert.deepEqual([...PROTECTED_OPERATIONAL_SPACE_IDS], [...OPERATIONAL_SPACES]);
    for (const tenantId of OPERATIONAL_SPACES) {
      assert.equal(isProtectedPlatformSpace(tenantId), true);
      assert.equal(isProtectedPlatformSpace(` ${tenantId} `), true);
    }
    for (const tenantId of SYNTHETIC_ALIASES) {
      assert.equal(isProtectedPlatformSpace(tenantId), false);
    }
    assert.equal(isProtectedPlatformSpace("cumple-local"), false);
    assert.equal(isProtectedPlatformSpace("Cumple"), false);
    assert.equal(isProtectedPlatformSpace("ipn-chile-dev"), false);
    assert.equal(isProtectedPlatformSpace(""), false);
    assert.equal(isProtectedPlatformSpace(undefined as unknown as string), false);

    const route = readSrc("src/app/api/platform/spaces/[tenantId]/route.ts");
    assert.match(route, /export async function DELETE/);
    assert.match(route, /deletePlatformSpace/);
    assert.match(route, /requirePlatformOperator/);

    const detail = readSrc("src/components/platform/PlatformSpaceDetailView.tsx");
    assert.doesNotMatch(detail, /PlatformDeleteSpacePanel/);
    const catalog = readSrc("src/components/platform/PlatformSpacesCatalog.tsx");
    const menu = readSrc("src/components/platform/PlatformSpaceActionsMenu.tsx");
    assert.match(menu, /Eliminar Espacio/);
    assert.match(menu, /confirmSlug/);
    assert.match(menu, /method:\s*"DELETE"/);
    assert.match(catalog, /PlatformSpaceActionsMenu/);
    assert.match(menu, /Activar/);
    assert.match(menu, /Desactivar/);
    assert.match(menu, /Suspender/);
    assert.match(menu, /Archivar/);
    assert.match(menu, /Eliminar/);
    assert.match(menu, /disabled=\{submitting \|\| protectedSpace\}/);
    assert.match(menu, /disabled=\{submitting\}\s*\r?\n\s*onClick/);

    const status = readSrc("src/core/tenant/space-status.ts");
    assert.doesNotMatch(status, /isProtectedPlatformSpace/);
    const wrapper = readSrc("src/lib/platform/delete-space.ts");
    const guardAt = wrapper.indexOf("rejectProtectedPlatformSpace(");
    const dbAt = wrapper.indexOf("getDatabase(");
    assert.ok(guardAt >= 0 && dbAt > guardAt);

    const core = readSrc("src/core/tenant/delete-platform-space.ts");
    const rejectAt = core.indexOf("rejectProtectedPlatformSpace(input.tenantId)");
    const findAt = core.indexOf("findTenantById(");
    assert.ok(rejectAt >= 0 && findAt > rejectAt);
  });

  it("rechaza los seis Espacios antes de operar en la base", async () => {
    const db = databaseThatMustNotBeUsed();
    for (const tenantId of OPERATIONAL_SPACES) {
      let protectedErr: unknown;
      try {
        await deletePlatformSpace(db, {
          tenantId,
          confirmSlug: tenantId,
          actorUserId: "actor-protegido",
        });
      } catch (error) {
        protectedErr = error;
      }
      assert.ok(protectedErr instanceof DeletePlatformSpaceError);
      assert.equal(
        (protectedErr as DeletePlatformSpaceError).code,
        "protected_space"
      );
    }

    let aliasErr: unknown;
    try {
      await deletePlatformSpace(db, {
        tenantId: "mentor-cumple",
        confirmSlug: "mentor-cumple",
        actorUserId: "actor-sintetico",
      });
    } catch (error) {
      aliasErr = error;
    }
    assert.ok(!(aliasErr instanceof DeletePlatformSpaceError));
    assert.match(String(aliasErr), /la base no debe recibir operaciones/);
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

        for (const tenantId of OPERATIONAL_SPACES) {
          await db.collection(TENANTS_COLLECTION).insertOne({
            _id: tenantId,
            tenantId,
            name: tenantId,
            status: "active",
          });
          let protectedErr: unknown;
          try {
            await deletePlatformSpace(db, {
              tenantId,
              confirmSlug: tenantId,
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
          assert.equal(
            await db.collection(TENANTS_COLLECTION).countDocuments({ tenantId }),
            1
          );
        }

        const suspended = await setPlatformSpaceStatus(db, {
          tenantId: "cumple",
          status: "suspended",
          actorUserId: actor,
        });
        assert.equal(suspended.status, "suspended");
        assert.equal(suspended.changed, true);
        assert.equal(
          (await db.collection(TENANTS_COLLECTION).findOne({ tenantId: "cumple" }))?.status,
          "suspended"
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
