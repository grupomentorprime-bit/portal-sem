/**
 * Dominio propio de un Espacio desde Platform Admin.
 * El subdominio se conserva; el dominio del cliente pasa a ser la dirección principal.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient, type Db } from "mongodb";
import {
  DOMAINS_COLLECTION,
  SITES_COLLECTION,
  TENANTS_COLLECTION,
} from "../../src/core/tenant/constants";
import { checkCustomDomainDns, connectCustomDomain } from "../../src/core/tenant/custom-domain-connect";
import { customDomainOriginIp } from "../../src/core/tenant/custom-domain-origin";
import {
  customDomainCnameTarget,
  customDomainDnsRecords,
  customDomainHostSet,
} from "../../src/core/tenant/custom-domain-records";
import { ensureDokployDomains } from "../../src/core/tenant/dokploy-domain";
import {
  customDomainDnsTarget,
  interpretCustomDomainInput,
  setSpaceCustomDomain,
  SetSpaceCustomDomainError,
} from "../../src/core/tenant/space-custom-domain";
import type { DomainDocument, SiteDocument, TenantDocument } from "../../src/core/tenant/types";
import { loadEnvLocal } from "../../src/core/migrations/env";

const ROOT = process.cwd();
const ENV = {
  APP_URL: "https://growthos.mentorprime.cl",
  NEXT_PUBLIC_APP_URL: "https://growthos.mentorprime.cl",
  SPACE_BASE_DOMAIN: "mentorprime.cl",
};

const TENANT_ID = "zz-domain-cfg-test";
const SITE_ID = "zz-domain-cfg-test";

function readSrc(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

function loadDotEnv(): void {
  loadEnvLocal();
  const envPath = resolve(ROOT, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

describe("dominio propio del Espacio", () => {
  it("vacío o el propio subdominio vuelven al subdominio; un dominio del cliente se guarda", () => {
    assert.deepEqual(interpretCustomDomainInput("academia-adl", "", ENV), {
      action: "clear",
    });
    assert.deepEqual(
      interpretCustomDomainInput("academia-adl", "academia-adl.mentorprime.cl", ENV),
      { action: "clear" }
    );
    assert.deepEqual(
      interpretCustomDomainInput("academia-adl", "https://www.cliente.cl/inicio", ENV),
      { action: "set", host: "www.cliente.cl" }
    );
    assert.equal(customDomainDnsTarget(ENV), "growthos.mentorprime.cl");
    assert.equal(
      customDomainDnsTarget({ APP_URL: "http://localhost:3000" }),
      "growthos.mentorprime.cl"
    );
  });

  it("rechaza plataforma, panel del servidor y el subdominio de otro Espacio", () => {
    for (const host of [
      "growthos.mentorprime.cl",
      "dokploy.mentorprime.cl",
      "deploy.mentorprime.cl",
      "localhost",
    ]) {
      assert.throws(
        () => interpretCustomDomainInput("academia-adl", host, ENV),
        (error: unknown) =>
          error instanceof SetSpaceCustomDomainError &&
          (error.code === "reserved_host" || error.code === "invalid_host")
      );
    }
    assert.throws(
      () => interpretCustomDomainInput("academia-adl", "fundacion-mueve.mentorprime.cl", ENV),
      (error: unknown) =>
        error instanceof SetSpaceCustomDomainError && error.code === "foreign_subdomain"
    );
  });

  it("el dominio raíz y www se conectan con un CNAME, sin mostrar la IP del servidor", () => {
    assert.deepEqual(customDomainHostSet("www.cliente.cl"), {
      canonical: "cliente.cl",
      hosts: ["cliente.cl", "www.cliente.cl"],
    });
    assert.deepEqual(customDomainHostSet("cliente.cl"), {
      canonical: "cliente.cl",
      hosts: ["cliente.cl", "www.cliente.cl"],
    });
    assert.deepEqual(customDomainHostSet("blog.cliente.cl"), {
      canonical: "blog.cliente.cl",
      hosts: ["blog.cliente.cl"],
    });
    assert.equal(customDomainCnameTarget({}), "dominios.mentorprime.cl");
    assert.equal(
      customDomainCnameTarget({ CUSTOM_DOMAIN_CNAME_TARGET: "212.47.70.32" }),
      "dominios.mentorprime.cl"
    );
    assert.deepEqual(customDomainDnsRecords("cliente.cl", "dominios.mentorprime.cl"), [
      {
        type: "CNAME",
        host: "cliente.cl",
        name: "cliente.cl",
        value: "dominios.mentorprime.cl",
      },
      {
        type: "CNAME",
        host: "www.cliente.cl",
        name: "www.cliente.cl",
        value: "dominios.mentorprime.cl",
      },
    ]);
    assert.equal(customDomainOriginIp({}), "212.47.70.32");
    const panel = readSrc("src/components/platform/PlatformSpaceDomainPanel.tsx");
    const clientDomain = readSrc("src/app/admin/site/domain/page.tsx");
    const platformDomain = readSrc("src/components/platform/PlatformSpaceDetailView.tsx");
    assert.match(panel, /Comprobar conexión/);
    assert.match(panel, /Crea estos CNAME/);
    assert.match(panel, /No uses una IP/);
    assert.doesNotMatch(panel, /212\.47\.70\.32|originIp|registros A/);
    assert.match(clientDomain, /cnameTarget=\{customDomainCnameTarget\(\)\}/);
    assert.match(platformDomain, /cnameTarget=\{customDomainCnameTarget\(\)\}/);
    assert.doesNotMatch(clientDomain, /originIp|customDomainOriginIp|212\.47\.70\.32/);
    assert.doesNotMatch(platformDomain, /originIp|customDomainOriginIp|212\.47\.70\.32/);
    const records = readSrc("src/core/tenant/custom-domain-records.ts");
    assert.doesNotMatch(records, /212\.47\.70\.32/);
  });

  it("la comprobación acepta el CNAME y no revela la IP", async () => {
    const target = "dominios.mentorprime.cl";
    const pending = await checkCustomDomainDns("cliente.cl", {
      cnameTarget: target,
      resolveCname: async () => [],
    });
    assert.equal(pending.status, "pending");

    const wrong = await checkCustomDomainDns("cliente.cl", {
      cnameTarget: target,
      resolveCname: async () => ["212.47.70.32"],
    });
    assert.equal(wrong.status, "mismatch");
    assert.equal(wrong.message, `El CNAME debe apuntar a ${target}.`);
    assert.doesNotMatch(wrong.message, /212\.47\.70\.32/);

    const ready = await checkCustomDomainDns("cliente.cl", {
      cnameTarget: target,
      resolveCname: async () => ["dominios.mentorprime.cl."],
    });
    assert.equal(ready.status, "dns_ready");
    assert.equal(ready.records.length, 2);

    const missingKey = await ensureDokployDomains(["cliente.cl"], {});
    assert.equal(missingKey.configured, false);

    const withoutCertificate = await connectCustomDomain("cliente.cl", {
      cnameTarget: target,
      resolveCname: async () => ["dominios.mentorprime.cl"],
      env: {},
    });
    assert.equal(withoutCertificate.status, "dns_ready");

    const requested: string[] = [];
    const connected = await connectCustomDomain("cliente.cl", {
      cnameTarget: target,
      resolveCname: async () => ["dominios.mentorprime.cl"],
      env: {
        DOKPLOY_API_KEY: "test-key",
        DOKPLOY_API_URL: "https://dokploy.example",
        DOKPLOY_APPLICATION_ID: "app",
      },
      fetchImpl: async (input) => {
        requested.push(String(input));
        return new Response(JSON.stringify({ result: { data: { json: {} } } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    });
    assert.equal(connected.status, "connected");
    assert.equal(requested.filter((url) => url.includes("domain.create")).length, 2);
  });

  it("la ficha y la API exponen la actualización solo al operador de plataforma", () => {
    const view = readSrc("src/components/platform/PlatformSpaceDetailView.tsx");
    const route = readSrc("src/app/api/platform/spaces/[tenantId]/domain/route.ts");
    assert.match(view, /PlatformSpaceDomainPanel/);
    assert.match(view, /Dominio del cliente|customDomain/);
    assert.match(route, /requirePlatformOperator/);
    assert.match(route, /setPlatformSpaceCustomDomain/);
    assert.match(route, /checkPlatformSpaceCustomDomain/);
  });

  it("el Dominio del Espacio guarda el dominio propio de la sesión", () => {
    const route = readSrc("src/app/api/admin/site/domain/route.ts");
    const page = readSrc("src/app/admin/site/domain/page.tsx");
    assert.match(route, /requirePermission\("settings.update"\)/);
    assert.match(route, /ctx\.tenantId/);
    assert.match(route, /setPlatformSpaceCustomDomain/);
    assert.match(route, /checkPlatformSpaceCustomDomain/);
    assert.doesNotMatch(route, /context\.params|searchParams/);
    assert.match(page, /endpoint="\/api\/admin\/site\/domain"/);
  });

  it("al guardar un dominio propio deja el subdominio y lo marca principal", async () => {
    loadDotEnv();
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;
    if (!uri || !dbName) return;

    const previous = {
      APP_URL: process.env.APP_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      SPACE_BASE_DOMAIN: process.env.SPACE_BASE_DOMAIN,
    };
    process.env.APP_URL = ENV.APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = ENV.NEXT_PUBLIC_APP_URL;
    process.env.SPACE_BASE_DOMAIN = ENV.SPACE_BASE_DOMAIN;

    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8_000 });
    try {
      await client.connect();
      const db = client.db(dbName);
      await seedSpace(db);

      const set = await setSpaceCustomDomain(db, {
        tenantId: TENANT_ID,
        host: "www.cliente-prueba.cl",
        actorUserId: "test-operator",
      });
      assert.equal(set.customDomain, "cliente-prueba.cl");
      assert.equal(set.primaryHost, "cliente-prueba.cl");
      assert.equal(set.subdomain, "zz-domain-cfg-test.mentorprime.cl");
      assert.deepEqual(set.records.map((record) => record.host).sort(), [
        "cliente-prueba.cl",
        "www.cliente-prueba.cl",
      ]);
      const stored = await db
        .collection<DomainDocument>(DOMAINS_COLLECTION)
        .find({ tenantId: TENANT_ID, kind: "custom" })
        .toArray();
      assert.deepEqual(stored.map((domain) => domain.host).sort(), [
        "cliente-prueba.cl",
        "www.cliente-prueba.cl",
      ]);

      const cleared = await setSpaceCustomDomain(db, {
        tenantId: TENANT_ID,
        host: "",
        actorUserId: "test-operator",
      });
      assert.equal(cleared.customDomain, null);
      assert.equal(cleared.primaryHost, "zz-domain-cfg-test.mentorprime.cl");
    } finally {
      try {
        const db = client.db(dbName);
        await db.collection(DOMAINS_COLLECTION).deleteMany({ tenantId: TENANT_ID });
        await db.collection(SITES_COLLECTION).deleteMany({ tenantId: TENANT_ID });
        await db.collection(TENANTS_COLLECTION).deleteMany({ tenantId: TENANT_ID });
        await db.collection("identity_audit").deleteMany({ entityId: TENANT_ID });
      } catch {
        /* la base no llegó a abrirse */
      }
      await client.close().catch(() => undefined);
      process.env.APP_URL = previous.APP_URL;
      process.env.NEXT_PUBLIC_APP_URL = previous.NEXT_PUBLIC_APP_URL;
      process.env.SPACE_BASE_DOMAIN = previous.SPACE_BASE_DOMAIN;
    }
  });
});

