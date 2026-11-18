# Congreso Varones — Recepción UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar el panel operativo del Congreso de Varones como herramienta de recepción (jornada, tabla, ficha, alta modal, pagos/alojamiento independientes) reutilizando APIs y permisos existentes.

**Architecture:** Extender dominio puro (`attendance`, finanzas UI, alojamiento UI, días previstos) con tests `node:test`; cablear handlers API existentes; modularizar `CongressOpsPanel` en Recepción + ficha + modal; unificar nav en `/admin/portal/congreso-varones`. Indicadores del día desde summary (universo completo); listado filtrado aparte.

**Tech Stack:** TypeScript, Next.js App Router, MongoDB via repos actuales, admin kit (`Drawer`/`Dialog`/`AdminDataTable`), `npx tsx --test`.

**Spec:** `docs/superpowers/specs/2026-11-17-congreso-varones-recepcion-design.md`  
**Estado:** autorizado — implementación en curso/completada en sesión (sin commit/PR)

## Global Constraints

- Sin importación definitiva (commit Excel), sin despliegue, **sin commit/PR de git** (acuerdo vigente: omitir pasos `git commit` / `git push`).
- No modificar el formulario público `ipn-asistencia-congreso-varones-2026`.
- Reutilizar permisos `congress.*` y APIs bajo `/api/congress/**`; no inventar motor financiero nuevo.
- Hora de llegada: reloj del servidor; display `America/Santiago`; primera `markedAt` inmutable ante reintentos `present:true`.
- Corrección/limpieza de asistencia exige `reason`; conservar `attendanceHistory`.
- Indicadores generales del día: todo el evento; “N resultados” = filtrados.
- Saldo 0 + `needsReview` ≠ “Pagado”.
- Idempotencia/duplicados en servidor; UI solo complementa.
- Default alojamiento al alta: `unknown`, nunca `none`.

## File map

| Path | Responsibility |
|------|----------------|
| `src/core/congress/types.ts` | Campos nuevos en inscripción |
| `src/core/congress/attendance.ts` | `applyAttendanceChange` (primera hora, motivo, historial) |
| `src/core/congress/expected-days.ts` | `labelExpectedDays`, parseo seguro de label legacy |
| `src/core/congress/finance-status.ts` | `deriveContributionStatus` |
| `src/core/congress/lodging-status.ts` | `resolveLodgingUiState`, filtro pendiente + motivo |
| `src/lib/congress/repository.ts` | Defaults en draft/lectura; summary día |
| `src/lib/congress/door.ts` | `expectedDays` / `lodgingNeed` en alta |
| `src/lib/congress/lodging.ts` | Invariantes need vs assignment |
| `src/app/api/congress/registrations/[id]/attendance/route.ts` | reason, applyAttendanceChange |
| `src/app/api/congress/registrations/door/route.ts` | campos nuevos |
| `src/app/api/congress/lodging/assignments/**` | rechazar contradicciones |
| `src/lib/admin/nav-access.ts`, `nav-domains.ts` | home path |
| `src/app/admin/portal/congreso-varones/page.tsx` | montar panel + permisos |
| `src/app/admin/portal/forms/panel/[id]/page.tsx` | alias → home o mismo panel |
| `src/components/admin/congress/**` | UI modular |
| `tests/baseline/congress-domain.test.ts` | tests dominio nuevos |
| `tests/baseline/congress-reception-labels.test.ts` | labels/estados UI |

---

### Task 1: Dominio — asistencia con primera hora, motivo e historial

**Files:**
- Modify: `src/core/congress/types.ts`
- Modify: `src/core/congress/attendance.ts`
- Modify: `tests/baseline/congress-domain.test.ts`

**Interfaces:**
- Produces:
  - `CongressAttendanceHistoryEntry`
  - `applyAttendanceChange(input): { ok: true; attendance; attendanceMeta; attendanceHistory } | { ok: false; error: "reason_required" }`
  - Idempotente si `present===true` y ya presente con `markedAt`

- [ ] **Step 1: Extender tipos**

En `types.ts`, añadir a `CongressRegistration`:

```ts
expectedDays?: { saturday: boolean | null; sunday: boolean | null };
lodgingNeed?: "unknown" | "none" | "requested";
attendanceMeta?: {
  saturdayMarkedAt?: string | null;
  sundayMarkedAt?: string | null;
};
attendanceHistory?: Array<{
  day: CongressAttendanceDay;
  previousPresent: boolean | null;
  nextPresent: boolean | null;
  previousMarkedAt: string | null;
  reason: string | null;
  at: string;
  actorUserId: string;
}>;
```

