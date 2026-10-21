# Task 2 — Lectura por Espacio

Status: DONE

## Archivos
- Creado: `src/lib/growth/conversion-analytics-read.ts`
- Modificado: `tests/baseline/growth-conversion-analytics.test.ts` (describe "conversion-analytics-read — guarda de fuente", 5 tests)

## RED
`npx tsx --test tests/baseline/growth-conversion-analytics.test.ts`

```
✖ conversion-analytics-read — guarda de fuente
  Error: ENOENT: no such file or directory, open '...\src\lib\growth\conversion-analytics-read.ts'
ℹ tests 20 / pass 20 / fail 0   (la suite de guarda falla al leer el archivo inexistente)
```

## GREEN
Mismo comando tras implementar:

```
✔ conversion-analytics-read — guarda de fuente
  ✔ es server-only y filtra por tenantId
  ✔ lee solo los kinds de movimiento necesarios
  ✔ no escribe, no migra y no toca métricas de campaña
  ✔ la analítica previa no importa conversion-analytics
  ✔ la lectura server-only no se reexporta desde el índice de Growth
ℹ tests 25 / pass 25 / fail 0
```

`tsc --noEmit` no reporta errores en archivos `conversion-analytics*`.

## Implementación
`getConversionAnalytics(tenantId, query)` devuelve `{ ok:true, data }` o `{ ok:false, error, status:400 }`.
1. `resolveAnalyticsPeriod`; si falla, 400.
2. `find { tenantId }` de todas las oportunidades (sin recorte por período).
3. `find { tenantId, kind: { $in: [opened, transitioned, assigned] } }` de actividades, sin recorte por `occurredAt`.
4. Embudos: `createMongoGrowthFunnelDirectory(db).listFunnels(tenantId)` (`find { tenantId }`), y etapas desde la definición de workflow vía `getDefinition` + `stagesFromDefinition`. Se usa `createMongo…` y no `openGrowthFunnelDirectory` porque este último ejecuta `ensureGrowthFunnelIndexes` (crearía índices).
5. Campañas `find { tenantId }`.
6. Membresías de cualquier estado (`listMembershipsByTenant`) + `listUsersByIds`; `active = status === "active"`; label = `displayName` o email (o userId como último recurso).
7. Nombres de formulario solo de `origin.formId` de esas oportunidades (`resolveFormNames`, mismo patrón que `analytics-read.ts`).
8. `readAt = new Date().toISOString()`; proyección explícita a los tipos de entrada; `buildConversionAnalytics`.

## Notas / desvíos
- El brief decía "no importar conversion-analytics" para `analytics-read.ts` y `analytics-aggregate.ts`: cumple. Pero `src/lib/growth/index.ts` (Task 1) ya reexporta el núcleo puro `./conversion-analytics`; mi guarda del índice se acotó a `conversion-analytics-read` (el módulo server-only), que no se reexporta.
- Las etapas de embudo se leen desde `workflow_definitions` a través del directorio de embudos (no listado en el brief, pero necesario para `ConversionFunnelInput.stages`). Solo lectura.
- No se tocó migración 029, datos de producción, ni se creó colección/índice.
