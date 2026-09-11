/**
 * OT-GROWTH-SAAS-005 — cuenta multi-Espacio (activeTenantId).
 * Fixtures aislados: no toca SEM productivo.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient, type Db } from "mongodb";
import { pickActiveTenantId } from "../../src/core/identity/spaces/pick-active-tenant";
import { SEM_TENANT_ID } from "../../src/core/tenant/constants";
import { loadEnvLocal } from "../../src/core/migrations/env";

const FIX_A = "tenant-saas005-a";
const FIX_B = "tenant-saas005-b";
const FIX_USER = "user-saas005-fixture";

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

describe("OT-GROWTH-SAAS-005 — pickActiveTenantId (puro)", () => {
  it("1 Espacio → ese tenant; N → preferred válido o el más antiguo", () => {
    assert.equal(pickActiveTenantId([]), null);
    assert.equal(
      pickActiveTenantId([{ tenantId: FIX_A, joinedAt: "2026-01-02T00:00:00.000Z" }]),
      FIX_A
    );

    const many = [
      { tenantId: FIX_B, joinedAt: "2026-01-02T00:00:00.000Z" },
      { tenantId: FIX_A, joinedAt: "2026-01-01T00:00:00.000Z" },
    ];
    assert.equal(pickActiveTenantId(many, FIX_B), FIX_B);
    assert.equal(pickActiveTenantId(many, "no-existe"), FIX_A);
    assert.equal(pickActiveTenantId(many), FIX_A);
  });

  it("preferred obsoleto → otro válido; cero → null", () => {
    const one = [{ tenantId: FIX_A, joinedAt: "2026-01-01T00:00:00.000Z" }];
    assert.equal(pickActiveTenantId(one, FIX_B), FIX_A);
    assert.equal(pickActiveTenantId([], FIX_A), null);
  });
});

describe("OT-GROWTH-SAAS-005 — contratos de código", () => {
  it("sesión / switch / sin-espacio / Keycloak no ata a host obligatorio", () => {
    const active = readSrc("src/lib/identity/active-space.ts");
    assert.match(active, /reconcileSessionActiveTenant/);
    assert.match(active, /assertActiveMembership/);

    const switchRoute = readSrc("src/app/api/identity/spaces/switch/route.ts");
    assert.match(switchRoute, /assertActiveMembership/);
    assert.match(switchRoute, /redirectedTo:\s*"\/admin"/);

    const callback = readSrc("src/app/api/identity/auth/keycloak/callback/route.ts");
    assert.match(callback, /preferredTenantId/);
    assert.match(callback, /resolvePostAuthDestination/);
    assert.doesNotMatch(callback, /getActiveTenantId/);

    const landing = readSrc("src/core/identity/platform/landing.ts");
    assert.match(landing, /sin-espacio/);
    assert.match(landing, /\/platform/);

    const login = readSrc("src/core/identity/auth/login.ts");
    assert.match(login, /preferredTenantId/);
    assert.match(login, /resolveActiveTenantForUser/);

    const guard = readSrc("src/core/security/tenant-guard.ts");
    assert.match(guard, /loadSessionContext/);
    assert.match(guard, /Sin Espacio activo/);

    const layout = readSrc("src/app/admin/layout.tsx");
    assert.match(layout, /sin-espacio/);
    assert.match(layout, /listAvailableSpacesForUser/);

    const menu = readSrc("src/components/admin/AdminUserMenuPanel.tsx");
    assert.match(menu, /MenuSection label="Espacio"/);
    assert.match(menu, /spaces\/switch/);
  });
});

describe("OT-GROWTH-SAAS-005 — fixtures Mongo (sin contaminar SEM)", () => {
  it("membresías activas / inactivas / switch bloqueado / recuperación", async () => {
    await withDb(async (db) => {
      const memberships = db.collection<{
        _id: string;
        tenantId: string;
        userId: string;
        roleIds: string[];
        status: string;
        joinedAt: string;
        createdAt: string;
        updatedAt: string;
      }>("identity_memberships");
      const sessions = db.collection<{
        _id: string;
        userId: string;
        tenantId: string;
        createdAt: string;
        expiresAt: string;
        lastActivity: string;
      }>("identity_sessions");
      const tenants = db.collection<{
        _id: string;
        tenantId: string;
        code: string;
        name: string;
        slug: string;
        status: string;
        type: string;
        defaultSiteId: string;
        createdAt: string;
        updatedAt: string;
      }>("tenants");

      // Limpieza de fixtures previos (nunca SEM).
      await memberships.deleteMany({ userId: FIX_USER });
      await sessions.deleteMany({ userId: FIX_USER });
      await tenants.deleteMany({ tenantId: { $in: [FIX_A, FIX_B] } });

      const now = new Date().toISOString();
      await tenants.insertMany([
        {
          _id: FIX_A,
          tenantId: FIX_A,
          code: "T005A",
          name: "Fixture A",
          slug: FIX_A,
          status: "active",
          type: "platform",
          defaultSiteId: FIX_A,
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: FIX_B,
          tenantId: FIX_B,
          code: "T005B",
          name: "Fixture B",
          slug: FIX_B,
          status: "active",
          type: "platform",
          defaultSiteId: FIX_B,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      await memberships.insertMany([
        {
          _id: "mem-saas005-a",
          tenantId: FIX_A,
          userId: FIX_USER,
          roleIds: [],
          status: "active",
          joinedAt: "2026-01-01T00:00:00.000Z",
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: "mem-saas005-b",
          tenantId: FIX_B,
          userId: FIX_USER,
          roleIds: [],
          status: "active",
          joinedAt: "2026-01-02T00:00:00.000Z",
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const active = await memberships
        .find({ userId: FIX_USER, status: "active" })
        .toArray();
      assert.equal(active.length, 2);
      assert.equal(pickActiveTenantId(active, FIX_B), FIX_B);
      assert.equal(pickActiveTenantId(active, SEM_TENANT_ID), FIX_A);

      // Membresía inactiva no cuenta.
      await memberships.updateOne(
        { _id: "mem-saas005-b" },
        { $set: { status: "suspended" } }
      );
      const stillActive = await memberships
        .find({ userId: FIX_USER, status: "active" })
        .toArray();
      assert.equal(pickActiveTenantId(stillActive, FIX_B), FIX_A);

      // Sesión con activeTenantId obsoleto → picker elige otro.
      const sessionId = "sess-saas005-stale";
      await sessions.insertOne({
        _id: sessionId,
        userId: FIX_USER,
        tenantId: FIX_B,
        createdAt: now,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        lastActivity: now,
      });
      const stale = await sessions.findOne({ _id: sessionId });
      assert.ok(stale);
      assert.equal(stale!.tenantId, FIX_B);
      const recovered = pickActiveTenantId(stillActive, stale!.tenantId);
      assert.equal(recovered, FIX_A);

      // Switch a tenant sin membresía activa → bloqueado (simulación de assert).
      const noMem = await memberships.findOne({
        userId: FIX_USER,
        tenantId: FIX_B,
        status: "active",
      });
      assert.equal(noMem, null);

      // SEM intacto: no creamos membresías SEM para FIX_USER.
      const semLeak = await memberships.findOne({
        userId: FIX_USER,
        tenantId: SEM_TENANT_ID,
      });
      assert.equal(semLeak, null);

      // Cleanup fixtures.
      await memberships.deleteMany({ userId: FIX_USER });
      await sessions.deleteMany({ userId: FIX_USER });
      await tenants.deleteMany({ tenantId: { $in: [FIX_A, FIX_B] } });
    });
  });
});
