import { ensureAdlTenantFoundation } from "@/core/tenant/migrate-adl";
import type { MigrationDefinition } from "@/core/migrations/types";

/**
 * OT-GROWTH-SAAS-009 — Tenant 002 Academia ADL.
 * Separada del pack SEM (`010-saas-sem-content`). Idempotente.
 * No aplica seeds SEM ni implementación académica específica.
 */
export const migration012SaasAdlTenant: MigrationDefinition = {
  id: "012-saas-adl-tenant",
  description:
    "Provista T002/S002 Academia ADL (site_config, dominio, menús de plataforma, roles, storage stub)",
  modules: [],

  async run({ db, log }) {
    const result = await ensureAdlTenantFoundation(db);
    const details = [
      `tenant=${result.tenantId} site=${result.siteId}`,
      `hosts=[${result.hosts.join(", ")}]`,
      `created tenant=${result.created.tenant} site=${result.created.site} domains=${result.created.domains} site_config=${result.created.siteConfig}`,
      `created menus=${result.created.menus} home=${result.created.homePage} roles=${result.created.roles} storage=${result.created.storage} membership=${result.created.membership}`,
      `updated tenant=${result.updated.tenant} site=${result.updated.site} domains=${result.updated.domains} site_config=${result.updated.siteConfig}`,
      `skipped menus=${result.skipped.menus} home=${result.skipped.homePage} roles=${result.skipped.roles} storage=${result.skipped.storage} membership=${result.skipped.membership}`,
      result.skipped.hostsRejected.length
        ? `hosts rejected=[${result.skipped.hostsRejected.join(", ")}]`
        : "hosts rejected=none",
    ];
    for (const line of details) log(line);

    const documentsAffected =
      Number(result.created.tenant) +
      Number(result.created.site) +
      result.created.domains +
      Number(result.created.siteConfig) +
      result.created.menus +
      Number(result.created.homePage) +
      result.created.roles +
      Number(result.created.storage) +
      Number(result.created.membership) +
      Number(result.updated.tenant) +
      Number(result.updated.site) +
      result.updated.domains +
      Number(result.updated.siteConfig);

    const skipped =
      documentsAffected === 0 && result.skipped.hostsRejected.length === 0 ? 1 : 0;

    return { documentsAffected, skipped, details };
  },
};