async function seedSpace(db: Db): Promise<void> {
  const at = new Date().toISOString();
  const tenant: TenantDocument = {
    _id: TENANT_ID,
    tenantId: TENANT_ID,
    code: "TTEST",
    name: "Cliente de prueba",
    slug: TENANT_ID,
    status: "active",
    type: "business",
    defaultSiteId: SITE_ID,
    createdAt: at,
    updatedAt: at,
  };
  const site: SiteDocument = {
    _id: SITE_ID,
    siteId: SITE_ID,
    tenantId: TENANT_ID,
    code: "STEST",
    name: "Sitio de prueba",
    slug: TENANT_ID,
    status: "active",
    isDefault: true,
    createdAt: at,
    updatedAt: at,
  };
  const domain: DomainDocument = {
    _id: `${TENANT_ID}.mentorprime.cl`,
    host: `${TENANT_ID}.mentorprime.cl`,
    tenantId: TENANT_ID,
    siteId: SITE_ID,
    isPrimary: true,
    kind: "platform_subdomain",
    createdAt: at,
    updatedAt: at,
  };
  await db.collection(TENANTS_COLLECTION).replaceOne({ _id: TENANT_ID }, tenant, { upsert: true });
  await db.collection(SITES_COLLECTION).replaceOne({ _id: SITE_ID }, site, { upsert: true });
  await db.collection(DOMAINS_COLLECTION).replaceOne({ _id: domain._id }, domain, { upsert: true });
}
