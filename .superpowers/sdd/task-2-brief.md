### Task 2: Lectura por Espacio

**Files:**
- Create: `src/lib/growth/conversion-analytics-read.ts`
- Test: `tests/baseline/growth-conversion-analytics.test.ts` (guarda de fuente; la funciÃ³n pura ya cubre el cÃ¡lculo)

**Interfaces:**
- Consumes: `buildConversionAnalytics` y sus tipos de entrada. `getDatabase` (`src/lib/mongodb.ts`). Colecciones `GROWTH_OPORTUNIDADES_COLLECTION`, `GROWTH_ACTIVIDADES_COLLECTION`, `GROWTH_FUNNELS_COLLECTION`, `GROWTH_CAMPAIGNS_COLLECTION`. `listMembershipsByTenant`, `listUsersByIds`. `resolveAnalyticsPeriod`. `getExperienceFormById`, el mismo uso que `resolveFormNames` en `analytics-read.ts`.
- Produces: `getConversionAnalytics(tenantId: string, query: ResolveAnalyticsPeriodInput): Promise<{ ok: true; data: ConversionAnalyticsResponse } | { ok: false; error: string; status: 400 }>`.

- [ ] **Step 1: Write the failing source guard**

En el test de fase 3, leer `conversion-analytics-read.ts` y afirmar: filtra `tenantId`; kinds limitados a `opportunity_opened`, `opportunity_transitioned`, `opportunity_assigned`; no contiene `insert`, `update`, `delete`, `aggregate` de escritura, `029`, `lossReason`, ni `deriveCampaignMetrics`. Afirmar que `analytics-read.ts` y `analytics-aggregate.ts` no importan `conversion-analytics`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/growth-conversion-analytics.test.ts`

Expected: FAIL al leer un archivo que no existe.

- [ ] **Step 3: Write minimal implementation**

`conversion-analytics-read.ts` con `import "server-only"`. Si `resolveAnalyticsPeriod` falla, devolver `{ ok: false, error, status: 400 }`. Si no:

1. `find` de oportunidades `{ tenantId }`.
2. `find` de actividades `{ tenantId, kind: { $in: ["opportunity_opened", "opportunity_transitioned", "opportunity_assigned"] } }`. El historial anterior al perÃ­odo hace falta para permanencia y atribuciÃ³n; no recortar por `occurredAt` en Mongo.
3. `find` de embudos y campaÃ±as `{ tenantId }`.
4. MembresÃ­as del Espacio de cualquier estado. `active: membership.status === "active"`. Label: `displayName` o email. La vigencia la resuelve el nÃºcleo puro.
5. Nombres de formulario solo para los `origin.formId` de esas oportunidades.
6. `readAt = new Date().toISOString()` y llamar a `buildConversionAnalytics`. Proyectar al tipo de entrada; no pasar el documento crudo de mÃ¡s.

No crear colecciÃ³n ni Ã­ndice.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/growth-conversion-analytics.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/growth/conversion-analytics-read.ts tests/baseline/growth-conversion-analytics.test.ts
git commit -m "feat: leer analÃ­tica de conversiÃ³n del Espacio sin materializarla"
```

---

