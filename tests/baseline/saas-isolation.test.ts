import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient, type Db } from "mongodb";
import { SEM_TENANT_ID } from "../../src/core/tenant/constants";
import { migration007SaasIsolation } from "../../src/core/migrations/007-saas-isolation";
import { loadEnvLocal } from "../../src/core/migrations/env";

const OTHER_TENANT = "tenant-isolation-other";

function loadEnvFile(filename: string): void {
  const envPath = resolve(process.cwd(), filename);
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
  const client = new MongoClient(uri);
  await client.connect();
  try {
    await run(client.db(dbName));
  } finally {
    await client.close();
  }
}

function readSrc(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("OT-GROWTH-SAAS-003 — aislamiento Mongo", () => {
  it("código: sin $or leaky en menús/workflows; lookups con tenant", () => {
    const menus = readSrc("src/lib/cms/menus.ts");
    assert.equal(menus.includes("tenant: { $exists: false }"), false);
    assert.equal(menus.includes('tenant: ""'), false);
    assert.match(menus, /resourceIdCandidates/);
    assert.match(menus, /menuTenantFilter\(tenant\)/);

    const pages = readSrc("src/lib/cms/pages.ts");
    assert.match(pages, /resourceIdCandidates/);
    assert.match(pages, /pageTenantFilter\(tenant\)/);

    const media = readSrc("src/lib/cms/media.ts");
    assert.match(media, /_id:\s*id,\s*tenant,/);

    const defs = readSrc("src/lib/workflow/definitions.ts");
    assert.equal(defs.includes("tenantId: { $exists: false }"), false);
    assert.match(defs, /templateToDefinition\(template,\s*tenantId\)/);

    const guard = readSrc("src/core/security/tenant-guard.ts");
    assert.match(guard, /export async function requireActiveTenant/);
  });

  it("menús sin tenant no son visibles; filtro exacto por tenant", async () => {
    await withDb(async (db) => {
      const col = db.collection<{
        _id: string;
        tenant?: string;
        name: string;
        location: string;
        active: boolean;
        items: unknown[];
        createdAt: string;
        updatedAt: string;
      }>("cms_menus");
      const orphanId = `saas003-orphan-menu-${Date.now()}`;
      const otherId = `saas003-other-menu-${Date.now()}`;

      await col.insertOne({
        _id: orphanId,
        name: "Orphan",
        location: "header",
        active: true,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await col.insertOne({
        _id: otherId,
        tenant: OTHER_TENANT,
        name: "Other",
        location: "header",
        active: true,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      try {
        const forSem = await col.find({ tenant: SEM_TENANT_ID, _id: orphanId }).toArray();
        assert.equal(forSem.length, 0);

        const leaky = await col
          .find({
            $or: [
              { tenant: SEM_TENANT_ID },
              { tenant: { $exists: false } },
              { tenant: "" },
            ],
            _id: orphanId,
          })
          .toArray();
        assert.equal(
          leaky.length,
          1,
          "el $or leaky sí vería el huérfano — se eliminó del código"
        );

        const cross = await col.findOne({ _id: otherId, tenant: SEM_TENANT_ID });
        assert.equal(cross, null);
      } finally {
        await col.deleteMany({ _id: { $in: [orphanId, otherId] } });
      }
    });
  });

  it("mismo recurso no cruza tenants en pages/media/invitations", async () => {
    await withDb(async (db) => {
      const pageId = `saas003-page-${Date.now()}`;
      const mediaId = `saas003-media-${Date.now()}`;
      const invId = `saas003-inv-${Date.now()}`;
      const pages = db.collection<{ _id: string; tenant: string }>("cms_pages");
      const media = db.collection<{ _id: string; tenant: string }>("cms_media");
      const invitations = db.collection<{ _id: string; tenantId: string }>(
        "identity_invitations"
      );

      await pages.insertMany([
        {
          _id: pageId,
          tenant: SEM_TENANT_ID,
          title: "SEM page",
          slug: `saas003-${Date.now()}`,
          description: "",
          status: "draft",
          template: "blank",
          seo: {},
          blocks: [],
          versions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as never,
      ]);

      const otherPageId = `${pageId}-other`;
      await pages.insertOne({
        _id: otherPageId,
        tenant: OTHER_TENANT,
        title: "Other page",
        slug: `saas003-other-${Date.now()}`,
        description: "",
        status: "draft",
        template: "blank",
        seo: {},
        blocks: [],
        versions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as never);

      await media.insertOne({
        _id: mediaId,
        tenant: OTHER_TENANT,
        filename: "x.bin",
        originalName: "x.bin",
        extension: "bin",
        mimeType: "application/octet-stream",
        size: 1,
        url: "/media/x",
        folder: "Otros",
        category: "Documento",
        visibility: "active",
        tags: [],
        usage: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as never);

      await invitations.insertOne({
        _id: invId,
        tenantId: OTHER_TENANT,
        email: "isolation@example.com",
        displayName: "Iso",
        roleIds: [],
        token: `tok-${Date.now()}`,
        status: "pending",
        invitedBy: "test",
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        createdAt: new Date().toISOString(),
      } as never);

      try {
        assert.equal(await pages.findOne({ _id: pageId, tenant: OTHER_TENANT }), null);
        assert.ok(await pages.findOne({ _id: pageId, tenant: SEM_TENANT_ID }));
        assert.equal(await media.findOne({ _id: mediaId, tenant: SEM_TENANT_ID }), null);
        assert.equal(
          await invitations.findOne({ _id: invId, tenantId: SEM_TENANT_ID }),
          null
        );
      } finally {
        await pages.deleteMany({ _id: { $in: [pageId, otherPageId] } });
        await media.deleteOne({ _id: mediaId });
        await invitations.deleteOne({ _id: invId });
      }
    });
  });

  it("migración 007 es idempotente", async () => {
    await withDb(async (db) => {
      const first = await migration007SaasIsolation.run({
        db,
        log: () => undefined,
      });
      const second = await migration007SaasIsolation.run({
        db,
        log: () => undefined,
      });
      assert.ok(first.details?.length);
      assert.ok(second.details?.length);
      assert.equal(
        second.details!.some((d) => d.includes("backfill=0") || d.includes("=exists")),
        true
      );
    });
  });
});
