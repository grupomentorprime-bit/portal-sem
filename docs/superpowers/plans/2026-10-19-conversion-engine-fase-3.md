# Conversion Engine fase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar analítica de conversión del Espacio en `/admin/conversion/analitica`, calculada en lectura desde oportunidades, actividades, embudos, campañas y membresías que ya existen.

**Architecture:** Una función pura `buildConversionAnalytics` recibe documentos ya acotados al Espacio y devuelve captación, stock, movimiento, pérdidas con etapa de salida, permanencia, cohortes y responsables. Un read model solo lee. La pantalla reutiliza las piezas visuales de Analítica V1 y no toca `/admin/analitica`.

**Tech Stack:** TypeScript, Next.js App Router, Mongo read-only, `node:test` vía `tsx --test`, permisos `growth.sales.view`.

**Spec:** `docs/superpowers/specs/2026-10-19-conversion-engine-fase-3-design.md`

## Global Constraints

- Un único núcleo Growth OS. Sin almacén analítico paralelo y sin materializar métricas.
- Toda lectura filtra por `tenantId`. Una fila de otro Espacio no suma.
- Período Analítica V1: UTC, `[start, end)`, presets `last_7d`, `last_30d`, `this_month`, `previous_month`, `custom` (tope 366 días). Default `last_30d`. Reutilizar `resolveAnalyticsPeriod` e `isTimestampInPeriod`.
- Unidad: la oportunidad. Origen: `oportunidad.origin`, nunca el de la persona ni `referrer`.
- Captación incluye altas con `openedAt` en el período aunque hoy estén `archived`. La cohorte de conversión las excluye. El stock es el estado actual no final y no usa el período.
- Tasa con denominador 0: `null`, que la UI muestra como «—».
- La tasa de cohorte es el estado en `readAt`. Cada fila publica `open`.
- Los motivos de pérdida no se registran. No hay catálogo, no hay `lossReasonKey`, el comentario no es un motivo.
- Cierre sin `toUserId` en la última `opportunity_assigned` con `occurredAt <= closedAt`: «Sin atribución de responsable». No usar `ownerUserId` ni una asignación anterior.
- Los cubos de calidad se muestran cuando son mayores que cero y no se esconden dentro de otra serie.
- Sin IA, pronósticos, metas, montos, comparación con el período anterior ni exportación.
- No ejecutar la migración `029-growth-conversion-phase2`.
- No cambiar el contrato de `buildAnalyticsV1Response` ni la pantalla `/admin/analitica`.
- Etiquetas de etapa: embudo del Espacio. Resultados: `growthFunnelResultLabel` (Ganada, Perdida, Traspasada, Archivada).

## File structure

- Create: `src/lib/growth/conversion-analytics.ts` — tipos, denominadores y `buildConversionAnalytics`. Sin I/O.
- Create: `src/lib/growth/conversion-analytics-read.ts` — `getConversionAnalytics`. Solo lecturas por `tenantId`.
- Create: `src/app/api/growth/conversion-analytics/route.ts` — `GET`, permiso `growth.sales.view`.
- Create: `src/app/admin/conversion/analitica/page.tsx` — guard de página y primer render.
- Create: `src/components/admin/growth/ConversionAnaliticaClient.tsx` — pantalla.
- Create: `src/components/admin/growth/analitica-visual.tsx` — `StorySection`, `HeroMetric`, `ProportionBars`, `PeriodSelector` extraídos de `AnaliticaClient.tsx`. El copy de Analítica V1 se queda en ese cliente.
- Create: `tests/baseline/growth-conversion-analytics.test.ts` — pruebas de aceptación 1–9 y guardas de fuente.
- Modify: `src/components/admin/growth/AnaliticaClient.tsx` — importar las piezas extraídas. Mismas preguntas, mismo endpoint `/api/growth/analytics`.
- Modify: `src/lib/admin/nav-domains.ts` — ítem después de Panel comercial; `excludePrefixes: ["/admin/conversion/analitica"]` en Panel.
- Modify: `src/lib/growth/labels.ts` — copy de esta pantalla, sin tocar las cadenas que ya afirma `growth-ux-analytics-004.test.ts`.
- Modify: `src/lib/growth/index.ts` — reexportar la función pura y los tipos, no el read model con `server-only`.

