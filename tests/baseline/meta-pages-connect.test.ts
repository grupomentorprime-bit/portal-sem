import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import {
  completeMetaPagesConnection,
  type MetaPageConnectionStore,
} from "../../src/core/growth/meta-pages/complete";
import { getMetaPagesPublicConfig } from "../../src/core/growth/meta-pages/config";
import {
  createMetaPagesConnectState,
  verifyMetaPagesConnectState,
} from "../../src/core/growth/meta-pages/state";
import type { MetaPageConnection } from "../../src/core/growth/meta-pages/types";

const TOKEN = "page-token-should-not-leak";

function memoryStore(): MetaPageConnectionStore & { all: MetaPageConnection[] } {
  const all: MetaPageConnection[] = [];
  return {
    all,
    async listByTenant(tenantId) {
      return all.filter((item) => item.tenantId === tenantId);
    },
    async upsert(connection) {
      const index = all.findIndex(
        (item) => item.tenantId === connection.tenantId && item.channel === connection.channel
      );
      if (index >= 0) all[index] = connection;
      else all.push(connection);
      return connection;
    },
  };
}

describe("conexión Instagram y Facebook", () => {
  const previous = process.env.SESSION_SECRET;

  before(() => {
    process.env.SESSION_SECRET = "test-session-secret-meta-pages";
  });

  after(() => {
    if (previous === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = previous;
  });

  it("no marca lista la autorización de páginas si falta su config", () => {
    const config = getMetaPagesPublicConfig({
      META_APP_ID: "123456",
      META_APP_SECRET: "secret",
    } as NodeJS.ProcessEnv);
    assert.equal(config.ready, false);
    assert.deepEqual(config.missing, ["META_PAGES_CONFIG_ID"]);
  });

  it("guarda la página y la cuenta de Instagram sin devolver el token", async () => {
    const store = memoryStore();
    const state = createMetaPagesConnectState("tenant-a");
    const result = await completeMetaPagesConnection(
      store,
      {
        async exchangeCode() {
          return { ok: true, accessToken: "user-token" };
        },
        async listPages() {
          return {
            ok: true,
            pages: [
              {
                pageId: "page-1",
                pageName: "Seminario",
                pageAccessToken: TOKEN,
                instagramId: "ig-1",
                instagramUsername: "seminario",
              },
            ],
          };
        },
      },
      {
        tenantId: "tenant-a",
        state,
        code: "auth-code",
        appId: "123456",
        appSecret: "secret",
        now: "2026-11-17T00:00:00.000Z",
      }
    );

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(JSON.stringify(result).includes(TOKEN), false);
    assert.equal(result.channels.find((item) => item.channel === "instagram")?.status, "authorized");
    assert.equal(result.channels.find((item) => item.channel === "instagram")?.accountLabel, "seminario");
    assert.equal(result.channels.find((item) => item.channel === "facebook")?.accountLabel, "Seminario");
    assert.equal(result.channels.every((item) => item.receivesMessages === false), true);
    assert.equal(store.all.every((item) => item.accessToken === TOKEN), true);
  });

  it("rechaza un state de otro Espacio", async () => {
    const state = createMetaPagesConnectState("tenant-a");
    assert.equal(verifyMetaPagesConnectState(state, { expectedTenantId: "tenant-b" }).ok, false);
    const result = await completeMetaPagesConnection(
      memoryStore(),
      {
        async exchangeCode() {
          return { ok: true, accessToken: "user-token" };
        },
        async listPages() {
          return { ok: true, pages: [] };
        },
      },
      {
        tenantId: "tenant-b",
        state,
        code: "auth-code",
        appId: "123456",
        appSecret: "secret",
      }
    );
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.reason, "state_tenant_mismatch");
  });
});
