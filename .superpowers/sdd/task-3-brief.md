### Task 3: Migración `030-sem-admision-funnel`

**Files:**
- Create: `src/core/migrations/030-sem-admision-funnel.ts`
- Modify: `src/core/migrations/registry.ts`
- Modify: `tests/baseline/sem-admision-funnel.test.ts` — test puro del loop de remap (sin Mongo): función exportada `remapSemAdmisionOpportunityStatuses`

**Interfaces:**
- Consumes: `SEM_TENANT_ID`; `createMongoGrowthFunnelDirectory`; `applySemAdmisionDefaultFunnel`; `mapLegacyStatusToSemAdmision`; `GROWTH_OPORTUNIDADES_COLLECTION`; `GROWTH_OPPORTUNITY_ENTITY_TYPE` (`opportunity-definition`)
- Produces: `migration030SemAdmisionFunnel`; `planSemAdmisionStatusRemaps(rows): Array<{ id; from; to }>`

- [ ] **Step 1: Write the failing test**

```ts
import { planSemAdmisionStatusRemaps } from "../../src/core/growth/sem-admision-funnel";

it("planSemAdmisionStatusRemaps solo lista abiertas legacy", () => {
  const plan = planSemAdmisionStatusRemaps([
    { _id: "1", status: "open" },
    { _id: "2", status: "won" },
    { _id: "3", status: "interes" },
    { _id: "4", status: "seguimiento" },
  ]);
  assert.deepEqual(plan, [
    { id: "1", from: "open", to: "interes" },
    { id: "4", from: "seguimiento", to: "contactado" },
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/sem-admision-funnel.test.ts`  
Expected: FAIL (`planSemAdmisionStatusRemaps` missing)

- [ ] **Step 3: Implement plan + migration + registry**

En `sem-admision-funnel.ts`:

```ts
export function planSemAdmisionStatusRemaps(
  rows: Array<{ _id: string; status: string }>
): Array<{ id: string; from: string; to: string }> {
  const out: Array<{ id: string; from: string; to: string }> = [];
  for (const row of rows) {
    const to = mapLegacyStatusToSemAdmision(row.status);
    if (!to || to === row.status) continue;
    out.push({ id: row._id, from: row.status, to });
  }
  return out;
}
```

Migración:

```ts
// src/core/migrations/030-sem-admision-funnel.ts
import { createMongoGrowthFunnelDirectory } from "@/core/growth/funnel-mongo";
import { applySemAdmisionDefaultFunnel } from "@/core/growth/funnels";
import { GROWTH_OPPORTUNITY_ENTITY_TYPE } from "@/core/growth/opportunity-definition";
import { planSemAdmisionStatusRemaps } from "@/core/growth/sem-admision-funnel";
import { GROWTH_OPORTUNIDADES_COLLECTION } from "@/core/growth/types";
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
      log(`remap opp=${item.id} ${item.from}->${item.to}`);
    }
    return {
      documentsAffected: Number(applied.changed) + remapped,
      skipped: opps.length - remapped,
      details: [
        `funnelChanged=${applied.changed}`,
        `remapped=${remapped}`,
        `opps=${opps.length}`,
      ],
    };
  },
};
```

En `registry.ts`: importar y añadir `migration030SemAdmisionFunnel` **después** de `migration028GrowthFunnels` (no registrar 029).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/sem-admision-funnel.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/growth/sem-admision-funnel.ts src/core/migrations/030-sem-admision-funnel.ts src/core/migrations/registry.ts tests/baseline/sem-admision-funnel.test.ts
git commit -m "feat(growth): migración 030 embudo Admisión SEM"
```

---