---

### Task 1: Núcleo puro y pruebas de aceptación

**Files:**
- Create: `src/lib/growth/conversion-analytics.ts`
- Create: `tests/baseline/growth-conversion-analytics.test.ts`
- Modify: `src/lib/growth/index.ts`

**Interfaces:**
- Consumes: `AnalyticsPeriod`, `isTimestampInPeriod` (`src/lib/growth/analytics-period.ts`); `acquisitionOriginGroupLabel`, `computeConversionRate` (`src/lib/growth/analytics-aggregate.ts`); `isGrowthFunnelResultKey`, `growthFunnelResultLabel` (`src/core/growth/funnel-types.ts`); `GrowthOrigin` (`src/core/growth/types.ts`).
- Produces: `buildConversionAnalytics(input: BuildConversionAnalyticsInput): ConversionAnalyticsResponse`.

Tipos que el resto del plan usa tal cual:

```ts
export const CONVERSION_DENOMINATORS = {
  captacion:
    "Oportunidades con fecha de apertura en el período, incluidas las archivadas después.",
  stock: "Oportunidades abiertas ahora. No depende del período.",
  cohorte:
    "Oportunidades abiertas en el período que no están archivadas. La tasa es el estado al momento de la consulta.",
} as const;

export const CONVERSION_RATE_NOTE =
  "Tasa al momento de la consulta. Las abiertas siguen en curso.";

export const CONVERSION_LOSS_REASONS_NOTE =
  "Los motivos de pérdida no se registran.";

export type ConversionCountRow = { key: string; label: string; count: number };

export type ConversionCohortRow = {
  key: string;
  label: string;
  cohort: number;
  won: number;
  open: number;
  lost: number;
  handedOff: number;
  rate: number | null;
};

export type ConversionOwnerRow = {
  userId: string | null;
  label: string;
  open: number;
  won: number;
  lost: number;
  handedOff: number;
  wonCycleMedianMs: number | null;
  wonCycleCount: number;
};

export type ConversionAnalyticsQuality = {
  sinFechaApertura: number;
  sinFechaCierre: number;
  historialIncompleto: number;
  movimientoIlegible: number;
  campanaNoRegistrada: number;
  etapaDeSalidaNoRegistrada: number;
};

export type ConversionOpportunityInput = {
  _id: string;
  tenantId: string;
  status: string;
  openedAt?: string;
  closedAt?: string;
  origin?: { kind?: string; channel?: string; formId?: string; campaign?: string } | null;
  funnelKey?: string;
  ownerUserId?: string;
};

export type ConversionActivityInput = {
  _id: string;
  tenantId: string;
  oportunidadId?: string;
  kind: string;
  occurredAt?: string;
  summary?: string;
  payload?: Record<string, unknown>;
};

export type ConversionFunnelInput = {
  tenantId: string;
  key: string;
  stages: Array<{ key: string; label: string }>;
};

export type ConversionCampaignInput = {
  tenantId: string;
  _id: string;
  name: string;
  trackingKey: string;
};

export type ConversionMemberInput = {
  userId: string;
  label: string;
  active: boolean;
};

export type BuildConversionAnalyticsInput = {
  tenantId: string;
  period: AnalyticsPeriod;
  readAt: string;
  opportunities: ConversionOpportunityInput[];
  activities: ConversionActivityInput[];
  funnels: ConversionFunnelInput[];
  campaigns: ConversionCampaignInput[];
  members: ConversionMemberInput[];
  formNameById?: Map<string, string>;
};
```

`ConversionAnalyticsResponse` incluye `tenantId`, `period`, `readAt`, `denominators` (las tres frases de arriba), `rateNote`, `captacion` (`total`, `archivedNow`, `byFunnel`, `byOrigin`), `stock` (`byFunnel: Array<{ funnelKey, funnelLabel, stages: ConversionCountRow[] }>`), `movement` (por `funnelKey`, conteos de avance, abandono, ganada, traspaso, archivo, oportunidades distintas, más `ilegible`), `closures` (`won`, `lost`, `handedOff`), `losses` (`total`, `byExitStage: ConversionCountRow[]`, `reasonsRecorded: false`, `reasonsNote`), `dwell` (mediana en ms, `count`, `inProgress` por embudo y etapa), `cycle` (mediana y `count` de ganadas y de perdidas, por separado), `cohorts` (`byFunnel`, `byCampaign`, `bySource`), `owners`, `quality`.