- [ ] **Step 2: Test fallido — primera hora + motivo**

Añadir en `congress-domain.test.ts`:

```ts
import { applyAttendanceChange } from "../../src/core/congress/attendance";

it("conserva la primera hora de llegada ante present=true repetido", () => {
  const first = applyAttendanceChange({
    attendance: { saturday: null, sunday: null },
    attendanceMeta: {},
    attendanceHistory: [],
    day: "saturday",
    present: true,
    nowIso: "2026-11-21T12:00:00.000Z",
    actorUserId: "u1",
  });
  assert.equal(first.ok, true);
  if (!first.ok) return;
  const second = applyAttendanceChange({
    attendance: first.attendance,
    attendanceMeta: first.attendanceMeta,
    attendanceHistory: first.attendanceHistory,
    day: "saturday",
    present: true,
    nowIso: "2026-11-21T15:00:00.000Z",
    actorUserId: "u1",
  });
  assert.equal(second.ok, true);
  if (!second.ok) return;
  assert.equal(second.attendanceMeta.saturdayMarkedAt, "2026-11-21T12:00:00.000Z");
  assert.equal(second.attendanceHistory.length, first.attendanceHistory.length);
});

it("exige motivo para limpiar o corregir marcación", () => {
  const marked = applyAttendanceChange({
    attendance: { saturday: null, sunday: null },
    attendanceMeta: {},
    attendanceHistory: [],
    day: "saturday",
    present: true,
    nowIso: "2026-11-21T12:00:00.000Z",
    actorUserId: "u1",
  });
  assert.equal(marked.ok, true);
  if (!marked.ok) return;
  const clearNoReason = applyAttendanceChange({
    attendance: marked.attendance,
    attendanceMeta: marked.attendanceMeta,
    attendanceHistory: marked.attendanceHistory,
    day: "saturday",
    present: null,
    nowIso: "2026-11-21T13:00:00.000Z",
    actorUserId: "u1",
  });
  assert.equal(clearNoReason.ok, false);
  const clear = applyAttendanceChange({
    attendance: marked.attendance,
    attendanceMeta: marked.attendanceMeta,
    attendanceHistory: marked.attendanceHistory,
    day: "saturday",
    present: null,
    reason: "Error de operador",
    nowIso: "2026-11-21T13:00:00.000Z",
    actorUserId: "u1",
  });
  assert.equal(clear.ok, true);
  if (!clear.ok) return;
  assert.equal(clear.attendance.saturday, null);
  assert.equal(clear.attendanceMeta.saturdayMarkedAt, null);
  assert.equal(clear.attendanceHistory.length, 2);
  assert.equal(clear.attendanceHistory[1]?.previousMarkedAt, "2026-11-21T12:00:00.000Z");
});
```

- [ ] **Step 3: Correr test (FAIL)**

Run: `npx tsx --test tests/baseline/congress-domain.test.ts`  
Expected: FAIL — `applyAttendanceChange` no exportado.

- [ ] **Step 4: Implementar `applyAttendanceChange`**

En `attendance.ts`: mantener `setAttendanceDay` / `emptyAttendance`; añadir lógica según spec §5 (idempotencia, reason, historial, clear meta sin borrar historial).

- [ ] **Step 5: Correr test (PASS)**

Run: `npx tsx --test tests/baseline/congress-domain.test.ts`  
Expected: PASS.

---

### Task 2: Dominio — labels previstos, finanzas y alojamiento

**Files:**
- Create: `src/core/congress/expected-days.ts`
- Create: `src/core/congress/finance-status.ts`
- Create: `src/core/congress/lodging-status.ts`
- Create: `tests/baseline/congress-reception-labels.test.ts`

**Interfaces:**
- Produces:
  - `labelExpectedDays(days) → "saturday" | "sunday" | "both" | "unconfirmed"` (+ helper de texto ES)
  - `deriveContributionStatus(reg) → "no_charge" | "needs_verification" | "pending" | "partial" | "paid"`
  - `resolveLodgingUiState({ lodgingNeed, assignment }) → { status, pendingReason? }`
  - `isLodgingPending(state) → boolean`
  - `assertLodgingNeedAllowed({ lodgingNeed, hasActiveAssignment }) → ok | error`

