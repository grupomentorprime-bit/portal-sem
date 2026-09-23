import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient, type Db } from "mongodb";
import {
  ADL_DEV_HOST_DEFAULT,
  ADL_SITE_ID,
  ADL_TENANT_ID,
  DOMAINS_COLLECTION,
  SEM_SITE_ID,
  SEM_TENANT_ID,
} from "../../src/core/tenant/constants";
import {
  isLoopbackHost,
  isPlatformOriginHost,
  isSemDevHost,
  publicOriginFromHost,
  publicUrlForPath,
  resolveAppHostsFromEnv,
  resolveSemBootstrapHostsFromEnv,
  shouldEnterPlatformHome,
} from "../../src/core/tenant/hosts";
import {
  isSemEligibleHost,
  resolvePublicTenantByHost,
} from "../../src/core/tenant/resolve";
import { ensureSemTenantFoundation } from "../../src/core/tenant/migrate-sem";
import { ensureAdlTenantFoundation } from "../../src/core/tenant/migrate-adl";
import { loadEnvLocal } from "../../src/core/migrations/env";
import type { DomainDocument } from "../../src/core/tenant/types";

const PLATFORM_HOST = "growthos.mentorprime.cl";
const PLATFORM_URL = `https://${PLATFORM_HOST}`;

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

async function withDb(
  t: { skip: (msg?: string) => void },
  run: (db: Db) => Promise<void>
): Promise<void> {
  loadTestMongoEnv();
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  if (!uri || !dbName) {
    t.skip("Sin MONGODB_URI/MONGODB_DB");
    return;
  }

  const client = new MongoClient(uri);
  let db: Db;
  try {
    await client.connect();
    db = client.db(dbName);
  } catch (error) {
    await client.close().catch(() => undefined);
    t.skip(
      `Mongo no disponible: ${error instanceof Error ? error.message : String(error)}`
    );
    return;
  }

  try {
    await run(db);
  } finally {
    await client.close();
  }
}

describe("OT-GROWTH-PLATFORM-HOST-ISOLATION-001 — reglas unitarias", () => {
  it("APP_URL describe origen; no hace elegible SEM a host público", () => {
    assert.deepEqual(
      resolveAppHostsFromEnv({
        APP_URL: PLATFORM_URL,
        NEXT_PUBLIC_APP_URL: PLATFORM_URL,
      }),
      [PLATFORM_HOST]
    );
    assert.equal(isSemEligibleHost(PLATFORM_HOST, { APP_URL: PLATFORM_URL }), false);
    assert.equal(isLoopbackHost(PLATFORM_HOST), false);
    assert.deepEqual(
      resolveSemBootstrapHostsFromEnv({
        APP_URL: PLATFORM_URL,
        NEXT_PUBLIC_APP_URL: PLATFORM_URL,
      }),
      []
    );
  });

  it("bootstrap SEM traduce el loopback al subdominio del Espacio", () => {
    assert.deepEqual(
      resolveSemBootstrapHostsFromEnv({
        APP_URL: "http://localhost:3000",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      }),
      ["seminario-ipn.localhost:3000"]
    );
    assert.deepEqual(
      resolveSemBootstrapHostsFromEnv({
        APP_URL: PLATFORM_URL,
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      }),
      ["seminario-ipn.localhost:3000"]
    );
    assert.equal(isSemDevHost("seminario-ipn.localhost:3000"), true);
    assert.equal(isSemDevHost("localhost:3000"), false);
  });

  it("isPlatformOriginHost incluye loopback pelado y el APP_URL público", () => {
    const env = { APP_URL: PLATFORM_URL, NEXT_PUBLIC_APP_URL: PLATFORM_URL };
    assert.equal(isPlatformOriginHost(PLATFORM_HOST, env), true);
    assert.equal(isPlatformOriginHost("localhost:3000", env), true);
    assert.equal(isPlatformOriginHost("seminario-ipn.localhost:3000", env), false);
    assert.equal(isPlatformOriginHost("seminarioipn.cl", env), false);
  });

  it("publicOriginFromHost apunta el Espacio, no el loopback de la plataforma", () => {
    assert.equal(publicOriginFromHost("seminario-ipn.localhost:3000"), "http://seminario-ipn.localhost:3000");
    assert.equal(publicOriginFromHost("localhost:3000"), "http://localhost:3000");
    assert.equal(publicOriginFromHost("seminarioipn.cl"), "https://seminarioipn.cl");
    assert.equal(
      publicUrlForPath("http://seminario-ipn.localhost:3000", "/"),
      "http://seminario-ipn.localhost:3000/"
    );
    assert.equal(
      publicUrlForPath("http://seminario-ipn.localhost:3000", "/admision#hero"),
      "http://seminario-ipn.localhost:3000/admision#hero"
    );
  });

  it("shouldEnterPlatformHome: sin Espacio entra a la portada de Growth OS", () => {
    assert.equal(shouldEnterPlatformHome(PLATFORM_HOST, false), true);
    assert.equal(shouldEnterPlatformHome(PLATFORM_HOST, true), false);
    assert.equal(shouldEnterPlatformHome("localhost:3000", false), true);
    assert.equal(shouldEnterPlatformHome("localhost:3000", true), false);
    assert.equal(shouldEnterPlatformHome("seminarioipn.cl", true), false);
    assert.equal(shouldEnterPlatformHome("seminarioipn.cl", false), true);
  });
});

