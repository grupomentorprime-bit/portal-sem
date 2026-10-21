### Task 1: NÃºcleo puro y pruebas de aceptaciÃ³n

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
    "Oportunidades con fecha de apertura en el perÃ­odo, incluidas las archivadas despuÃ©s.",
  stock: "Oportunidades abiertas ahora. No depende del perÃ­odo.",
  cohorte:
    "Oportunidades abiertas en el perÃ­odo que no estÃ¡n archivadas. La tasa es el estado al momento de la consulta.",
} as const;

export const CONVERSION_RATE_NOTE =
  "Tasa al momento de la consulta. Las abiertas siguen en curso.";

export const CONVERSION_LOSS_REASONS_NOTE =
  "Los motivos de pÃ©rdida no se registran.";

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

`ConversionAnalyticsResponse` incluye `tenantId`, `period`, `readAt`, `denominators` (las tres frases de arriba), `rateNote`, `captacion` (`total`, `archivedNow`, `byFunnel`, `byOrigin`), `stock` (`byFunnel: Array<{ funnelKey, funnelLabel, stages: ConversionCountRow[] }>`), `movement` (por `funnelKey`, conteos de avance, abandono, ganada, traspaso, archivo, oportunidades distintas, mÃ¡s `ilegible`), `closures` (`won`, `lost`, `handedOff`), `losses` (`total`, `byExitStage: ConversionCountRow[]`, `reasonsRecorded: false`, `reasonsNote`), `dwell` (mediana en ms, `count`, `inProgress` por embudo y etapa), `cycle` (mediana y `count` de ganadas y de perdidas, por separado), `cohorts` (`byFunnel`, `byCampaign`, `bySource`), `owners`, `quality`.

Reglas que el cÃ³digo no puede relajar:

- Ignorar toda fila con `tenantId` distinto. Actividad sin `oportunidadId` no se atribuye.
- Alta vÃ¡lida: `openedAt` presente y dentro del perÃ­odo, incluido `status === "archived"`. Sin `openedAt`: `quality.sinFechaApertura`, fuera del total.
- `archivedNow` cuenta altas del perÃ­odo con `status === "archived"`. No es un corte extra.
- Cohorte: alta vÃ¡lida y `status !== "archived"`. `open`: `status` no es `won`, `lost`, `handed_off` ni `archived`. `rate = computeConversionRate(won, cohort)`.
- Stock: `status` no es resultado. No mira el perÃ­odo.
- Movimiento: `kind === "opportunity_transitioned"`, `occurredAt` en el perÃ­odo. `fromState` y `toState` string no vacÃ­os. Si falta alguno, `quality.movimientoIlegible` y no entra en otra barra. `toState === "lost" | "won" | "handed_off" | "archived"` clasifica abandono, ganada, traspaso o archivo. Cualquier otro `toState` es avance. Separar por `funnelKey` de la oportunidad; sin embudo, cubo `sin-embudo`.
- Cierres: `won` o `lost` con `closedAt` en el perÃ­odo. `handed_off` con `closedAt` en el perÃ­odo va a traspaso. Resultado sin `closedAt`: `quality.sinFechaCierre`, fuera de cierres y de tasas.
- Etapa de salida: entre las transiciones de esa oportunidad con `toState === "lost"` y `occurredAt <= closedAt`, la de mayor `occurredAt`. Etiqueta: etapa del embudo de la oportunidad, si no `growthFunnelResultLabel`, si no la clave. Sin `fromState` usable: la pÃ©rdida cuenta en `losses.total` y en `quality.etapaDeSalidaNoRegistrada`. No leer `summary` ni comentarios.
- `reasonsRecorded` es el literal `false`. No aceptar un campo de motivo en la entrada.
- Permanencia: recorrido del contrato (apertura, transiciones, cierre en `closedAt`). Mediana solo de intervalos con salida en el perÃ­odo. En curso hasta `readAt`, fuera de la mediana. Historial incompleto segÃºn el contrato: cubo y exclusiÃ³n; si el `status` no es resultado, sigue en el stock.
- Mediana: ordenar ascendente; impar, valor central; par, promedio de los dos centrales; cero, `null`.
- Ciclo: `closedAt - openedAt` solo con ambas fechas. Ganadas y perdidas en mapas separados.
- CampaÃ±a: `origin.campaign.trim()` igual a `trackingKey` del mismo `tenantId`. Texto que no coincide: fila Â«CampaÃ±a no registradaÂ» y `quality.campanaNoRegistrada`. Sin texto: no entra en `byCampaign`. No leer `referrer`.
- Abierta: `ownerUserId` no vacÃ­o, si no fila `userId: null`, label Â«Sin responsableÂ».
- Cierre atribuible: actividades `opportunity_assigned` de esa oportunidad con `occurredAt <= closedAt`. La Ãºltima gana. `toUserId` string no vacÃ­o atribuye. Ausente, vacÃ­o, o ninguna actividad: fila `userId: null`, label Â«Sin atribuciÃ³n de responsableÂ». No mirar asignaciones posteriores ni `ownerUserId`.
- Nombre: miembro `active` usa su `label`. Miembro inactivo o `userId` desconocido: Â«Responsable no vigenteÂ». Una fila por `userId`. Â«Sin responsableÂ» y Â«Sin atribuciÃ³n de responsableÂ» no se mezclan.
- Asignar no incrementa avance.