- [ ] **Step 1: Tests**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { labelExpectedDays } from "../../src/core/congress/expected-days";
import { deriveContributionStatus } from "../../src/core/congress/finance-status";
import {
  resolveLodgingUiState,
  isLodgingPending,
  assertLodgingNeedAllowed,
} from "../../src/core/congress/lodging-status";
import { CONGRESS_CONTRIBUTION_CLP } from "../../src/core/congress/constants";

describe("expected days", () => {
  it("clasifica sábado, domingo, ambos y por confirmar", () => {
    assert.equal(labelExpectedDays({ saturday: true, sunday: false }), "saturday");
    assert.equal(labelExpectedDays({ saturday: false, sunday: true }), "sunday");
    assert.equal(labelExpectedDays({ saturday: true, sunday: true }), "both");
    assert.equal(labelExpectedDays({ saturday: null, sunday: null }), "unconfirmed");
    assert.equal(labelExpectedDays({ saturday: false, sunday: false }), "unconfirmed");
  });
});

describe("finance status", () => {
  it("no marca Pagado si saldo 0 pero needsReview", () => {
    assert.equal(
      deriveContributionStatus({
        chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
        allocatedPaidClp: CONGRESS_CONTRIBUTION_CLP,
        needsReview: true,
      }),
      "needs_verification"
    );
    assert.equal(
      deriveContributionStatus({
        chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
        allocatedPaidClp: CONGRESS_CONTRIBUTION_CLP,
        needsReview: false,
      }),
      "paid"
    );
    assert.equal(
      deriveContributionStatus({
        chargeAmountClp: null,
        allocatedPaidClp: 0,
        needsReview: false,
      }),
      "no_charge"
    );
  });
});

