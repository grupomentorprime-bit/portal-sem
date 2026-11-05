### Task 3: Ruta, navegaciÃ³n y pantalla

**Files:**
- Create: `src/components/admin/growth/analitica-visual.tsx`
- Modify: `src/components/admin/growth/AnaliticaClient.tsx`
- Create: `src/app/api/growth/conversion-analytics/route.ts`
- Create: `src/app/admin/conversion/analitica/page.tsx`
- Create: `src/components/admin/growth/ConversionAnaliticaClient.tsx`
- Modify: `src/lib/admin/nav-domains.ts`
- Modify: `src/lib/growth/labels.ts`
- Test: `tests/baseline/growth-conversion-analytics.test.ts`

**Interfaces:**
- Consumes: `getConversionAnalytics`, `ConversionAnalyticsResponse`, `formatConversionPercent`, piezas visuales extraÃ­das, `requirePermission`, `can`, `loadSessionContext`.
- Produces: `GET /api/growth/conversion-analytics` y la pÃ¡gina `/admin/conversion/analitica`.

- [ ] **Step 1: Write the failing source guard**

Afirmar en el test:

- `src/app/admin/analitica/page.tsx` sigue con `getAnalyticsV1` y `growth.analytics.view`, y no menciona `conversion-analytics` ni `etapa`.
- `src/app/admin/conversion/page.tsx` no importa `ConversionAnaliticaClient`.
- `nav-domains.ts`: el Ã­tem Panel comercial tiene `excludePrefixes` que incluye `/admin/conversion/analitica`. El Ã­tem nuevo estÃ¡ en el grupo `conversion`, `href: "/admin/conversion/analitica"`, label `AnalÃ­tica de conversiÃ³n`, y `requiredAnyPermission` es exactamente `["growth.sales.view"]`. Aparece despuÃ©s de `nav-conversion` en el archivo.
- La pÃ¡gina nueva exige `growth.sales.view` y redirige a `/login?next=/admin/conversion/analitica` sin sesiÃ³n.
- La ruta API usa `requirePermission("growth.sales.view")` y no `growth.analytics.view`.
- El cliente nuevo contiene `CONVERSION_DENOMINATORS`, `CONVERSION_RATE_NOTE`, `CONVERSION_LOSS_REASONS_NOTE`, Â«Sin datos en el perÃ­odoÂ», `data-conversion-analitica`, y la clase de una columna (`flex flex-col` o `grid-cols-1`). No contiene `lossReason`, series de ejemplo, ni `/api/growth/analytics`.
- `AnaliticaClient.tsx` conserva las preguntas que ya fija `growth-ux-analytics-004.test.ts`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/growth-conversion-analytics.test.ts tests/baseline/growth-ux-analytics-004.test.ts`

Expected: FAIL en las afirmaciones nuevas. El test de AnalÃ­tica V1 sigue PASS.

- [ ] **Step 3: Write minimal implementation**

Extraer de `AnaliticaClient.tsx` a `analitica-visual.tsx` las funciones `StorySection`, `HeroMetric`, `ProportionBars` y `PeriodSelector`, mÃ¡s los helpers de fecha que solo ellas usan. `AnaliticaClient` las importa y conserva su copy y su fetch a `/api/growth/analytics`.

`route.ts` copia la forma de `src/app/api/growth/analytics/route.ts` con permiso `growth.sales.view` y `getConversionAnalytics`. Error de perÃ­odo: 400. ExcepciÃ³n: 500. No devolver ceros en el catch.

`page.tsx` sigue el guard de `src/app/admin/analitica/page.tsx`, con `growth.sales.view` y `next=/admin/conversion/analitica`. Pasa `initial` y el preset al cliente.

En `nav-domains.ts`, dentro del grupo `conversion`, despuÃ©s del Ã­tem `nav-conversion`:

```ts
{
  id: "nav-conversion-analitica",
  href: "/admin/conversion/analitica",
  label: "AnalÃ­tica de conversiÃ³n",
  icon: "sales",
  matchPrefixes: ["/admin/conversion/analitica"],
  requiredAnyPermission: ["growth.sales.view"],
},
```

Y en Panel comercial agregar `excludePrefixes: ["/admin/conversion/analitica"]`.

Cliente, una columna, secciones en este orden: captaciÃ³n, stock, movimiento, pÃ©rdidas, permanencia, cohortes, responsables, calidad. Cada secciÃ³n muestra la frase de denominador que corresponda. Cohortes: tabla con cohorte, ganadas, abiertas, perdidas, traspasadas y `formatConversionPercent(rate)`, mÃ¡s `CONVERSION_RATE_NOTE`. PÃ©rdidas: conteo, barras de etapa de salida reutilizando `ProportionBars`, y `CONVERSION_LOSS_REASONS_NOTE`. No hay selector ni lista de motivos. Calidad: una lista con los seis cubos cuyo valor sea mayor que cero. Permanencia y ciclo: dÃ­as con un decimal (`ms / 86_400_000`), Â«â€”Â» si la mediana es `null`, y el `count` al lado. El selector de embudo solo elige una serie ya calculada; Â«TodosÂ» no concatena etapas de embudos distintos.

VacÃ­o: si no hay oportunidades en la respuesta (captaciÃ³n, stock, movimiento, cierres y cohortes en cero y calidad en cero), `EmptyState` con Â«Sin datos en el perÃ­odoÂ». Si el perÃ­odo estÃ¡ vacÃ­o y el stock no, el stock se muestra y las secciones del perÃ­odo usan ese mismo texto. Error de lectura: `AlertBanner`, nunca ceros. El fetch del cliente va a `/api/growth/conversion-analytics` con `preset`, `from` y `to`, igual que AnalÃ­tica V1.

Labels nuevos en `labels.ts`. No reescribir las cadenas que el test 004 ya busca.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/growth-conversion-analytics.test.ts tests/baseline/growth-ux-analytics-004.test.ts tests/baseline/growth-analytics-003.test.ts`

Expected: PASS los tres.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/growth/analitica-visual.tsx src/components/admin/growth/AnaliticaClient.tsx src/components/admin/growth/ConversionAnaliticaClient.tsx src/app/api/growth/conversion-analytics/route.ts src/app/admin/conversion/analitica/page.tsx src/lib/admin/nav-domains.ts src/lib/growth/labels.ts tests/baseline/growth-conversion-analytics.test.ts
git commit -m "feat: mostrar analÃ­tica de conversiÃ³n en el Espacio"
```

---

## Self-review

1. **Spec coverage.** CaptaciÃ³n con archivadas: tarea 1, prueba 2. Stock y movimiento ilegible: prueba 3. PÃ©rdidas, etapa de salida, sin motivos: prueba 5. Permanencia y ciclos separados: prueba 6. Cohorte observada y abiertas: prueba 4. CampaÃ±a no atribuible: prueba 7. DesasignaciÃ³n: prueba 8. Calidad visible: prueba 9. Aislamiento: prueba 1. Pantalla, permiso, nav y no duplicar AnalÃ­tica: tarea 3. MigraciÃ³n 029 y sin catÃ¡logo: guardas de las tareas 1 y 2.
2. **Placeholders.** Las once pruebas de aceptaciÃ³n del contrato quedaron en asserts concretos. No hay tarea de catÃ¡logo ni de valores inventados.
3. **Types.** `buildConversionAnalytics`, `ConversionCohortRow`, `ConversionOwnerRow`, `closureOwnerUserId` y las tres constantes de copy se usan con el mismo nombre en las tres tareas.

