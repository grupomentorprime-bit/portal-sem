import { createMongoGrowthFunnelDirectory } from "@/core/growth/funnel-mongo";
import { applySemAdmisionDefaultFunnel } from "@/core/growth/funnels";
import { GROWTH_OPORTUNIDADES_COLLECTION } from "@/core/growth/types";
import { GROWTH_OPPORTUNITY_ENTITY_TYPE } from "@/core/growth/opportunity-definition";
import { planSemAdmisionStatusRemaps } from "@/core/growth/sem-admision-funnel";
import type { MigrationDefinition } from "@/core/migrations/types";
import { SEM_TENANT_ID } from "@/core/tenant/constants";

export const migration030SemAdmisionFunnel: MigrationDefinition = {
  id: "030-sem-admision-funnel",
  description: "Embudo Admisión SEM: etapas, rename default y remap de status abiertos",
  modules: [],

  async run({ db, log }) {
    const directory = createMongoGrowthFunnelDirectory(db);
    const applied = await applySemAdmisionDefaultFunnel(directory, SEM_TENANT_ID);
    log(`funnel name=${applied.funnel.name} changed=${applied.changed}`);

    const opps = await db
      .collection(GROWTH_OPORTUNIDADES_COLLECTION)
      .find({ tenantId: SEM_TENANT_ID }, { projection: { _id: 1, status: 1 } })
      .toArray();
    const plan = planSemAdmisionStatusRemaps(
      opps.map((row) => ({ _id: String(row._id), status: String(row.status ?? "") }))
    );

    let remapped = 0;
    let unknownOpenRemaps = 0;
    for (const item of plan) {
      await db.collection(GROWTH_OPORTUNIDADES_COLLECTION).updateOne(
        { tenantId: SEM_TENANT_ID, _id: item.id },
        { $set: { status: item.to } }
      );
      await db.collection("workflow_instances").updateOne(
        {
          tenantId: SEM_TENANT_ID,
          entityType: GROWTH_OPPORTUNITY_ENTITY_TYPE,
          entityId: item.id,
        },
        { $set: { currentState: item.to } }
      );
      remapped += 1;
      if (item.reason === "unknown_open") {
        unknownOpenRemaps += 1;
        log(`remap_unknown_open opp=${item.id} ${item.from}->${item.to}`);
      } else {
        log(`remap opp=${item.id} reason=${item.reason} ${item.from}->${item.to}`);
      }
    }

    return {
      documentsAffected: Number(applied.changed) + remapped,
      skipped: opps.length - remapped,
      details: [
        `funnelChanged=${applied.changed}`,
        `remapped=${remapped}`,
        `unknownOpenRemaps=${unknownOpenRemaps}`,
        `opps=${opps.length}`,
      ],
    };
  },
};