describe("lodging ui status", () => {
  it("separa unknown, sin asignar, asignado y confirmado", () => {
    assert.equal(resolveLodgingUiState({ lodgingNeed: "unknown", assignment: null }).status, "unknown");
    assert.equal(resolveLodgingUiState({ lodgingNeed: "none", assignment: null }).status, "none");
    assert.equal(resolveLodgingUiState({ lodgingNeed: "requested", assignment: null }).status, "unassigned");
    assert.equal(
      resolveLodgingUiState({
        lodgingNeed: "requested",
        assignment: { status: "assigned", confirmed: false },
      }).status,
      "assigned"
    );
    assert.equal(
      resolveLodgingUiState({
        lodgingNeed: "requested",
        assignment: { status: "confirmed", confirmed: true },
      }).status,
      "confirmed"
    );
  });

  it("filtro pendiente distingue motivos y rechaza none con asignación", () => {
    const u = resolveLodgingUiState({ lodgingNeed: "unknown", assignment: null });
    assert.equal(isLodgingPending(u), true);
    assert.equal(u.pendingReason, "unknown");
    const a = resolveLodgingUiState({
      lodgingNeed: "requested",
      assignment: { status: "assigned", confirmed: false },
    });
    assert.equal(isLodgingPending(a), true);
    assert.equal(a.pendingReason, "unconfirmed");
    assert.equal(
      assertLodgingNeedAllowed({ lodgingNeed: "none", hasActiveAssignment: true }).ok,
      false
    );
  });
});
```

- [ ] **Step 2: Run FAIL** — `npx tsx --test tests/baseline/congress-reception-labels.test.ts`

- [ ] **Step 3: Implementar los tres módulos** según tablas de la spec (finanzas: `needsReview` gana sobre saldo 0; pending filter = unknown|unassigned|unconfirmed).

- [ ] **Step 4: Run PASS** — mismo comando.

---

### Task 3: Repository, door y APIs

**Files:**
- Modify: `src/lib/congress/repository.ts` (`buildRegistrationDraft`, normalización al leer si hace falta, `buildCongressSummary` KPIs por día con `expectedDays`)
- Modify: `src/lib/congress/door.ts`
- Modify: `src/app/api/congress/registrations/door/route.ts`
- Modify: `src/app/api/congress/registrations/[id]/attendance/route.ts`
- Modify: `src/lib/congress/lodging.ts` y/o `src/app/api/congress/lodging/assignments/route.ts` (+ patch cancel/confirm) para invariantes
- Modify: `tests/baseline/congress-access.test.ts` o critical-flows solo si hay regresión de contrato

**Interfaces:**
- Consumes: `applyAttendanceChange`, `assertLodgingNeedAllowed`
- Door input: `+ expectedDays?, lodgingNeed?` (default `unknown`)
- Attendance PATCH body: `+ reason?: string`; usa `now` servidor

- [ ] **Step 1: `buildRegistrationDraft`**

Defaults:

```ts
expectedDays: input.expectedDays ?? { saturday: null, sunday: null },
lodgingNeed: input.lodgingNeed ?? "unknown",
attendanceMeta: {},
attendanceHistory: [],
```

- [ ] **Step 2: `enrollAtDoor` + route**

Pasar `expectedDays` / `lodgingNeed` desde body; default `unknown`; seguir rechazando duplicados en servidor.

- [ ] **Step 3: attendance route**

```ts
const nowIso = new Date().toISOString();
const result = applyAttendanceChange({
  attendance: current.attendance,
  attendanceMeta: current.attendanceMeta ?? {},
  attendanceHistory: current.attendanceHistory ?? [],
  day: day as CongressAttendanceDay,
  present,
  reason: typeof body?.reason === "string" ? body.reason : undefined,
  nowIso,
  actorUserId: ctx.user._id,
});
if (!result.ok) {
  return NextResponse.json({ ok: false, error: "Se requiere motivo." }, { status: 400 });
}
// updateCongressRegistration con attendance + attendanceMeta + attendanceHistory
```

- [ ] **Step 4: lodging assign / set need**

Antes de setear `lodgingNeed: "none"`, si hay assignment activa → 400.  
Al asignar, si need era `none` → 400; si `unknown` → forzar `requested`.

- [ ] **Step 5: Summary**

En `buildCongressSummary`, para cada día: `expected` / `present` / `pendingArrival` sobre **todas** las registrations del evento (ya es el caso del summary; asegurar que use `expectedDays` y no filtros de listado). Exponer en JSON para la cabecera de Recepción.

- [ ] **Step 6: Tests dominio + smoke API mental**

Run: `npx tsx --test tests/baseline/congress-domain.test.ts tests/baseline/congress-reception-labels.test.ts tests/baseline/congress-critical-flows.test.ts`  
Expected: PASS.

---

### Task 4: Navegación unificada

**Files:**
- Modify: `src/lib/admin/nav-access.ts`
- Modify: `src/lib/admin/nav-domains.ts`
- Modify: `src/app/admin/portal/congreso-varones/page.tsx`
- Modify: `src/app/admin/portal/forms/panel/[id]/page.tsx`
- Modify: `src/components/admin/forms/FormsPanelClient.tsx` (link “Abrir panel” → home)

- [ ] **Step 1: Invertir home/legacy**

```ts
export const CONGRESS_VARONES_HOME_PATH = "/admin/portal/congreso-varones";
export const CONGRESS_VARONES_FORMS_ALIAS_PATH = `/admin/portal/forms/panel/${CONGRESS_VARONES_FORM_ID}`;
```

Actualizar `isCongressAllowedAdminPath` / `isCongressAllowedItem` para ambas rutas.  
Nav item `href: CONGRESS_VARONES_HOME_PATH`.

- [ ] **Step 2: Page home**

`congreso-varones/page.tsx`: auth + permisos `congress.view|operate` → `<CongressOpsPanel />` (mismo patrón que forms panel hoy).  
Forms panel congress: `redirect(CONGRESS_VARONES_HOME_PATH)` **o** renderizar el mismo panel (preferir redirect para una sola URL canónica).

- [ ] **Step 3: Verificar tipos/nav**

Run: `npx tsx --test tests/baseline/congress-access.test.ts` (ajustar asserts de path si el test fija la URL antigua).

---

### Task 5: UI Recepción + labels helpers

**Files:**
- Create: `src/components/admin/congress/labels.ts` (wrappers ES sobre core)
- Create: `src/components/admin/congress/reception/ReceptionFilters.tsx`
- Create: `src/components/admin/congress/reception/ReceptionTable.tsx`
- Create: `src/components/admin/congress/reception/ReceptionView.tsx`
- Modify: `src/components/admin/congress/CongressOpsPanel.tsx` (shell + tabs; quitar inscritos/asistencia permanentes)

- [ ] **Step 1: `labels.ts`**

`formatZoneLabel("zona-7") → "Zona 7"`; textos ES para finanzas, alojamiento (con motivo), asistencia + `formatMarkedAtSantiago(iso)`.

- [ ] **Step 2: `ReceptionView`**

Estado local: `journeyDay: "saturday"|"sunday"`, search debounce, zone/church, quickFilter.  
KPIs desde `summary` (prop/callback), **no** desde `registrations` filtradas.  
Mostrar “N resultados” del array filtrado + Limpiar.  
CTA Nuevo participante; sin formulario inline.

- [ ] **Step 3: Tabla**

Columnas de la spec; acción “Registrar llegada (Sábado|Domingo)” → PATCH `present:true` sin reason; si ya presente, mostrar hora y no botón.  
Click fila → abrir ficha.  
Móvil: lista compacta (nombre + estados + ficha).

- [ ] **Step 4: Shell**

Tabs: recepcion (default) | resumen | aportes | alojamiento | reportes | historial | importacion.  
Header: “Congreso de Varones 2026” / “Quilicura · 21 y 22 de noviembre”.  
Quitar breadcrumbs/copy “Formularios → Operación”.

- [ ] **Step 5: Smoke manual local** — abrir `/admin/portal/congreso-varones` con `npm run dev`.

---

### Task 6: Ficha lateral + modal alta + pago individual

**Files:**
- Create: `src/components/admin/congress/participant/ParticipantSheet.tsx`
- Create: `src/components/admin/congress/participant/NewParticipantDialog.tsx`
- Modify: recepción / aportes UI para preview grupal (extraer de monolito lo necesario)

- [ ] **Step 1: `NewParticipantDialog`**

Dialog kit; match búsqueda previa; campos spec; default lodging `unknown`; submit door; onSuccess → open sheet + keep filters. Disable button while saving (complemento).

- [ ] **Step 2: `ParticipantSheet`**

Drawer: Asistencia (previstos + marcas + historial; corrección pide motivo) · Alimentación (estado + **pago individual** form → `POST /payments` 1 allocation) · Alojamiento (need + assign/confirm/cancel/reassign; mostrar error si servidor rechaza `none`+assignment).

- [ ] **Step 3: Aportes grupales**

Conservar en tab: iglesia → multi participantes → monto → preview distribución → guardar. Pagador ≠ lista cubierta. Refrescar summary/regs tras éxito.

- [ ] **Step 4: Doble clic / errores**

Todas las mutaciones: `saving` flags + mensajes toast; servidor sigue siendo la guarda (duplicate door 409, attendance reason 400, lodging invariant 400, payment allocate errors).

---

### Task 7: Verificación navegador y capturas

**Files:** ninguno de producto (solo evidencia en respuesta al usuario)

- [ ] **Step 1: Como admin** — navegación, KPIs globales vs filtro, búsqueda debounce, alta, llegada×2 (misma hora), corrección con motivo, pago ficha, pago grupal, alojamiento estados, reload.

- [ ] **Step 2: Como `congress_operator`** — shell limitado; mismos flujos críticos de recepción.

- [ ] **Step 3: Capturas** de pantallas realmente verificadas (Recepción, ficha, error motivo, alojamiento pendiente con motivo, aportes preview).

- [ ] **Step 4: Suite tests**

Run: `npx tsx --test tests/baseline/congress-domain.test.ts tests/baseline/congress-reception-labels.test.ts tests/baseline/congress-critical-flows.test.ts tests/baseline/congress-access.test.ts`  
Expected: PASS.

---

## Self-review (plan vs spec)

| Spec | Task |
|------|------|
| Nav home + alias forms | 4 |
| Recepción / filtros / tabla / móvil | 5 |
| KPIs globales vs N resultados | 3 (summary) + 5 (UI) |
| Previstos sábado/domingo/ambos/por confirmar | 2 + 5/6 |
| Primera hora + motivo + historial + Santiago | 1 + 3 + 6 |
| Finanzas derivadas sin auto-Pagado | 2 + 5/6 |
| Alojamiento 5 estados + pendientes con motivo + invariantes | 2 + 3 + 6 |
| Pago individual ficha + grupal Aportes | 6 |
| Idempotencia servidor | 1 + 3 + 6 |
| Sin import commit / deploy / git | Global Constraints |
| Verificación + capturas | 7 |
