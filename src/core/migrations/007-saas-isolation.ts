import { SEM_TENANT_ID } from "@/core/tenant/constants";
import type { MigrationDefinition } from "@/core/migrations/types";

async function ensureIndex(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collection: { createIndex: (keys: Record<string, 1 | -1>, options?: any) => Promise<string> },
  keys: Record<string, 1 | -1>,
  options: { name: string; unique?: boolean }
): Promise<"created" | "exists"> {
  try {
    const indexOptions: { name: string; background: boolean; unique?: boolean } = {
      name: options.name,
      background: true,
    };
    if (options.unique) indexOptions.unique = true;
    await collection.createIndex(keys, indexOptions);
    return "created";
  } catch (error) {
    const code = (error as { code?: number }).code;
    // IndexOptionsConflict / IndexKeySpecsConflict — ya existe (idempotente)
    if (code === 85 || code === 86) return "exists";
    throw error;
  }
}

/**
 * OT-GROWTH-SAAS-003 — Índices compuestos por tenant + backfill workflow_definitions.
 * Idempotente: re-ejecutar no falla si índices/docs ya están.
 */
export const migration007SaasIsolation: MigrationDefinition = {
  id: "007-saas-isolation",
  description:
    "Índices tenantizados (pages/menus/media/workflows/invitations/forms) + backfill workflow_definitions.tenantId",
  modules: [],

  async run({ db, log }) {
    let documentsAffected = 0;
    let skipped = 0;
    const details: string[] = [];

    const wfBackfill = await db.collection("workflow_definitions").updateMany(
      {
        $or: [
          { tenantId: { $exists: false } },
          { tenantId: null },
          { tenantId: "" },
        ],
      },
      { $set: { tenantId: SEM_TENANT_ID } }
    );
    documentsAffected += wfBackfill.modifiedCount;
    details.push(`workflow_definitions tenantId backfill=${wfBackfill.modifiedCount}`);

    const menuBackfill = await db.collection("cms_menus").updateMany(
      {
        $or: [{ tenant: { $exists: false } }, { tenant: null }, { tenant: "" }],
      },
      { $set: { tenant: SEM_TENANT_ID } }
    );
    documentsAffected += menuBackfill.modifiedCount;
    details.push(`cms_menus tenant backfill=${menuBackfill.modifiedCount}`);

    const indexSpecs: Array<{
      collection: string;
      keys: Record<string, 1 | -1>;
      name: string;
      unique?: boolean;
    }> = [
      { collection: "cms_pages", keys: { tenant: 1, slug: 1 }, name: "tenant_slug_unique", unique: true },
      { collection: "cms_pages", keys: { tenant: 1, _id: 1 }, name: "tenant_id" },
      { collection: "cms_menus", keys: { tenant: 1, _id: 1 }, name: "tenant_id" },
      { collection: "cms_media", keys: { tenant: 1, hash: 1 }, name: "tenant_hash" },
      { collection: "cms_media", keys: { tenant: 1, _id: 1 }, name: "tenant_id" },
      {
        collection: "workflow_definitions",
        keys: { tenantId: 1, key: 1 },
        name: "tenantId_key_unique",
        unique: true,
      },
      {
        collection: "workflow_instances",
        keys: { tenantId: 1, entityType: 1, entityId: 1 },
        name: "tenantId_entity",
      },
      {
        collection: "workflow_instances",
        keys: { tenantId: 1, _id: 1 },
        name: "tenantId_id",
      },
      {
        collection: "workflow_history",
        keys: { tenantId: 1, workflowInstanceId: 1 },
        name: "tenantId_instance",
      },
      {
        collection: "identity_invitations",
        keys: { tenantId: 1, email: 1, status: 1 },
        name: "tenantId_email_status",
      },
      {
        collection: "identity_invitations",
        keys: { tenantId: 1, _id: 1 },
        name: "tenantId_id",
      },
      {
        collection: "experience_forms",
        keys: { tenant: 1, _id: 1 },
        name: "tenant_id",
      },
      {
        collection: "experience_form_submissions",
        keys: { tenant: 1, formId: 1 },
        name: "tenant_formId",
      },
    ];

    for (const spec of indexSpecs) {
      const col = db.collection(spec.collection);
      const result = await ensureIndex(col, spec.keys, {
        name: spec.name,
        unique: spec.unique,
      });
      details.push(`index ${spec.collection}.${spec.name}=${result}`);
      if (result === "created") documentsAffected += 1;
      else skipped += 1;
    }

    for (const line of details) log(line);

    return { documentsAffected, skipped, details };
  },
};