Reglas que el código no puede relajar:

- Ignorar toda fila con `tenantId` distinto. Actividad sin `oportunidadId` no se atribuye.
- Alta válida: `openedAt` presente y dentro del período, incluido `status === "archived"`. Sin `openedAt`: `quality.sinFechaApertura`, fuera del total.
- `archivedNow` cuenta altas del período con `status === "archived"`. No es un corte extra.
- Cohorte: alta válida y `status !== "archived"`. `open`: `status` no es `won`, `lost`, `handed_off` ni `archived`. `rate = computeConversionRate(won, cohort)`.
- Stock: `status` no es resultado. No mira el período.
- Movimiento: `kind === "opportunity_transitioned"`, `occurredAt` en el período. `fromState` y `toState` string no vacíos. Si falta alguno, `quality.movimientoIlegible` y no entra en otra barra. `toState === "lost" | "won" | "handed_off" | "archived"` clasifica abandono, ganada, traspaso o archivo. Cualquier otro `toState` es avance. Separar por `funnelKey` de la oportunidad; sin embudo, cubo `sin-embudo`.
- Cierres: `won` o `lost` con `closedAt` en el período. `handed_off` con `closedAt` en el período va a traspaso. Resultado sin `closedAt`: `quality.sinFechaCierre`, fuera de cierres y de tasas.
- Etapa de salida: entre las transiciones de esa oportunidad con `toState === "lost"` y `occurredAt <= closedAt`, la de mayor `occurredAt`. Etiqueta: etapa del embudo de la oportunidad, si no `growthFunnelResultLabel`, si no la clave. Sin `fromState` usable: la pérdida cuenta en `losses.total` y en `quality.etapaDeSalidaNoRegistrada`. No leer `summary` ni comentarios.
- `reasonsRecorded` es el literal `false`. No aceptar un campo de motivo en la entrada.
- Permanencia: recorrido del contrato (apertura, transiciones, cierre en `closedAt`). Mediana solo de intervalos con salida en el período. En curso hasta `readAt`, fuera de la mediana. Historial incompleto según el contrato: cubo y exclusión; si el `status` no es resultado, sigue en el stock.
- Mediana: ordenar ascendente; impar, valor central; par, promedio de los dos centrales; cero, `null`.
- Ciclo: `closedAt - openedAt` solo con ambas fechas. Ganadas y perdidas en mapas separados.
- Campaña: `origin.campaign.trim()` igual a `trackingKey` del mismo `tenantId`. Texto que no coincide: fila «Campaña no registrada» y `quality.campanaNoRegistrada`. Sin texto: no entra en `byCampaign`. No leer `referrer`.
- Abierta: `ownerUserId` no vacío, si no fila `userId: null`, label «Sin responsable».
- Cierre atribuible: actividades `opportunity_assigned` de esa oportunidad con `occurredAt <= closedAt`. La última gana. `toUserId` string no vacío atribuye. Ausente, vacío, o ninguna actividad: fila `userId: null`, label «Sin atribución de responsable». No mirar asignaciones posteriores ni `ownerUserId`.
- Nombre: miembro `active` usa su `label`. Miembro inactivo o `userId` desconocido: «Responsable no vigente». Una fila por `userId`. «Sin responsable» y «Sin atribución de responsable» no se mezclan.
- Asignar no incrementa avance.

- [ ] **Step 1: Write the failing test**

Crear `tests/baseline/growth-conversion-analytics.test.ts` con `node:assert/strict` y `node:test`, el mismo estilo que `tests/baseline/growth-analytics-003.test.ts`. Fijar `readAt = "2026-09-11T15:00:00.000Z"` y el período con `resolveAnalyticsPeriod({ preset: "last_30d", now: new Date(readAt) })`. Helpers locales `opp`, `activity`, `origin` análogos a ese archivo.

