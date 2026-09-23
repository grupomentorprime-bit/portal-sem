import { homologateAllPlatformDomains } from "@/core/tenant/homologate-domains";
import type { MigrationDefinition } from "@/core/migrations/types";

/**
 * Homologa el subdominio por defecto de cada Sitio:
 * `{slug}.{PLATFORM_BASE_DOMAIN}` o `{slug}.localhost:{puerto}` en local.
 * Quita `localhost` pelado (origen de plataforma) si quedó como Domain.
 */
export const migration025PlatformDefaultDomains: MigrationDefinition = {
  id: "025-platform-default-domains",
  description:
    "Subdominio de plataforma homologado por Sitio; quita origen pelado de localhost",
  modules: [],

  async run({ db, log }) {
    const result = await homologateAllPlatformDomains(db);

    const details = [
      `sites=${result.sites}`,
      `created=${result.created}`,
      `relabeled=${result.relabeled}`,
      `removed=${result.removed}`,
      `primaries=${result.primariesSet}`,
    ];
    for (const row of result.details) {
      if (
        !row.created &&
        row.removed.length === 0 &&
        row.relabeled.length === 0
      ) {
        continue;
      }
      details.push(
        `${row.siteId}: host=${row.defaultHost ?? "—"} primary=${row.primaryHost ?? "—"} created=${row.created} removed=[${row.removed.join(",")}] relabeled=[${row.relabeled.join(",")}]`
      );
    }
    for (const line of details) log(line);

    return {
      documentsAffected:
        result.created + result.relabeled + result.removed,
      skipped: Math.max(0, result.sites - result.created),
      details,
    };
  },
};
