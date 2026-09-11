/**
 * OT-GROWTH-PROD-002 — correo con identidad del Espacio.
 * Transporte (Resend / EMAIL_FROM) ≠ identidad (site_config + Domain).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient, type Db } from "mongodb";
import {
  ADL_SITE_ID,
  ADL_TENANT_ID,
  DOMAINS_COLLECTION,
  SEM_SITE_ID,
  SEM_TENANT_ID,
  SITE_CONFIG_COLLECTION,
} from "../../src/core/tenant/constants";
import { ADL_SITE_IDENTITY, applyAdlSiteIdentity } from "../../src/core/tenant/adl-site-identity";
import { applySemSiteIdentity, SEM_SITE_IDENTITY } from "../../src/core/tenant/sem-site-identity";
import { createDefaultSiteConfig } from "../../src/lib/cms/defaults";
import {
  emailAbsoluteUrl,
  originFromHost,
  pickEmailOrigin,
  resolveEmailIdentity,
  type EmailDomainHint,
} from "../../src/lib/notifications/identity";
import {
  DEFAULT_TECHNICAL_MAILBOX,
  formatFromHeader,
  parseTechnicalMailbox,
} from "../../src/lib/notifications/transport";
import { loadEnvLocal } from "../../src/core/migrations/env";
import type { DomainDocument, SiteConfigDocument } from "../../src/core/tenant/types";
import type { SiteConfig } from "../../src/types/cms";

const FIX_TENANT = "tenant-prod002";
const FIX_SITE = "tenant-prod002";
const FIX_HOST = "prod002.localhost:3000";

const LEGACY_COPY = [
  "Portal SEM",
  "Learning OS",
  "AprendeHoy Learning OS",
  "CMS del SEM",
];

const NOTIFICATION_FILES = [
  "src/lib/notifications/email.ts",
  "src/lib/notifications/email-layout.ts",
  "src/lib/notifications/identity.ts",
  "src/lib/notifications/transport.ts",
  "src/lib/notifications/resolve-identity.ts",
  "src/lib/notifications/convocatoria-confirmation-email.ts",
  "src/lib/notifications/convocatoria-follow-up-email.ts",
  "src/lib/notifications/handoff-validation-email.ts",
  "scripts/test-resend.ts",
];

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

function configFromSiteDoc(doc: SiteConfigDocument): SiteConfig {
  const base = createDefaultSiteConfig();
  const institution = (doc.institution ?? {}) as Partial<SiteConfig["institution"]>;
  const contact = (doc.contact ?? {}) as Partial<SiteConfig["contact"]>;
  return {
    ...base,
    institution: { ...base.institution, ...institution },
    contact: { ...base.contact, ...contact },
  };
}

function identityFor(
  tenantId: string,
  siteId: string,
  config: SiteConfig,
  domains: EmailDomainHint[]
) {
  const origin = pickEmailOrigin({
    tenantId,
    siteId,
    domains,
    website: config.institution.website,
  });
  return resolveEmailIdentity({ config, tenantId, siteId, origin });
}

describe("OT-GROWTH-PROD-002 — transporte vs identidad", () => {
  it("EMAIL_FROM aporta el buzón técnico; ignora el nombre visible legado", () => {
    assert.equal(parseTechnicalMailbox(""), DEFAULT_TECHNICAL_MAILBOX);
    assert.equal(
      parseTechnicalMailbox("Portal SEM <noreply@growth.example>"),
      "noreply@growth.example"
    );
    assert.equal(
      parseTechnicalMailbox("Growth OS <proceso@growth.example>"),
      "proceso@growth.example"
    );
    assert.equal(parseTechnicalMailbox("noreply@growth.example"), "noreply@growth.example");

    const from = formatFromHeader("Academia ADL", "noreply@growth.example");
    assert.match(from, /Academia ADL/);
    assert.match(from, /noreply@growth\.example/);
    assert.doesNotMatch(from, /Portal SEM/);
    assert.doesNotMatch(from, /Seminario/);
  });

  it("transporte no lee site_config ni TenantContext", () => {
    const transport = readSrc("src/lib/notifications/transport.ts");
    assert.doesNotMatch(transport, /site_config/);
    assert.doesNotMatch(transport, /getSiteConfig/);
    assert.doesNotMatch(transport, /getTenantContext/);
    assert.doesNotMatch(transport, /RESEND_API_KEY.*site_config/);
    assert.match(transport, /EMAIL_FROM/);
    assert.match(transport, /getTechnicalMailbox/);
  });

  it("identidad no importa Resend ni secretos de env", () => {
    const identity = readSrc("src/lib/notifications/identity.ts");
    assert.doesNotMatch(identity, /resend/i);
    assert.doesNotMatch(identity, /RESEND_API_KEY/);
    assert.doesNotMatch(identity, /EMAIL_FROM/);
    assert.match(identity, /PLATFORM_DISPLAY_NAME/);
  });
});

describe("OT-GROWTH-PROD-002 — identidad del Espacio", () => {
  it("SEM originado usa nombre y reply-to SEM; ADL usa ADL; vacío → Growth OS", () => {
    const semConfig = applySemSiteIdentity(createDefaultSiteConfig());
    const adlConfig = applyAdlSiteIdentity(createDefaultSiteConfig());
    const empty = createDefaultSiteConfig();

    const semDomains: EmailDomainHint[] = [
      {
        host: "seminarioipn.cl",
        tenantId: SEM_TENANT_ID,
        siteId: SEM_SITE_ID,
        isPrimary: true,
      },
      {
        host: "adl.localhost:3000",
        tenantId: ADL_TENANT_ID,
        siteId: ADL_SITE_ID,
        isPrimary: true,
      },
    ];
    const adlDomains: EmailDomainHint[] = [...semDomains];

    const sem = identityFor(SEM_TENANT_ID, SEM_SITE_ID, semConfig, semDomains);
    const adl = identityFor(ADL_TENANT_ID, ADL_SITE_ID, adlConfig, adlDomains);
    const none = resolveEmailIdentity({ config: empty, tenantId: "acme", siteId: "acme" });

    assert.equal(sem.displayName, SEM_SITE_IDENTITY.institution.name);
    assert.equal(sem.replyTo, SEM_SITE_IDENTITY.contact.email);
    assert.equal(sem.origin, "https://seminarioipn.cl");
    assert.doesNotMatch(sem.origin, /adl/);
    assert.doesNotMatch(JSON.stringify(sem), /Academia ADL/);

    assert.equal(adl.displayName, ADL_SITE_IDENTITY.institution.name);
    assert.notEqual(adl.displayName, sem.displayName);
    assert.equal(adl.origin, "http://adl.localhost:3000");
    assert.doesNotMatch(adl.origin, /seminarioipn/);
    assert.doesNotMatch(JSON.stringify(adl), /Seminario Eclesiástico Mayor/);
    assert.doesNotMatch(JSON.stringify(adl), /seminarioipn/);

    assert.equal(none.displayName, "Growth OS");
    assert.equal(none.replyTo, undefined);
    assert.doesNotMatch(none.displayName, /SEM/);
    assert.doesNotMatch(none.displayName, /Seminario/);
    assert.doesNotMatch(none.displayName, /Portal/);
  });

  it("links se construyen desde el origen del Site dueño", () => {
    const sem = resolveEmailIdentity({
      tenantId: SEM_TENANT_ID,
      siteId: SEM_SITE_ID,
      origin: "https://seminarioipn.cl",
      config: applySemSiteIdentity(createDefaultSiteConfig()),
    });
    const adl = resolveEmailIdentity({
      tenantId: ADL_TENANT_ID,
      siteId: ADL_SITE_ID,
      origin: "http://adl.localhost:3000",
      config: applyAdlSiteIdentity(createDefaultSiteConfig()),
    });

    const semInvite = emailAbsoluteUrl(sem, "/invite/token-sem");
    const adlInvite = emailAbsoluteUrl(adl, "/invite/token-adl");
    assert.equal(semInvite, "https://seminarioipn.cl/invite/token-sem");
    assert.equal(adlInvite, "http://adl.localhost:3000/invite/token-adl");
    assert.doesNotMatch(adlInvite, /seminarioipn/);
    assert.doesNotMatch(semInvite, /adl\.localhost/);
  });

  it("originFromHost distingue loopback de dominio público", () => {
    assert.equal(originFromHost("localhost:3000"), "http://localhost:3000");
    assert.equal(originFromHost("adl.localhost:3000"), "http://adl.localhost:3000");
    assert.equal(originFromHost("seminarioipn.cl"), "https://seminarioipn.cl");
  });

  it("un Espacio no puede construir origen con dominios de otro", () => {
    assert.equal(
      pickEmailOrigin({
        tenantId: ADL_TENANT_ID,
        siteId: ADL_SITE_ID,
        domains: [
          {
            host: "seminarioipn.cl",
            tenantId: SEM_TENANT_ID,
            siteId: SEM_SITE_ID,
            isPrimary: true,
          },
        ],
      }),
      ""
    );
    assert.equal(
      pickEmailOrigin({
        tenantId: SEM_TENANT_ID,
        siteId: SEM_SITE_ID,
        domains: [
          {
            host: "adl.localhost:3000",
            tenantId: ADL_TENANT_ID,
            siteId: ADL_SITE_ID,
            isPrimary: true,
          },
        ],
      }),
      ""
    );
  });
});

describe("OT-GROWTH-PROD-002 — copy de motor sin cliente hardcodeado", () => {
  it("plantillas y transporte no contienen copy legado de producto", () => {
    for (const file of NOTIFICATION_FILES) {
      const src = readSrc(file);
      for (const marker of LEGACY_COPY) {
        assert.equal(
          src.includes(marker),
          false,
          `${file} contiene copy legado: ${marker}`
        );
      }
    }

    const confirmation = readSrc(
      "src/lib/notifications/convocatoria-confirmation-email.ts"
    );
    assert.doesNotMatch(confirmation, /Talca Aurora/);
    assert.match(confirmation, /resolveEmailIdentityForTenant/);
    assert.match(confirmation, /identity\.origin/);

    const invitation = readSrc("src/lib/notifications/email.ts");
    assert.doesNotMatch(invitation, /Invitación al CMS/);
    assert.doesNotMatch(invitation, /getAppBaseUrl/);
    assert.match(invitation, /formatFromHeader/);
    assert.match(invitation, /getTechnicalMailbox/);

    const envExample = readSrc(".env.example");
    assert.doesNotMatch(envExample, /Portal SEM/);
    assert.match(envExample, /buzón técnico/);
  });

  it("envíos resuelven identidad por tenantId, no por Host de request", () => {
    const resolver = readSrc("src/lib/notifications/resolve-identity.ts");
    assert.match(resolver, /getSiteConfigForTenant/);
    assert.match(resolver, /findDefaultSiteForTenant/);
    assert.match(resolver, /findDomainsBySiteId/);
    assert.doesNotMatch(resolver, /getTenantContext/);
  });
});

describe("OT-GROWTH-PROD-002 — fixture Mongo aislado", () => {
  it("SEM y ADL en DB no se cruzan; Site sin nombre → Growth OS", async () => {
    await withDb(async (db) => {
      const siteConfig = db.collection<SiteConfigDocument>(SITE_CONFIG_COLLECTION);
      const domains = db.collection<DomainDocument>(DOMAINS_COLLECTION);
      const at = new Date().toISOString();

      const semDoc = await siteConfig.findOne({
        $or: [{ _id: SEM_SITE_ID }, { siteId: SEM_SITE_ID, tenantId: SEM_TENANT_ID }],
      });
      const adlDoc = await siteConfig.findOne({
        $or: [{ _id: ADL_SITE_ID }, { siteId: ADL_SITE_ID, tenantId: ADL_TENANT_ID }],
      });
      const semDomains = await domains.find({ tenantId: SEM_TENANT_ID }).toArray();
      const adlDomains = await domains.find({ tenantId: ADL_TENANT_ID }).toArray();

      if (semDoc) {
        const sem = identityFor(
          SEM_TENANT_ID,
          SEM_SITE_ID,
          configFromSiteDoc(semDoc),
          semDomains
        );
        assert.equal(sem.displayName, SEM_SITE_IDENTITY.institution.name);
        if (sem.replyTo) {
          assert.equal(sem.replyTo, SEM_SITE_IDENTITY.contact.email);
        }
        if (sem.origin) {
          assert.doesNotMatch(sem.origin, /adl\.localhost/);
        }
        assert.doesNotMatch(JSON.stringify(sem), /Academia ADL/);
      }

      if (adlDoc) {
        const adl = identityFor(
          ADL_TENANT_ID,
          ADL_SITE_ID,
          configFromSiteDoc(adlDoc),
          adlDomains
        );
        assert.equal(adl.displayName, ADL_SITE_IDENTITY.institution.name);
        assert.doesNotMatch(JSON.stringify(adl), /Seminario Eclesiástico Mayor/);
        assert.doesNotMatch(JSON.stringify(adl), /seminarioipn/);
        if (adl.origin) {
          assert.doesNotMatch(adl.origin, /seminarioipn\.cl/);
        }
        if (semDoc) {
          const sem = identityFor(
            SEM_TENANT_ID,
            SEM_SITE_ID,
            configFromSiteDoc(semDoc),
            semDomains
          );
          assert.notEqual(adl.displayName, sem.displayName);
          if (adl.origin && sem.origin) {
            assert.notEqual(adl.origin, sem.origin);
          }
        }
      }

      const empty = createDefaultSiteConfig();
      empty.institution.tenant = FIX_TENANT;
      await siteConfig.deleteMany({ tenantId: FIX_TENANT });
      await domains.deleteMany({ tenantId: FIX_TENANT });
      await siteConfig.insertOne({
        _id: FIX_SITE,
        tenantId: FIX_TENANT,
        siteId: FIX_SITE,
        schemaVersion: empty.schemaVersion,
        modules: empty.modules,
        institution: { ...empty.institution, tenant: FIX_TENANT, name: "" },
        branding: empty.branding,
        seo: empty.seo,
        contact: empty.contact,
        social: empty.social,
        features: empty.features,
        portalCopy: empty.portalCopy,
        topBar: empty.topBar,
        portalExperience: empty.portalExperience,
        createdAt: at,
        updatedAt: at,
      });
      await domains.insertOne({
        _id: FIX_HOST,
        host: FIX_HOST,
        tenantId: FIX_TENANT,
        siteId: FIX_SITE,
        isPrimary: true,
        kind: "legacy",
        createdAt: at,
        updatedAt: at,
      });

      const fixtureDoc = await siteConfig.findOne({
        _id: FIX_SITE,
        tenantId: FIX_TENANT,
      });
      const fixtureDomains = await domains.find({ tenantId: FIX_TENANT }).toArray();
      assert.ok(fixtureDoc);
      const fixture = identityFor(
        FIX_TENANT,
        FIX_SITE,
        configFromSiteDoc(fixtureDoc),
        fixtureDomains
      );
      assert.equal(fixture.displayName, "Growth OS");
      assert.equal(fixture.origin, `http://${FIX_HOST}`);
      assert.doesNotMatch(fixture.displayName, /Seminario/);
      assert.doesNotMatch(JSON.stringify(fixture), /seminarioipn/);
      assert.doesNotMatch(JSON.stringify(fixture), /Academia ADL/);

      await siteConfig.deleteMany({ tenantId: FIX_TENANT });
      await domains.deleteMany({ tenantId: FIX_TENANT });
    });
  });
});
