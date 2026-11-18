### Task 2: `replaceGrowthFunnelStages` + apply SEM en memoria

**Files:**
- Modify: `src/core/growth/funnels.ts` — exportar `replaceGrowthFunnelStages` y `applySemAdmisionDefaultFunnel`
- Modify: `tests/baseline/sem-admision-funnel.test.ts` — casos con `createMemoryFunnelDirectory`

**Interfaces:**
- Consumes: `writeStages` (interno), `ensureGrowthFunnelsForTenant`, `renameGrowthFunnel`, `semAdmisionStages`, `isSemAdmisionStages`, `SEM_ADMISION_FUNNEL_NAME`, `GROWTH_FUNNEL_DEFAULT_KEY`
- Produces:
  - `replaceGrowthFunnelStages(directory, { tenantId, funnelKey, stages, now? })`
  - `applySemAdmisionDefaultFunnel(directory, tenantId, now?): Promise<{ funnel; stages; changed: boolean }>`

- [ ] **Step 1: Write the failing test**

Añadir al mismo archivo de test:

```ts
import { createMemoryFunnelDirectory } from "../../src/core/growth/funnel-memory";
import { ensureGrowthFunnelsForTenant } from "../../src/core/growth/funnels";
import { applySemAdmisionDefaultFunnel } from "../../src/core/growth/funnels";
import { SEM_TENANT_ID } from "../../src/core/tenant/constants";
import { stagesFromDefinition } from "../../src/core/growth/funnel-stages";

it("applySemAdmisionDefaultFunnel renombra default y deja etapas SEM; segunda pasada no cambia", async () => {
  const directory = createMemoryFunnelDirectory();
  await ensureGrowthFunnelsForTenant(directory, SEM_TENANT_ID, "2026-11-09T00:00:00.000Z");
  const first = await applySemAdmisionDefaultFunnel(directory, SEM_TENANT_ID, "2026-11-09T01:00:00.000Z");
  assert.equal(first.changed, true);
  assert.equal(first.funnel.name, "Admisión");
  assert.equal(isSemAdmisionStages(first.stages), true);

  const second = await applySemAdmisionDefaultFunnel(directory, SEM_TENANT_ID, "2026-11-09T02:00:00.000Z");
  assert.equal(second.changed, false);
  const def = await directory.getDefinition(SEM_TENANT_ID, first.funnel.workflowDefinitionKey);
  assert.equal(isSemAdmisionStages(stagesFromDefinition(def)), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/sem-admision-funnel.test.ts`  
Expected: FAIL (`applySemAdmisionDefaultFunnel` / `replaceGrowthFunnelStages` missing)

- [ ] **Step 3: Write minimal implementation**

En `funnels.ts`, exportar:

```ts
export async function replaceGrowthFunnelStages(
  directory: GrowthFunnelDirectory,
  input: {
    tenantId: string;
    funnelKey: string;
    stages: GrowthFunnelStage[];
    now?: string;
  }
): Promise<{ ok: true; stages: GrowthFunnelStage[] } | { ok: false; reason: GrowthFunnelFailure }> {
  const funnel = await directory.findFunnel(input.tenantId, input.funnelKey);
  if (!funnel || funnel.tenantId !== input.tenantId) return { ok: false, reason: "not_found" };
  const definition = await writeStages(directory, funnel, input.stages, nowIso(input.now));
  return { ok: true, stages: stagesFromDefinition(definition) };
}

export async function applySemAdmisionDefaultFunnel(
  directory: GrowthFunnelDirectory,
  tenantId: string,
  now?: string
): Promise<{ funnel: GrowthFunnel; stages: GrowthFunnelStage[]; changed: boolean }> {
  const at = nowIso(now);
  const funnel = await ensureGrowthFunnelsForTenant(directory, tenantId, at);
  let current = funnel;
  let changed = false;
  if (current.name !== SEM_ADMISION_FUNNEL_NAME) {
    const renamed = await renameGrowthFunnel(directory, {
      tenantId,
      key: current.key,
      name: SEM_ADMISION_FUNNEL_NAME,
      now: at,
    });
    if (renamed.ok) {
      current = renamed.funnel;
      changed = true;
    }
  }
  const existing = stagesFromDefinition(
    await directory.getDefinition(tenantId, current.workflowDefinitionKey)
  );
  if (isSemAdmisionStages(existing)) {
    return { funnel: current, stages: existing, changed };
  }
  const replaced = await replaceGrowthFunnelStages(directory, {
    tenantId,
    funnelKey: current.key,
    stages: semAdmisionStages(),
    now: at,
  });
  if (!replaced.ok) {
    return { funnel: current, stages: existing, changed };
  }
  return { funnel: current, stages: replaced.stages, changed: true };
}
```

Importar `SEM_ADMISION_FUNNEL_NAME`, `semAdmisionStages`, `isSemAdmisionStages` desde `./sem-admision-funnel`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/sem-admision-funnel.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/growth/funnels.ts tests/baseline/sem-admision-funnel.test.ts
git commit -m "feat(growth): apply embudo Admisión SEM sobre funnel default"
```

---