describe("OT-GROWTH-PLATFORM-HOST-ISOLATION-001 — resolución", () => {
  it("A: host de plataforma no resuelve SEM ni ADL ni crea Domain", async (t) => {
    await withDb(t, async (db) => {
      const domains = db.collection<DomainDocument>(DOMAINS_COLLECTION);
      await domains.deleteOne({ _id: PLATFORM_HOST });

      const before = await domains.countDocuments({ host: PLATFORM_HOST });
      assert.equal(before, 0);

      const result = await resolvePublicTenantByHost(PLATFORM_HOST, {
        db,
        env: {
          APP_URL: PLATFORM_URL,
          NEXT_PUBLIC_APP_URL: PLATFORM_URL,
        },
      });

      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.reason, "unknown_host");
        assert.equal(result.host, PLATFORM_HOST);
      }

      const after = await domains.findOne({ host: PLATFORM_HOST });
      assert.equal(after, null);
    });
  });

  it("B: host real SEM en domains → T001", async (t) => {
    await withDb(t, async (db) => {
      const semHost = `iso-sem-${Date.now()}.test`;
      try {
        await ensureSemTenantFoundation(db, {
          hosts: [semHost],
          env: {
            APP_URL: PLATFORM_URL,
            NEXT_PUBLIC_APP_URL: PLATFORM_URL,
          },
        });

        const result = await resolvePublicTenantByHost(semHost, {
          db,
          env: {
            APP_URL: PLATFORM_URL,
            NEXT_PUBLIC_APP_URL: PLATFORM_URL,
          },
        });
        assert.equal(result.ok, true);
        if (result.ok) {
          assert.equal(result.tenantId, SEM_TENANT_ID);
          assert.equal(result.siteId, SEM_SITE_ID);
          assert.equal(result.source, "domain");
        }
      } finally {
        await db.collection(DOMAINS_COLLECTION).deleteOne({ _id: semHost });
      }
    });
  });

  it("C: host real ADL → T002", async (t) => {
    await withDb(t, async (db) => {
      await ensureAdlTenantFoundation(db, {
        env: {
          APP_URL: PLATFORM_URL,
          NEXT_PUBLIC_APP_URL: PLATFORM_URL,
          ADL_DEV_HOST: ADL_DEV_HOST_DEFAULT,
        },
      });

      const result = await resolvePublicTenantByHost(ADL_DEV_HOST_DEFAULT, {
        db,
        env: {
          APP_URL: PLATFORM_URL,
          NEXT_PUBLIC_APP_URL: PLATFORM_URL,
        },
      });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.tenantId, ADL_TENANT_ID);
        assert.equal(result.siteId, ADL_SITE_ID);
        assert.equal(result.source, "domain");
      }
    });
  });

  it("D: host desconocido no adquiere tenant por APP_URL", async (t) => {
    await withDb(t, async (db) => {
      const unknown = "iso-unknown-host.example.test";
      const result = await resolvePublicTenantByHost(unknown, {
        db,
        env: {
          APP_URL: `https://${unknown}`,
          NEXT_PUBLIC_APP_URL: `https://${unknown}`,
        },
      });
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.reason, "unknown_host");
      }
    });
  });

  it("E: cambiar APP_URL no cambia identidad de tenants existentes", async (t) => {
    await withDb(t, async (db) => {
      const semHost = `iso-sem-stable-${Date.now()}.test`;
      try {
        await ensureSemTenantFoundation(db, { hosts: [semHost] });
        await ensureAdlTenantFoundation(db);

        const envA = {
          APP_URL: "http://localhost:3000",
          NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        };
        const envB = {
          APP_URL: PLATFORM_URL,
          NEXT_PUBLIC_APP_URL: PLATFORM_URL,
        };

        const semA = await resolvePublicTenantByHost(semHost, { db, env: envA });
        const semB = await resolvePublicTenantByHost(semHost, { db, env: envB });
        assert.equal(semA.ok, true);
        assert.equal(semB.ok, true);
        if (semA.ok && semB.ok) {
          assert.equal(semA.tenantId, SEM_TENANT_ID);
          assert.equal(semB.tenantId, SEM_TENANT_ID);
          assert.equal(semA.siteId, semB.siteId);
          assert.equal(semA.source, "domain");
          assert.equal(semB.source, "domain");
        }

        const adlA = await resolvePublicTenantByHost(ADL_DEV_HOST_DEFAULT, {
          db,
          env: envA,
        });
        const adlB = await resolvePublicTenantByHost(ADL_DEV_HOST_DEFAULT, {
          db,
          env: envB,
        });
        assert.equal(adlA.ok, true);
        assert.equal(adlB.ok, true);
        if (adlA.ok && adlB.ok) {
          assert.equal(adlA.tenantId, ADL_TENANT_ID);
          assert.equal(adlB.tenantId, ADL_TENANT_ID);
        }

        const platformA = await resolvePublicTenantByHost(PLATFORM_HOST, {
          db,
          env: envA,
        });
        const platformB = await resolvePublicTenantByHost(PLATFORM_HOST, {
          db,
          env: envB,
        });
        assert.equal(platformA.ok, false);
        assert.equal(platformB.ok, false);
      } finally {
        await db.collection(DOMAINS_COLLECTION).deleteOne({ _id: semHost });
      }
    });
  });

  it("foundation no registra host canónico de plataforma como legacy SEM", async (t) => {
    await withDb(t, async (db) => {
      const domains = db.collection<DomainDocument>(DOMAINS_COLLECTION);
      await domains.deleteOne({ _id: PLATFORM_HOST });

      const result = await ensureSemTenantFoundation(db, {
        env: {
          APP_URL: PLATFORM_URL,
          NEXT_PUBLIC_APP_URL: PLATFORM_URL,
        },
      });

      assert.equal(result.hosts.includes(PLATFORM_HOST), false);
      assert.deepEqual(result.hosts, []);
      const created = await domains.findOne({ host: PLATFORM_HOST });
      assert.equal(created, null);
    });
  });
});