- [ ] **Step 1: Write the failing test**

Crear `tests/baseline/growth-conversion-analytics.test.ts` con `node:assert/strict` y `node:test`, el mismo estilo que `tests/baseline/growth-analytics-003.test.ts`. Fijar `readAt = "2026-09-11T15:00:00.000Z"` y el perÃ­odo con `resolveAnalyticsPeriod({ preset: "last_30d", now: new Date(readAt) })`. Helpers locales `opp`, `activity`, `origin` anÃ¡logos a ese archivo.

Cubrir, con asserts sobre el objeto devuelto:

1. Una oportunidad de otro `tenantId`, con el mismo `funnelKey`, `trackingKey` y `userId`, no cambia `captacion.total`, cohortes ni owners.
2. Tres altas del perÃ­odo (embudo A, embudo B, sin `funnelKey`; orÃ­genes WhatsApp, formulario y `origin` null) dan `captacion.total === 3`, suma de `byFunnel` 3, suma de `byOrigin` 3, labels Â«Sin embudoÂ» y Â«Sin origen claroÂ». Una cuarta con `status: "archived"` y `openedAt` en el perÃ­odo sube el total a 4, `archivedNow` a 1, y la cohorte queda en 3.
3. Una abierta con `openedAt` anterior al perÃ­odo estÃ¡ en el stock y no en el movimiento. Una transiciÃ³n del perÃ­odo sin `fromState` sube `quality.movimientoIlegible` y no sube avance. Una `handed_off` con `closedAt` en el perÃ­odo sube traspaso y no sube `closures.won` ni `closures.lost`.
4. `won` sin `closedAt` sube `quality.sinFechaCierre` y no la tasa. Cohorte de cero oportunidades: no hay fila, y `computeConversionRate(0, 0) === null`. Una cohorte de 2 (una `won`, una con `status: "open"`) tiene `won === 1`, `open === 1`, `cohort === 2`, `rate === 0.5`. Una `handed_off` de la cohorte entra en `cohort` y `handedOff`, no en `won`.
5. PÃ©rdida con transiciÃ³n `fromState: "propuesta"` â†’ `lost` antes de `closedAt` aparece en `byExitStage` y `losses.total === 1`. Otra pÃ©rdida sin transiciÃ³n sigue en `total` y sube `etapaDeSalidaNoRegistrada`. `summary: "precio"` no crea una fila. `reasonsRecorded === false` y `reasonsNote` es la constante. El archivo de producciÃ³n, leÃ­do con `readFileSync`, no contiene `lossReasonKey`.
6. Dos intervalos terminados de 2 y 4 dÃ­as con salida en el perÃ­odo: mediana 3 dÃ­as en ms (`3 * 86_400_000`). Un tercer caso en curso no cambia la mediana. `status` distinto de la Ãºltima `toState` sube `historialIncompleto`, sigue en stock si no es resultado, y no entra en la mediana. Ciclo de una ganada de 5 dÃ­as y una perdida de 1 dÃ­a quedan en medianas distintas.
7. `origin.campaign === "verano"` con campaÃ±a del Espacio entra por nombre de campaÃ±a. `"desconocida"` es la fila Â«CampaÃ±a no registradaÂ» y `quality.campanaNoRegistrada === 1`. Un `referrer` en el payload no atribuye. El test no pasa origen de persona: si `origin` falta, la fuente es Â«Sin origen claroÂ».
8. Abierta con `ownerUserId: "ana"` suma en Ana. Ganada cuya Ãºltima asignaciÃ³n `<= closedAt` tiene `toUserId: ""` cae en Â«Sin atribuciÃ³n de responsableÂ» aunque antes hubo `toUserId: "ana"` y aunque `ownerUserId` actual sea `"ana"`. Una asignaciÃ³n posterior a `closedAt` no mueve esa ganada. Sin ninguna asignaciÃ³n, el mismo cubo.
9. Cada cubo de calidad del caso anterior es un nÃºmero en `quality`, no una `ConversionCountRow` dentro de `stock`, `captacion.byOrigin` ni `owners` con label de etapa.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/growth-conversion-analytics.test.ts`

Expected: FAIL, mÃ³dulo `conversion-analytics` inexistente.

- [ ] **Step 3: Write minimal implementation**

Implementar `buildConversionAnalytics` en `src/lib/growth/conversion-analytics.ts` con las reglas de esta tarea. Ordenar filas de conteo por `count` descendente y luego `label` con `localeCompare(..., "es")`, igual que `sortedCountRows` de AnalÃ­tica V1. Reexportar funciÃ³n y tipos desde `src/lib/growth/index.ts`.

AtribuciÃ³n de cierre, sin atajos:

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

`null` significa Â«Sin atribuciÃ³n de responsableÂ», nunca el responsable actual.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/growth-conversion-analytics.test.ts tests/baseline/growth-analytics-003.test.ts`

Expected: PASS. El segundo archivo sigue verde: esta fase no cambia la cohorte de AnalÃ­tica V1.

- [ ] **Step 5: Commit**

```bash
git add src/lib/growth/conversion-analytics.ts src/lib/growth/index.ts tests/baseline/growth-conversion-analytics.test.ts
git commit -m "feat: calcular analÃ­tica de conversiÃ³n desde el nÃºcleo Growth"
```

---

