/**
 * Fundación de un Espacio sin cms_config y sin convertir a SEM en el tenant global.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MongoClient, type Db } from "mongodb";
import { createDefaultSiteConfig } from "../../src/lib/cms/defaults";
import { ADL_TENANT_ID, SEM_TENANT_ID } from "../../src/core/tenant/constants";
import { ensureAdlTenantFoundation } from "../../src/core/tenant/migrate-adl";
import { ensureSemTenantFoundation } from "../../src/core/tenant/migrate-sem";
import { provisionTenantFoundation } from "../../src/core/tenant/provision";
import { resolvePublicTenantByHost } from "../../src/core/tenant/resolve";
import { applyAdlSiteIdentity } from "../../src/core/tenant/adl-site-identity";
import {
  createOwnedDatabase,
  dropOwnedDatabase,
} from "../../src/lib/mongo/destructive-guard";
import {
  assertNonProductionClient,
  classifyLocalMongo,
} from "../../src/lib/mongo/local-boundary";

function loadUri(): string | null {
  return process.env.MONGODB_URI?.trim() || null;
}

describe("fundación universal sin cms_config", () => {
  it("SEM y otro cliente nacen aislados; los menús huérfanos no pasan a SEM", async (t) => {
    const uri = loadUri();
    if (!uri) {
      t.skip("Mongo aislado no autorizado");
      return;
    }
    assertNonProductionClient(uri, process.env);
    if (classifyLocalMongo(uri, process.env) !== "isolated-test") {
      throw new Error("Las pruebas solo abren el Mongo isolated-test.");
    }

    const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const owned = createOwnedDatabase(process.env);
    const dbName = owned.name;

    const client = new MongoClient(uri);
    let db: Db;
    try {
      await client.connect();
      db = client.db(dbName);
    } catch {
      await client.close().catch(() => undefined);
      t.skip("Mongo aislado no disponible");
      return;
    }

    const semHost = `sem-${stamp}.foundation.test`;
    const otherId = `cliente-${stamp}`;
    const otherHost = `cliente-${stamp}.foundation.test`;
    const orphanId = `menu-huerfano-${stamp}`;

    try {
      await db.collection<{
        _id: string;
        tenant?: string;
        name: string;
        location: string;
        active: boolean;
        items: unknown[];
        createdAt: string;
        updatedAt: string;
      }>("cms_menus").insertOne({
        _id: orphanId,
        name: "Huérfano",
        location: "header",
        active: true,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const sem = await ensureSemTenantFoundation(db, { hosts: [semHost] });
      assert.equal(sem.tenantId, SEM_TENANT_ID);
      assert.equal(sem.created.siteConfig, true);
      assert.equal(sem.preserved.legacyCmsConfig, false);
      assert.equal(sem.updated.menusBackfilled, 0);
      assert.equal(await db.collection("cms_config").countDocuments({}), 0);

      const semConfig = await db.collection("site_config").findOne({ tenantId: SEM_TENANT_ID });
      assert.ok(semConfig);
      assert.equal(semConfig.siteId, "seminario-ipn");
      assert.equal(semConfig.siteEnabled, false);
      assert.notEqual(semConfig.institution?.name, "");

      const orphan = await db
        .collection<{ _id: string; tenant?: string }>("cms_menus")
        .findOne({ _id: orphanId });
      assert.equal(orphan?.tenant, undefined);

      const base = createDefaultSiteConfig();
      const otherConfig = {
        ...base,
        siteEnabled: false,
        sitePublished: true,
        institution: {
          ...base.institution,
          name: `Cliente ${stamp}`,
          shortName: "CLI",
          tenant: otherId,
        },
      };
      await provisionTenantFoundation(db, {
        tenantId: otherId,
        code: `C${stamp}`.slice(0, 12),
        name: otherConfig.institution.name,
        type: "business",
        siteId: otherId,
        siteCode: `S${stamp}`.slice(0, 12),
        siteName: "CLI",
        hosts: [{ host: otherHost, kind: "custom", isPrimary: true }],
        config: otherConfig,
        seedMenus: true,
        seedHomePage: true,
        seedRoles: false,
        seedStorageStub: false,
      });

      const semHit = await resolvePublicTenantByHost(semHost, { db });
      const otherHit = await resolvePublicTenantByHost(otherHost, { db });
      assert.equal(semHit.ok, true);
      assert.equal(otherHit.ok, true);
      if (semHit.ok && otherHit.ok) {
        assert.equal(semHit.tenantId, SEM_TENANT_ID);
        assert.equal(otherHit.tenantId, otherId);
        assert.notEqual(otherHit.config.institution.name, semHit.config.institution.name);
        assert.equal(otherHit.config.siteEnabled, false);
        assert.equal(otherHit.config.sitePublished, true);
      }

      const crossed = await db.collection("site_config").findOne({
        tenantId: otherId,
        "institution.name": semConfig?.institution && typeof semConfig.institution === "object"
          ? (semConfig.institution as { name?: string }).name
          : "Seminario Eclesiástico Mayor",
      });
      assert.equal(crossed, null);

      await ensureAdlTenantFoundation(db, {
        env: {
          APP_URL: "http://localhost:3000",
          NEXT_PUBLIC_APP_URL: "http://localhost:3000",
          ADL_DEV_HOST: `adl-${stamp}.foundation.test`,
        },
      });
      const adlHost = `adl-${stamp}.foundation.test`;
      const adlHit = await resolvePublicTenantByHost(adlHost, { db });
      const semAgain = await resolvePublicTenantByHost(semHost, { db });
      assert.equal(adlHit.ok, true);
      assert.equal(semAgain.ok, true);
      if (adlHit.ok && semAgain.ok) {
        assert.equal(adlHit.tenantId, ADL_TENANT_ID);
        assert.equal(semAgain.tenantId, SEM_TENANT_ID);
        assert.notEqual(adlHit.config.institution.name, semAgain.config.institution.name);
      }

      const adlIdentity = applyAdlSiteIdentity(createDefaultSiteConfig());
      assert.notEqual(adlIdentity.institution.name, "Seminario Eclesiástico Mayor");
    } finally {
      try {
        await dropOwnedDatabase(client, uri, owned, process.env);
      } finally {
        await client.close();
      }
    }
  });
});
