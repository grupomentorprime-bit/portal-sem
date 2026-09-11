import { ensureSemTenantFoundation } from "@/core/tenant/migrate-sem";
import type { MigrationDefinition } from "@/core/migrations/types";

/**
 * OT-GROWTH-SAAS-001 — Fundación Tenant / Site / Domain para SEM (T001).
 * Idempotente: re-ejecutar no duplica entidades ni site_config.
 * Conserva el singleton cms_config `_id: "site"` (compat).
 */
export const migration006SaasFoundation: MigrationDefinition = {
  id: "006-saas-foundation",
  description:
    "SEM T001/S001/Domain + site_config desde cms_config; backfill menús sin tenant",
  modules: [],

  async run({ db, log }) {
    const result = await ensureSemTenantFoundation(db);

    const details = [
      `tenant=${result.tenantId} site=${result.siteId}`,
      `hosts=[${result.hosts.join(", ")}]`,
      `created tenant=${result.created.tenant} site=${result.created.site} domains=${result.created.domains} site_config=${result.created.siteConfig}`,
      `updated tenant=${result.updated.tenant} site=${result.updated.site} domains=${result.updated.domains} site_config=${result.updated.siteConfig} cms_config=${result.updated.legacyCmsConfig}`,
      `menus backfilled=${result.updated.menusBackfilled}`,
      `legacy cms_config preserved=${result.preserved.legacyCmsConfig}`,
    ];

    for (const line of details) {
      log(line);
    }

    const documentsAffected =
      Number(result.created.tenant) +
      Number(result.created.site) +
      result.created.domains +
      Number(result.created.siteConfig) +
      Number(result.updated.tenant) +
      Number(result.updated.site) +
      result.updated.domains +
      Number(result.updated.siteConfig) +
      Number(result.updated.legacyCmsConfig) +
      result.updated.menusBackfilled;

    const skipped =
      !result.created.tenant &&
      !result.created.site &&
      result.created.domains === 0 &&
      !result.created.siteConfig &&
      !result.updated.tenant &&
      !result.updated.site &&
      result.updated.domains === 0 &&
      !result.updated.siteConfig &&
      !result.updated.legacyCmsConfig &&
      result.updated.menusBackfilled === 0
        ? 1
        : 0;

    return {
      documentsAffected,
      skipped,
      details,
    };
  },
};