Cubrir, con asserts sobre el objeto devuelto:

1. Una oportunidad de otro `tenantId`, con el mismo `funnelKey`, `trackingKey` y `userId`, no cambia `captacion.total`, cohortes ni owners.
2. Tres altas del período (embudo A, embudo B, sin `funnelKey`; orígenes WhatsApp, formulario y `origin` null) dan `captacion.total === 3`, suma de `byFunnel` 3, suma de `byOrigin` 3, labels «Sin embudo» y «Sin origen claro». Una cuarta con `status: "archived"` y `openedAt` en el período sube el total a 4, `archivedNow` a 1, y la cohorte queda en 3.
3. Una abierta con `openedAt` anterior al período está en el stock y no en el movimiento. Una transición del período sin `fromState` sube `quality.movimientoIlegible` y no sube avance. Una `handed_off` con `closedAt` en el período sube traspaso y no sube `closures.won` ni `closures.lost`.
4. `won` sin `closedAt` sube `quality.sinFechaCierre` y no la tasa. Cohorte de cero oportunidades: no hay fila, y `computeConversionRate(0, 0) === null`. Una cohorte de 2 (una `won`, una con `status: "open"`) tiene `won === 1`, `open === 1`, `cohort === 2`, `rate === 0.5`. Una `handed_off` de la cohorte entra en `cohort` y `handedOff`, no en `won`.
5. Pérdida con transición `fromState: "propuesta"` → `lost` antes de `closedAt` aparece en `byExitStage` y `losses.total === 1`. Otra pérdida sin transición sigue en `total` y sube `etapaDeSalidaNoRegistrada`. `summary: "precio"` no crea una fila. `reasonsRecorded === false` y `reasonsNote` es la constante. El archivo de producción, leído con `readFileSync`, no contiene `lossReasonKey`.
6. Dos intervalos terminados de 2 y 4 días con salida en el período: mediana 3 días en ms (`3 * 86_400_000`). Un tercer caso en curso no cambia la mediana. `status` distinto de la última `toState` sube `historialIncompleto`, sigue en stock si no es resultado, y no entra en la mediana. Ciclo de una ganada de 5 días y una perdida de 1 día quedan en medianas distintas.
7. `origin.campaign === "verano"` con campaña del Espacio entra por nombre de campaña. `"desconocida"` es la fila «Campaña no registrada» y `quality.campanaNoRegistrada === 1`. Un `referrer` en el payload no atribuye. El test no pasa origen de persona: si `origin` falta, la fuente es «Sin origen claro».
8. Abierta con `ownerUserId: "ana"` suma en Ana. Ganada cuya última asignación `<= closedAt` tiene `toUserId: ""` cae en «Sin atribución de responsable» aunque antes hubo `toUserId: "ana"` y aunque `ownerUserId` actual sea `"ana"`. Una asignación posterior a `closedAt` no mueve esa ganada. Sin ninguna asignación, el mismo cubo.
9. Cada cubo de calidad del caso anterior es un número en `quality`, no una `ConversionCountRow` dentro de `stock`, `captacion.byOrigin` ni `owners` con label de etapa.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/growth-conversion-analytics.test.ts`

Expected: FAIL, módulo `conversion-analytics` inexistente.

- [ ] **Step 3: Write minimal implementation**

Implementar `buildConversionAnalytics` en `src/lib/growth/conversion-analytics.ts` con las reglas de esta tarea. Ordenar filas de conteo por `count` descendente y luego `label` con `localeCompare(..., "es")`, igual que `sortedCountRows` de Analítica V1. Reexportar función y tipos desde `src/lib/growth/index.ts`.

Atribución de cierre, sin atajos:

```ts
function closureOwnerUserId(
  activities: ConversionActivityInput[],
  opportunityId: string,
  closedAt: string
): string | null {
  const prior = activities
    .filter(
      (a) =>
        a.oportunidadId === opportunityId &&
        a.kind === "opportunity_assigned" &&
        typeof a.occurredAt === "string" &&
        a.occurredAt <= closedAt
    )
    .sort((a, b) => a.occurredAt!.localeCompare(b.occurredAt!));
  const last = prior.at(-1);
  if (!last) return null;
  const toUserId = last.payload?.toUserId;
  if (typeof toUserId !== "string" || toUserId.trim() === "") return null;
  return toUserId.trim();
}
```

`null` significa «Sin atribución de responsable», nunca el responsable actual.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/growth-conversion-analytics.test.ts tests/baseline/growth-analytics-003.test.ts`

