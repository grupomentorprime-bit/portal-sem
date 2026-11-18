import { ensureIpnChileFoundation } from "@/core/units/ensure-ipn-chile";
import type { MigrationDefinition } from "@/core/migrations/types";

/**
 * IPN Chile como Espacio y Departamento Nacional de Varones como primera unidad.
 * No modifica SEM ni otros clientes.
 */
export const migration030IpnChileUnits: MigrationDefinition = {
  id: "030-ipn-chile-units",
  description:
    "Provista el Espacio IPN Chile y la unidad Departamento Nacional de Varones",
  modules: [],

  async run({ db, log }) {
    const result = await ensureIpnChileFoundation(db);
    const details = [
      `tenant=${result.tenantId} site=${result.siteId} unit=${result.unitId} unitCreated=${result.unitCreated}`,
      `hosts=[${result.hosts.join(", ")}]`,
      `created tenant=${result.created.tenant} site=${result.created.site} domains=${result.created.domains}`,
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
      Number(result.unitCreated);

    return {
      documentsAffected,
      skipped: documentsAffected === 0 ? 1 : 0,
      details,
    };
  },
};
