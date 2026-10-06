import { SEM_TENANT_ID, SITE_CONFIG_COLLECTION } from "@/core/tenant/constants";
import { isSemOwnedAsset } from "@/core/branding/foreign-assets";
import type { MigrationDefinition } from "@/core/migrations/types";

const ASSET_FIELDS = ["logo", "secondaryLogo", "favicon", "heroImage"] as const;

/**
 * Quita rutas de SEM (logo, favicon, IPN) guardadas en Espacios que no son T001.
 * El favicon público pasa a la marca genérica en runtime; aquí el dato queda vacío.
 */
export const migration027StripForeignSemAssets: MigrationDefinition = {
  id: "027-strip-foreign-sem-assets",
  description:
    "Limpia logos y favicon de SEM en Espacios que no son el Seminario",
  modules: [],

  async run({ db, log }) {
    const col = db.collection(SITE_CONFIG_COLLECTION);
    const rows = await col
      .find(
        { tenantId: { $ne: SEM_TENANT_ID } },
        { projection: { tenantId: 1, branding: 1 } }
      )
      .toArray();

    let documentsAffected = 0;
    const details: string[] = [];

    for (const row of rows) {
      const branding = (row.branding ?? {}) as Record<string, string | undefined>;
      const $set: Record<string, string> = {};
      for (const field of ASSET_FIELDS) {
        const value = branding[field];
        if (isSemOwnedAsset(value)) {
          $set[`branding.${field}`] = "";
        }
      }
      if (Object.keys($set).length === 0) {
        continue;
      }
      $set.updatedAt = new Date().toISOString();
      await col.updateOne({ _id: row._id }, { $set });
      documentsAffected += 1;
      details.push(
        `${row.tenantId}: ${Object.keys($set)
          .filter((key) => key.startsWith("branding."))
          .join(", ")}`
      );
    }

    log(
      `027-strip-foreign-sem-assets: ${documentsAffected} espacio(s), ${rows.length} revisados`
    );
    for (const line of details) log(line);

    return {
      documentsAffected,
      skipped: rows.length - documentsAffected,
      details,
    };
  },
};
