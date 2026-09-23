import { homologateAllPlatformDomains } from "@/core/tenant/homologate-domains";
import { resolveSpaceBaseDomain } from "@/core/tenant/hosts";
import type { MigrationDefinition } from "@/core/migrations/types";

/**
 * Publica `{slug}.{SPACE_BASE_DOMAIN}` en cada Sitio.
 * Si la variable falta, falla y no queda marcada:
 * así no se graban hosts de localhost ni el origen de la plataforma.
 * Un dominio propio ya primario no se mueve. Un slug de infraestructura
 * no recibe subdominio.
 */
export const migration026PlatformWildcardSubdomains: MigrationDefinition = {
  id: "026-platform-wildcard-subdomains",
  description:
    "Subdominio público {slug}.{SPACE_BASE_DOMAIN}; promueve el primario si era localhost",
  modules: [],

  async run({ db, log }) {
    const base = resolveSpaceBaseDomain(process.env);
    if (!base) {
      throw new Error(
        "SPACE_BASE_DOMAIN no está definido. La 026 no usa APP_URL."
      );
    }
    log(`base=${base}`);
    const result = await homologateAllPlatformDomains(db, {
      ...process.env,
      SPACE_BASE_DOMAIN: base,
    });

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