Expected: PASS. El segundo archivo sigue verde: esta fase no cambia la cohorte de Analítica V1.

- [ ] **Step 5: Commit**

```bash
git add src/lib/growth/conversion-analytics.ts src/lib/growth/index.ts tests/baseline/growth-conversion-analytics.test.ts
git commit -m "feat: calcular analítica de conversión desde el núcleo Growth"
```

---

### Task 2: Lectura por Espacio

**Files:**
- Create: `src/lib/growth/conversion-analytics-read.ts`
- Test: `tests/baseline/growth-conversion-analytics.test.ts` (guarda de fuente; la función pura ya cubre el cálculo)

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
2. `find` de actividades `{ tenantId, kind: { $in: ["opportunity_opened", "opportunity_transitioned", "opportunity_assigned"] } }`. El historial anterior al período hace falta para permanencia y atribución; no recortar por `occurredAt` en Mongo.
3. `find` de embudos y campañas `{ tenantId }`.
4. Membresías del Espacio de cualquier estado. `active: membership.status === "active"`. Label: `displayName` o email. La vigencia la resuelve el núcleo puro.
5. Nombres de formulario solo para los `origin.formId` de esas oportunidades.
6. `readAt = new Date().toISOString()` y llamar a `buildConversionAnalytics`. Proyectar al tipo de entrada; no pasar el documento crudo de más.

No crear colección ni índice.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/growth-conversion-analytics.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/growth/conversion-analytics-read.ts tests/baseline/growth-conversion-analytics.test.ts
git commit -m "feat: leer analítica de conversión del Espacio sin materializarla"
```

---

### Task 3: Ruta, navegación y pantalla

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
- Consumes: `getConversionAnalytics`, `ConversionAnalyticsResponse`, `formatConversionPercent`, piezas visuales extraídas, `requirePermission`, `can`, `loadSessionContext`.
- Produces: `GET /api/growth/conversion-analytics` y la página `/admin/conversion/analitica`.

- [ ] **Step 1: Write the failing source guard**

Afirmar en el test:

- `src/app/admin/analitica/page.tsx` sigue con `getAnalyticsV1` y `growth.analytics.view`, y no menciona `conversion-analytics` ni `etapa`.
- `src/app/admin/conversion/page.tsx` no importa `ConversionAnaliticaClient`.
- `nav-domains.ts`: el ítem Panel comercial tiene `excludePrefixes` que incluye `/admin/conversion/analitica`. El ítem nuevo está en el grupo `conversion`, `href: "/admin/conversion/analitica"`, label `Analítica de conversión`, y `requiredAnyPermission` es exactamente `["growth.sales.view"]`. Aparece después de `nav-conversion` en el archivo.
- La página nueva exige `growth.sales.view` y redirige a `/login?next=/admin/conversion/analitica` sin sesión.
- La ruta API usa `requirePermission("growth.sales.view")` y no `growth.analytics.view`.
- El cliente nuevo contiene `CONVERSION_DENOMINATORS`, `CONVERSION_RATE_NOTE`, `CONVERSION_LOSS_REASONS_NOTE`, «Sin datos en el período», `data-conversion-analitica`, y la clase de una columna (`flex flex-col` o `grid-cols-1`). No contiene `lossReason`, series de ejemplo, ni `/api/growth/analytics`.
- `AnaliticaClient.tsx` conserva las preguntas que ya fija `growth-ux-analytics-004.test.ts`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/growth-conversion-analytics.test.ts tests/baseline/growth-ux-analytics-004.test.ts`

Expected: FAIL en las afirmaciones nuevas. El test de Analítica V1 sigue PASS.

- [ ] **Step 3: Write minimal implementation**

