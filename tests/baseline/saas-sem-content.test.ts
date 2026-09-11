/**
 * OT-GROWTH-SAAS-007 — contenido SEM fuera del runtime genérico.
 * T001 conserva pack SEM; Espacio vacío no hereda SEM/IPN/Talca/generaciones.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient, type Db } from "mongodb";
import { SEM_TENANT_ID } from "../../src/core/tenant/constants";
import { isSemTenant } from "../../src/core/tenant/is-sem";
import { materializeSemTenantContent } from "../../src/core/tenant/sem-content";
import { createSemDefaultForms } from "../../src/core/experience/forms/defaults";
import { listFormConvocatorias } from "../../src/lib/admin/forms-center";
import {
  getConvocatoriaGenerations,
  PLATFORM_CONVOCATORIA_GENERATIONS,
  SEM_CONVOCATORIA_GENERATIONS,
} from "../../src/lib/experience/forms/generations";
import {
  getDefaultMenusForTenant,
  PLATFORM_DEFAULT_MENUS,
  SEM_DEFAULT_MENUS,
} from "../../src/lib/cms/menu-defaults";
import { createEmptyAdmissionConfig } from "../../src/lib/portal/empty-admission";
import { resolveFooterContent, SEM_FOOTER_INSTITUTION } from "../../src/lib/portal/footer-content";
import { shouldUseHomeDemoContent } from "../../src/lib/portal/institutional-demo";
import { createDefaultSiteConfig } from "../../src/lib/cms/defaults";
import { loadEnvLocal } from "../../src/core/migrations/env";
import type { PortalFooterPremiumViewModel } from "../../src/types/footer-premium";

const FIX_TENANT = "tenant-saas007";

const SEM_MARKERS = [
  "Seminario Eclesiástico Mayor",
  "seminarioipn",
  "IPN Chile",
  "Talca Aurora",
  "G-2023",
  "IGLESIA PENTECOSTAL NAZARETH",
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

function containsSemMarker(text: string): boolean {
  const lower = text.toLowerCase();
  return SEM_MARKERS.some((marker) => lower.includes(marker.toLowerCase()));
}

function emptyFooterViewModel(): PortalFooterPremiumViewModel {
  return {
    settings: {
      showDescription: true,
      showNavigation: true,
      showContact: true,
      showSocial: true,
      showLegal: true,
      showNewsletter: false,
      showCertifications: false,
    },
    brand: {
      institutionName: "",
      institutionShortName: "",
      logoPrimary: "",
      tagline: "",
    },
    navigation: [],
    contact: null,
    social: [],
    legal: [],
    copyright: "",
    backToTopLabel: "Volver arriba",
  };
}

describe("OT-GROWTH-SAAS-007 — extracción SEM del core", () => {
  it("isSemTenant solo reconoce T001", () => {
    assert.equal(isSemTenant(SEM_TENANT_ID), true);
    assert.equal(isSemTenant(FIX_TENANT), false);
    assert.equal(isSemTenant(""), false);
  });

  it("Espacio vacío: menús/generaciones/convocatorias/admisión/footer sin SEM", () => {
    const menus = getDefaultMenusForTenant(FIX_TENANT);
    assert.equal(menus, PLATFORM_DEFAULT_MENUS);
    assert.equal(containsSemMarker(JSON.stringify(menus)), false);

    const generations = getConvocatoriaGenerations(FIX_TENANT);
    assert.deepEqual(generations, PLATFORM_CONVOCATORIA_GENERATIONS);
    assert.equal(
      generations.some((g) => g.value.startsWith("G-20")),
      false
    );

    assert.deepEqual(listFormConvocatorias(FIX_TENANT), []);

    const admission = createEmptyAdmissionConfig(FIX_TENANT);
    assert.equal(containsSemMarker(JSON.stringify(admission)), false);
    assert.equal(admission.hero.enabled, false);
    assert.ok(admission.sections.every((s) => !s.enabled));

    const footer = resolveFooterContent(emptyFooterViewModel(), {
      tenantId: FIX_TENANT,
    });
    assert.equal(footer.institution.sealLine3, "");
    assert.notEqual(
      footer.institution.sealLine3,
      SEM_FOOTER_INSTITUTION.sealLine3
    );
    assert.equal(footer.cta.title, "");
    assert.equal(shouldUseHomeDemoContent("/", FIX_TENANT), false);

    const defaults = createDefaultSiteConfig();
    assert.equal(containsSemMarker(JSON.stringify(defaults.institution)), false);
  });

  it("T001 conserva pack SEM (forms, generaciones, menús, convocatorias, footer)", () => {
    assert.equal(getDefaultMenusForTenant(SEM_TENANT_ID), SEM_DEFAULT_MENUS);
    assert.ok(containsSemMarker(JSON.stringify(SEM_DEFAULT_MENUS)));

    assert.deepEqual(
      getConvocatoriaGenerations(SEM_TENANT_ID),
      SEM_CONVOCATORIA_GENERATIONS
    );
    assert.ok(
      getConvocatoriaGenerations(SEM_TENANT_ID).some((g) => g.value === "G-2023")
    );

    const convocatorias = listFormConvocatorias(SEM_TENANT_ID);
    assert.ok(convocatorias.some((c) => c.formId.includes("talca-aurora")));

    const forms = createSemDefaultForms(SEM_TENANT_ID);
    assert.ok(forms.some((f) => f._id.includes("talca-aurora")));
    assert.ok(forms.every((f) => f.tenant === SEM_TENANT_ID));

    const footer = resolveFooterContent(emptyFooterViewModel(), {
      tenantId: SEM_TENANT_ID,
    });
    assert.equal(footer.institution.sealLine3, SEM_FOOTER_INSTITUTION.sealLine3);
    assert.ok(footer.cta.title.length > 0);
    assert.equal(shouldUseHomeDemoContent("/", SEM_TENANT_ID), true);
  });

  it("materializeSemTenantContent es idempotente (doble ejecución)", async () => {
    await withDb(async (db) => {
      const first = await materializeSemTenantContent(db);
      const second = await materializeSemTenantContent(db);

      assert.ok(first.formsInserted + first.formsSkipped > 0);
      assert.equal(second.formsInserted, 0);
      assert.ok(second.formsSkipped >= first.formsSkipped);
      assert.equal(second.admissionCreated, false);
      assert.equal(second.admissionSkipped, true);
      assert.equal(second.menusInserted, 0);

      const forms = await db
        .collection("experience_forms")
        .countDocuments({ tenant: SEM_TENANT_ID });
      assert.ok(forms >= createSemDefaultForms(SEM_TENANT_ID).length);

      const foreign = await db
        .collection("experience_forms")
        .countDocuments({ tenant: FIX_TENANT });
      assert.equal(foreign, 0);
    });
  });

  it("código: seeds/ensure de forms y content gated a SEM", () => {
    const repo = readFileSync(
      resolve(process.cwd(), "src/lib/experience/forms/repository.ts"),
      "utf8"
    );
    assert.match(repo, /isSemTenant\(tenant\)/);
    assert.match(repo, /if \(!isSemTenant\(tenant\)\) return/);

    const seed = readFileSync(
      resolve(process.cwd(), "src/lib/content/seed.ts"),
      "utf8"
    );
    assert.match(seed, /isSemTenant\(tenant\)/);
    assert.match(seed, /return \{ seeded: \[\] \}/);

    const registry = readFileSync(
      resolve(process.cwd(), "src/core/migrations/registry.ts"),
      "utf8"
    );
    assert.match(registry, /010-saas-sem-content/);
  });
});
