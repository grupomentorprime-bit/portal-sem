import { SEM_TENANT_ID } from "@/core/tenant/constants";
import {
  LEGACY_STORAGE_INTEGRATION_ID,
  resourceIdCandidates,
  scopedResourceId,
  storageIntegrationIdForTenant,
} from "@/core/tenant/resource-ids";
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
    if (code === 85 || code === 86) return "exists";
    throw error;
  }
}

async function renameScopedIds(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  col: {
    find: (q: object) => { toArray: () => Promise<any[]> };
    findOne: (q: object) => Promise<any | null>;
    insertOne: (d: object) => Promise<unknown>;
    deleteOne: (q: object) => Promise<unknown>;
    updateOne: (q: object, u: object) => Promise<unknown>;
  },
  tenantField: "tenant" | "tenantId",
  tenantId: string,
  options?: { slugField?: string }
): Promise<{ renamed: number; skipped: number }> {
  const docs = await col
    .find({ [tenantField]: tenantId })
    .toArray();

  let renamed = 0;
  let skipped = 0;
  const slugField = options?.slugField;

  for (const doc of docs) {
    const id = String(doc._id);
    if (id.startsWith(`${tenantId}:`)) {
      skipped += 1;
      continue;
    }

    const newId = scopedResourceId(tenantId, id);
    if (newId === id) {
      skipped += 1;
      continue;
    }

    const existingScoped = await col.findOne({ _id: newId });
    if (existingScoped) {
      // Ya migrado; residual bare — eliminar bare.
      await col.deleteOne({ _id: id });
      renamed += 1;
      continue;
    }

    const { _id: _old, ...rest } = doc;

    // Evitar E11000 en índices únicos (p. ej. tenant+slug): liberar el bare antes.
    if (slugField && doc[slugField] != null) {
      await col.updateOne(
        { _id: id },
        { $set: { [slugField]: `__mig__${id}` } }
      );
    }

    try {
      await col.insertOne({ ...rest, _id: newId });
      await col.deleteOne({ _id: id });
      renamed += 1;
    } catch (error) {
      // Restaurar slug original si el insert falló tras el rename temporal.
      if (slugField && doc[slugField] != null) {
        await col.updateOne({ _id: id }, { $set: { [slugField]: doc[slugField] } });
      }
      throw error;
    }
  }

  return { renamed, skipped };
}

/**
 * OT-GROWTH-SAAS-004 — Eliminar singletons y bootstrap inseguro.
 * - Scope `_id` de cms_pages / cms_menus → `{tenantId}:{logicalId}`
 * - platform_integrations storage → `storage:{tenantId}` + tenantId
 * - Actualiza entityId de workflows cms.page
 * Idempotente.
 */
export const migration008SaasSingletons: MigrationDefinition = {
  id: "008-saas-singletons",
  description:
    "IDs pages/menus tenantizados; platform_integrations por tenant; workflow entityId home",
  modules: [],

  async run({ db, log }) {
    let documentsAffected = 0;
    let skipped = 0;
    const details: string[] = [];

    // 1) Pages SEM
    const pagesResult = await renameScopedIds(
      db.collection("cms_pages"),
      "tenant",
      SEM_TENANT_ID,
      { slugField: "slug" }
    );
    documentsAffected += pagesResult.renamed;
    skipped += pagesResult.skipped;
    details.push(
      `cms_pages rename scoped=${pagesResult.renamed} skipped=${pagesResult.skipped}`
    );

    // 2) Menus SEM
    const menusResult = await renameScopedIds(
      db.collection("cms_menus"),
      "tenant",
      SEM_TENANT_ID
    );
    documentsAffected += menusResult.renamed;
    skipped += menusResult.skipped;
    details.push(
      `cms_menus rename scoped=${menusResult.renamed} skipped=${menusResult.skipped}`
    );

    // 3) Workflow instances / history entityId para páginas renombradas
    const barePageIds = await db
      .collection("cms_pages")
      .find({ tenant: SEM_TENANT_ID })
      .project({ _id: 1 })
      .toArray();

    let wfEntityUpdated = 0;
    for (const page of barePageIds) {
      const scoped = String(page._id);
      if (!scoped.startsWith(`${SEM_TENANT_ID}:`)) continue;
      const logical = scoped.slice(SEM_TENANT_ID.length + 1);
      const candidates = resourceIdCandidates(SEM_TENANT_ID, logical);
      // Actualizar referencias al id bare (segundo candidato)
      if (candidates.length < 2) continue;
      const bare = candidates[1];
      const inst = await db.collection("workflow_instances").updateMany(
        {
          tenantId: SEM_TENANT_ID,
          entityType: "cms.page",
          entityId: bare,
        },
        { $set: { entityId: scoped } }
      );
      wfEntityUpdated += inst.modifiedCount;

      const hist = await db.collection("workflow_history").updateMany(
        {
          tenantId: SEM_TENANT_ID,
          entityType: "cms.page",
          entityId: bare,
        },
        { $set: { entityId: scoped } }
      );
      wfEntityUpdated += hist.modifiedCount;
    }
    documentsAffected += wfEntityUpdated;
    details.push(`workflow entityId updates=${wfEntityUpdated}`);

    // 4) platform_integrations: storage → storage:seminario-ipn
    const integrations = db.collection<{
      _id: string;
      tenantId?: string;
      [key: string]: unknown;
    }>("platform_integrations");
    const scopedStorageId = storageIntegrationIdForTenant(SEM_TENANT_ID);
    const existingScoped = await integrations.findOne({ _id: scopedStorageId });
    const legacy = await integrations.findOne({ _id: LEGACY_STORAGE_INTEGRATION_ID });

    if (existingScoped) {
      skipped += 1;
      details.push(`platform_integrations ${scopedStorageId}=exists`);
      if (legacy) {
        await integrations.deleteOne({ _id: LEGACY_STORAGE_INTEGRATION_ID });
        documentsAffected += 1;
        details.push(`platform_integrations legacy storage deleted`);
      }
    } else if (legacy) {
      const { _id: _old, ...rest } = legacy;
      await integrations.insertOne({
        ...rest,
        _id: scopedStorageId,
        tenantId: SEM_TENANT_ID,
      });
      await integrations.deleteOne({ _id: LEGACY_STORAGE_INTEGRATION_ID });
      documentsAffected += 1;
      details.push(`platform_integrations migrated storage→${scopedStorageId}`);
    } else {
      skipped += 1;
      details.push(`platform_integrations none`);
    }

    // 5) Índice tenantId en integraciones
    const idx = await ensureIndex(integrations, { tenantId: 1, _id: 1 }, {
      name: "tenantId_id",
    });
    details.push(`index platform_integrations.tenantId_id=${idx}`);
    if (idx === "created") documentsAffected += 1;
    else skipped += 1;

    for (const line of details) log(line);

    return { documentsAffected, skipped, details };
  },
};