Extraer de `AnaliticaClient.tsx` a `analitica-visual.tsx` las funciones `StorySection`, `HeroMetric`, `ProportionBars` y `PeriodSelector`, más los helpers de fecha que solo ellas usan. `AnaliticaClient` las importa y conserva su copy y su fetch a `/api/growth/analytics`.

`route.ts` copia la forma de `src/app/api/growth/analytics/route.ts` con permiso `growth.sales.view` y `getConversionAnalytics`. Error de período: 400. Excepción: 500. No devolver ceros en el catch.

`page.tsx` sigue el guard de `src/app/admin/analitica/page.tsx`, con `growth.sales.view` y `next=/admin/conversion/analitica`. Pasa `initial` y el preset al cliente.

En `nav-domains.ts`, dentro del grupo `conversion`, después del ítem `nav-conversion`:

```ts
{
  id: "nav-conversion-analitica",
  href: "/admin/conversion/analitica",
  label: "Analítica de conversión",
  icon: "sales",
  matchPrefixes: ["/admin/conversion/analitica"],
  requiredAnyPermission: ["growth.sales.view"],
},
```

Y en Panel comercial agregar `excludePrefixes: ["/admin/conversion/analitica"]`.

Cliente, una columna, secciones en este orden: captación, stock, movimiento, pérdidas, permanencia, cohortes, responsables, calidad. Cada sección muestra la frase de denominador que corresponda. Cohortes: tabla con cohorte, ganadas, abiertas, perdidas, traspasadas y `formatConversionPercent(rate)`, más `CONVERSION_RATE_NOTE`. Pérdidas: conteo, barras de etapa de salida reutilizando `ProportionBars`, y `CONVERSION_LOSS_REASONS_NOTE`. No hay selector ni lista de motivos. Calidad: una lista con los seis cubos cuyo valor sea mayor que cero. Permanencia y ciclo: días con un decimal (`ms / 86_400_000`), «—» si la mediana es `null`, y el `count` al lado. El selector de embudo solo elige una serie ya calculada; «Todos» no concatena etapas de embudos distintos.

Vacío: si no hay oportunidades en la respuesta (captación, stock, movimiento, cierres y cohortes en cero y calidad en cero), `EmptyState` con «Sin datos en el período». Si el período está vacío y el stock no, el stock se muestra y las secciones del período usan ese mismo texto. Error de lectura: `AlertBanner`, nunca ceros. El fetch del cliente va a `/api/growth/conversion-analytics` con `preset`, `from` y `to`, igual que Analítica V1.

Labels nuevos en `labels.ts`. No reescribir las cadenas que el test 004 ya busca.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/growth-conversion-analytics.test.ts tests/baseline/growth-ux-analytics-004.test.ts tests/baseline/growth-analytics-003.test.ts`

Expected: PASS los tres.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/growth/analitica-visual.tsx src/components/admin/growth/AnaliticaClient.tsx src/components/admin/growth/ConversionAnaliticaClient.tsx src/app/api/growth/conversion-analytics/route.ts src/app/admin/conversion/analitica/page.tsx src/lib/admin/nav-domains.ts src/lib/growth/labels.ts tests/baseline/growth-conversion-analytics.test.ts
git commit -m "feat: mostrar analítica de conversión en el Espacio"
```

---

## Self-review

1. **Spec coverage.** Captación con archivadas: tarea 1, prueba 2. Stock y movimiento ilegible: prueba 3. Pérdidas, etapa de salida, sin motivos: prueba 5. Permanencia y ciclos separados: prueba 6. Cohorte observada y abiertas: prueba 4. Campaña no atribuible: prueba 7. Desasignación: prueba 8. Calidad visible: prueba 9. Aislamiento: prueba 1. Pantalla, permiso, nav y no duplicar Analítica: tarea 3. Migración 029 y sin catálogo: guardas de las tareas 1 y 2.
2. **Placeholders.** Las once pruebas de aceptación del contrato quedaron en asserts concretos. No hay tarea de catálogo ni de valores inventados.
3. **Types.** `buildConversionAnalytics`, `ConversionCohortRow`, `ConversionOwnerRow`, `closureOwnerUserId` y las tres constantes de copy se usan con el mismo nombre en las tres tareas.
