# Congreso Varones — Exento de pago + drill-down caja → aportes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir al operador marcar participantes como exentos de aporte (sin quedar por cobrar) y, desde Cierre operativo, abrir Pago grupal con zona, iglesia y deudores precargados.

**Architecture:** Dominio puro `applyChargeChange` + `chargeHistory` en la inscripción; API `PATCH .../charge` con `congress.operate`; UI en ficha (Alimentación). Ampliar `isGroupPaymentSelectable` a saldo > 0. `CashBoxView` emite `onOpenGroupPayment({ zoneId, churchBaseKey })`; el panel cambia a tab `aportes` y setea zona/iglesia/selección.

**Tech Stack:** TypeScript, Next.js App Router, MongoDB via repos actuales, admin kit, `npx tsx --test`.

**Spec:** `docs/superpowers/specs/2026-11-17-congreso-varones-recepcion-design.md` (enmiendas 2026-11-18)

## Global Constraints

- Sin importación definitiva Excel, sin despliegue, **sin commit/PR de git** (acuerdo vigente: omitir pasos `git commit` / `git push`).
- No modificar el formulario público `ipn-asistencia-congreso-varones-2026`.
- Reutilizar permisos `congress.*`; no inventar motor financiero nuevo.
- Exento = `chargeAmountClp = null` + `chargeHistory`; etiqueta UI “Exento” vs “Sin cargo”.
- Bloquear exención si `allocatedPaidClp > 0`; restaurar solo con historial `exempt` previo.
- Drill-down: siempre navegar; precargar deudores con `isGroupPaymentSelectable`; no precargar pagador/tipo/fecha.
- Clave iglesia en aportes = `foldCongressChurchBase(...)` (no el `churchName` crudo de la fila de caja).
- Idempotencia/duplicados en servidor; UI solo complementa.

## File map

| Path | Responsibility |
|------|----------------|
| `src/core/congress/types.ts` | `chargeHistory` + tipo de entrada |
| `src/core/congress/charge.ts` | `applyChargeChange` (exempt / restore) |
| `src/core/congress/finance-status.ts` | `isGroupPaymentSelectable` por saldo; helper etiqueta Exento |
| `src/lib/congress/repository.ts` | default `chargeHistory: []` en draft |
| `src/app/api/congress/registrations/[id]/charge/route.ts` | PATCH exempt/restore |
| `src/components/admin/congress/labels.ts` | “Exento” vs “Sin cargo” |
| `src/components/admin/congress/participant/ParticipantSheet.tsx` | acciones + historial cargo |
| `src/components/admin/congress/cash/CashBoxView.tsx` | clic iglesia → callback |
| `src/components/admin/congress/CongressOpsPanel.tsx` | handler drill-down + wiring ficha |
| `tests/baseline/congress-reception-labels.test.ts` | selectable + labels |
| `tests/baseline/congress-domain.test.ts` o `congress-charge.test.ts` | dominio cargo |

---

### Task 1: Dominio — `applyChargeChange` + tipos

**Files:**
- Modify: `src/core/congress/types.ts`
- Create: `src/core/congress/charge.ts`
- Modify: `tests/baseline/congress-domain.test.ts` (o Create: `tests/baseline/congress-charge.test.ts`)

**Interfaces:**
- Produces:
  - `CongressChargeHistoryEntry`
  - `applyChargeChange(input): { ok: true; chargeAmountClp; chargeHistory; idempotent?: boolean } | { ok: false; error: "reason_required" | "has_allocations" | "not_exempt" | "already_charged" }`

- [ ] **Step 1: Extender tipos**

En `types.ts`, junto a `CongressAttendanceHistoryEntry`:

```ts
export type CongressChargeHistoryAction = "exempt" | "restore";

export interface CongressChargeHistoryEntry {
  action: CongressChargeHistoryAction;
  previousChargeAmountClp: number | null;
  nextChargeAmountClp: number | null;
  reason: string;
  at: string;
  actorUserId: string;
}
```

En `CongressRegistration` añadir:

```ts
chargeHistory?: CongressChargeHistoryEntry[];
```

- [ ] **Step 2: Test fallido**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyChargeChange } from "../../src/core/congress/charge";
import { CONGRESS_CONTRIBUTION_CLP } from "../../src/core/congress/constants";

describe("applyChargeChange", () => {
  it("exenta con motivo y bloquea si hay imputado", () => {
    const blocked = applyChargeChange({
      chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
      allocatedPaidClp: 1000,
      chargeHistory: [],
      action: "exempt",
      reason: "Invitado",
      nowIso: "2026-11-21T12:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(blocked.ok, false);
    if (blocked.ok) return;
    assert.equal(blocked.error, "has_allocations");

    const ok = applyChargeChange({
      chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
      allocatedPaidClp: 0,
      chargeHistory: [],
      action: "exempt",
      reason: "Invitado",
      nowIso: "2026-11-21T12:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(ok.ok, true);
    if (!ok.ok) return;
    assert.equal(ok.chargeAmountClp, null);
    assert.equal(ok.chargeHistory.length, 1);
    assert.equal(ok.chargeHistory[0]?.action, "exempt");
  });

  it("idempotente si ya sin cargo; restore exige historial exempt", () => {
    const again = applyChargeChange({
      chargeAmountClp: null,
      allocatedPaidClp: 0,
      chargeHistory: [
        {
          action: "exempt",
          previousChargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
          nextChargeAmountClp: null,
          reason: "Invitado",
          at: "2026-11-21T12:00:00.000Z",
          actorUserId: "u1",
        },
      ],
      action: "exempt",
      reason: "otra",
      nowIso: "2026-11-21T13:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(again.ok, true);
    if (!again.ok) return;
    assert.equal(again.idempotent, true);
    assert.equal(again.chargeHistory.length, 1);

    const noHistory = applyChargeChange({
      chargeAmountClp: null,
      allocatedPaidClp: 0,
      chargeHistory: [],
      action: "restore",
      reason: "Error",
      nowIso: "2026-11-21T14:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(noHistory.ok, false);
    if (noHistory.ok) return;
    assert.equal(noHistory.error, "not_exempt");

    const restored = applyChargeChange({
      chargeAmountClp: null,
      allocatedPaidClp: 0,
      chargeHistory: again.chargeHistory,
      action: "restore",
      reason: "Debía pagar",
      nowIso: "2026-11-21T14:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(restored.ok, true);
    if (!restored.ok) return;
    assert.equal(restored.chargeAmountClp, CONGRESS_CONTRIBUTION_CLP);
    assert.equal(restored.chargeHistory.at(-1)?.action, "restore");
  });

  it("exige motivo no vacío", () => {
    const r = applyChargeChange({
      chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
      allocatedPaidClp: 0,
      chargeHistory: [],
      action: "exempt",
      reason: "  ",
      nowIso: "2026-11-21T12:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(r.ok, false);
    if (r.ok) return;
    assert.equal(r.error, "reason_required");
  });
});
```

- [ ] **Step 3: Correr test (FAIL)**

Run: `npx tsx --test tests/baseline/congress-domain.test.ts`  
(o el archivo nuevo `congress-charge.test.ts`)  
Expected: FAIL — módulo/`applyChargeChange` ausente.

- [ ] **Step 4: Implementar `charge.ts`**

```ts
import { CONGRESS_CONTRIBUTION_CLP } from "@/core/congress/constants";
import type { CongressChargeHistoryEntry } from "@/core/congress/types";

export type ApplyChargeChangeInput = {
  chargeAmountClp: number | null;
  allocatedPaidClp: number;
  chargeHistory: CongressChargeHistoryEntry[];
  action: "exempt" | "restore";
  reason?: string;
  nowIso: string;
  actorUserId: string;
};

export type ApplyChargeChangeResult =
  | {
      ok: true;
      chargeAmountClp: number | null;
      chargeHistory: CongressChargeHistoryEntry[];
      idempotent?: boolean;
    }
  | {
      ok: false;
      error: "reason_required" | "has_allocations" | "not_exempt" | "already_charged";
    };

export function applyChargeChange(input: ApplyChargeChangeInput): ApplyChargeChangeResult {
  const reason = String(input.reason ?? "").trim();
  if (!reason) return { ok: false, error: "reason_required" };

  const history = [...(input.chargeHistory ?? [])];
  const hasExempt = history.some((h) => h.action === "exempt");

  if (input.action === "exempt") {
    if (Math.max(0, Math.trunc(input.allocatedPaidClp)) > 0) {
      return { ok: false, error: "has_allocations" };
    }
    if (input.chargeAmountClp == null) {
      return {
        ok: true,
        chargeAmountClp: null,
        chargeHistory: history,
        idempotent: true,
      };
    }
    const entry: CongressChargeHistoryEntry = {
      action: "exempt",
      previousChargeAmountClp: input.chargeAmountClp,
      nextChargeAmountClp: null,
      reason,
      at: input.nowIso,
      actorUserId: input.actorUserId,
    };
    return {
      ok: true,
      chargeAmountClp: null,
      chargeHistory: [...history, entry],
    };
  }

  // restore
  if (input.chargeAmountClp != null) {
    return { ok: false, error: "already_charged" };
  }
  if (!hasExempt) {
    return { ok: false, error: "not_exempt" };
  }
  const entry: CongressChargeHistoryEntry = {
    action: "restore",
    previousChargeAmountClp: null,
    nextChargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
    reason,
    at: input.nowIso,
    actorUserId: input.actorUserId,
  };
  return {
    ok: true,
    chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
    chargeHistory: [...history, entry],
  };
}

export function isExplicitlyExempt(reg: {
  chargeAmountClp: number | null;
  chargeHistory?: CongressChargeHistoryEntry[] | null;
}): boolean {
  return (
    reg.chargeAmountClp == null &&
    (reg.chargeHistory ?? []).some((h) => h.action === "exempt")
  );
}
```

- [ ] **Step 5: Correr test (PASS)**

Run: mismo comando del Step 3.  
Expected: PASS.

- [ ] **Step 6: Default en draft**

En `buildRegistrationDraft` (`repository.ts`), añadir `chargeHistory: []` junto a `attendanceHistory`.

- [ ] **Step 7: Omitir git commit** (acuerdo vigente).

---

### Task 2: Finanzas UI — seleccionables + etiqueta Exento

**Files:**
- Modify: `src/core/congress/finance-status.ts`
- Modify: `src/components/admin/congress/labels.ts`
- Modify: `tests/baseline/congress-reception-labels.test.ts`

**Interfaces:**
- Consumes: `isExplicitlyExempt` (o lógica equivalente en labels)
- Produces: `isGroupPaymentSelectable` → `remainingBalanceClp(reg) > 0`
- Produces: `contributionStatusLabel` / `contributionLabel` → “Exento” cuando aplique

- [ ] **Step 1: Actualizar test de seleccionables**

Reemplazar el caso actual “solo pending…” por:

```ts
describe("group payment selectable", () => {
  const base = {
    chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
    needsReview: false,
  };

  it("seleccionable si tiene saldo de cargo (pending, partial, verification con deuda)", () => {
    assert.equal(
      isGroupPaymentSelectable({ ...base, allocatedPaidClp: 0 }),
      true
    );
    assert.equal(
      isGroupPaymentSelectable({ ...base, allocatedPaidClp: 5000 }),
      true
    );
    assert.equal(
      isGroupPaymentSelectable({
        chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
        allocatedPaidClp: 0,
        needsReview: true,
      }),
      true
    );
    assert.equal(
      isGroupPaymentSelectable({
        ...base,
        allocatedPaidClp: CONGRESS_CONTRIBUTION_CLP,
      }),
      false
    );
    assert.equal(
      isGroupPaymentSelectable({
        chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
        allocatedPaidClp: CONGRESS_CONTRIBUTION_CLP,
        needsReview: true,
      }),
      false
    );
    assert.equal(
      isGroupPaymentSelectable({
        chargeAmountClp: null,
        allocatedPaidClp: 0,
        needsReview: false,
      }),
      false
    );
  });
});
```

Añadir test de etiqueta (si el helper vive en core o se prueba vía labels exportado):

```ts
import { isExplicitlyExempt } from "../../src/core/congress/charge";

it("distingue exento explícito de sin cargo", () => {
  assert.equal(
    isExplicitlyExempt({ chargeAmountClp: null, chargeHistory: [] }),
    false
  );
  assert.equal(
    isExplicitlyExempt({
      chargeAmountClp: null,
      chargeHistory: [
        {
          action: "exempt",
          previousChargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
          nextChargeAmountClp: null,
          reason: "Staff",
          at: "2026-11-21T12:00:00.000Z",
          actorUserId: "u1",
        },
      ],
    }),
    true
  );
});
```

- [ ] **Step 2: Run FAIL** — `npx tsx --test tests/baseline/congress-reception-labels.test.ts`  
Expected: FAIL en partial/verification seleccionable y/o `isExplicitlyExempt`.

- [ ] **Step 3: Implementar**

En `finance-status.ts`:

```ts
export function isGroupPaymentSelectable(
  reg: Pick<CongressRegistration, "chargeAmountClp" | "allocatedPaidClp" | "needsReview">
): boolean {
  return remainingBalanceClp(reg) > 0;
}
```

En `labels.ts`, `contributionStatusLabel` / `contributionLabel`: si status `no_charge` y `isExplicitlyExempt(reg)` → `"Exento"`; si no → `"Sin cargo"`. Ajustar firma para aceptar `chargeHistory` opcional.

- [ ] **Step 4: Run PASS** — mismo comando.

- [ ] **Step 5: Omitir git commit.**

---

### Task 3: API `PATCH .../charge`

**Files:**
- Create: `src/app/api/congress/registrations/[id]/charge/route.ts`

**Interfaces:**
- Consumes: `applyChargeChange`, `requireCongressOperate`, `getCongressRegistration`, `updateCongressRegistration`, `appendCongressAudit`
- Body: `{ action: "exempt" | "restore"; reason: string }`
- Responses: 200 + registration; 400 motivo/imputado/not_exempt/already_charged; 404; 409 versión

- [ ] **Step 1: Implementar route** (espejo de `attendance/route.ts`)

```ts
import { NextResponse } from "next/server";
import { requireCongressOperate } from "@/app/api/congress/guard";
import { applyChargeChange } from "@/core/congress/charge";
import {
  appendCongressAudit,
  getCongressRegistration,
  updateCongressRegistration,
} from "@/lib/congress/repository";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireCongressOperate();
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      action?: string;
      reason?: string;
    } | null;

    if (body?.action !== "exempt" && body?.action !== "restore") {
      return NextResponse.json({ ok: false, error: "Acción inválida." }, { status: 400 });
    }

    const current = await getCongressRegistration(ctx.tenantId, id);
    if (!current) {
      return NextResponse.json({ ok: false, error: "Inscripción no encontrada." }, { status: 404 });
    }

    const result = applyChargeChange({
      chargeAmountClp: current.chargeAmountClp,
      allocatedPaidClp: current.allocatedPaidClp,
      chargeHistory: current.chargeHistory ?? [],
      action: body.action,
      reason: body.reason,
      nowIso: new Date().toISOString(),
      actorUserId: ctx.user._id,
    });

    if (!result.ok) {
      const messages: Record<typeof result.error, string> = {
        reason_required: "Se requiere motivo.",
        has_allocations: "Anule los pagos imputados antes de marcar exento.",
        not_exempt: "Solo se puede restaurar un aporte previamente exento.",
        already_charged: "La inscripción ya tiene cargo.",
      };
      return NextResponse.json({ ok: false, error: messages[result.error] }, { status: 400 });
    }

    if (result.idempotent) {
      return NextResponse.json({ ok: true, registration: current, idempotent: true });
    }

    const updated = await updateCongressRegistration(
      ctx.tenantId,
      id,
      {
        chargeAmountClp: result.chargeAmountClp,
        chargeHistory: result.chargeHistory,
      },
      current.version
    );
    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "Conflicto de versión; reintente." },
        { status: 409 }
      );
    }

    await appendCongressAudit({
      tenantId: ctx.tenantId,
      actorUserId: ctx.user._id,
      action: body.action === "exempt" ? "registration.charge.exempt" : "registration.charge.restore",
      entity: "congress_registration",
      entityId: id,
      metadata: { reason: String(body.reason ?? "").trim() },
    });

    return NextResponse.json({ ok: true, registration: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
```

Verificar que `updateCongressRegistration` acepte patch de `chargeAmountClp` / `chargeHistory` (si el patch es genérico `Partial`, ya sirve).

- [ ] **Step 2: Smoke mental** — exempt sin imputado → null; con imputado → 400; restore sin historial → 400.

- [ ] **Step 3: Omitir git commit.**

---

### Task 4: UI ficha — Marcar exento / Restaurar

**Files:**
- Modify: `src/components/admin/congress/participant/ParticipantSheet.tsx`
- Modify: `src/components/admin/congress/CongressOpsPanel.tsx` (callback `onChargeChange` si la sheet no llama fetch directo)

**Interfaces:**
- Props nuevas (ejemplo):  
  `onChargeChange: (input: { registrationId: string; action: "exempt" | "restore"; reason: string }) => Promise<void>`
- O fetch interno a `/api/congress/registrations/${id}/charge` + `onUpdated(registration)`

- [ ] **Step 1: En tab Alimentación**

- Si `operate` y `chargeAmountClp != null` y `allocatedPaidClp === 0`: botón **Marcar exento de pago** → prompt/input motivo obligatorio → PATCH.
- Si `isExplicitlyExempt(registration)`: mostrar **Exento**; botón **Restaurar aporte $17.000** → motivo → PATCH; ocultar formulario de pago.
- Si `allocatedPaidClp > 0`: no ofrecer exentar (texto tip opcional).
- Lista corta **Historial de cargo** (acción, motivo, `formatDateTimeSantiago`).

Patrón de motivo: reutilizar el mismo UX que corrección de asistencia (input + confirmar), sin inventar diálogo nuevo si ya hay uno.

- [ ] **Step 2: Wiring en panel**

Handler que haga `fetch` PATCH, toast de error/éxito, refresque `registrations` / abra sheet actualizada (mismo patrón que attendance/payment).

- [ ] **Step 3: Verificar labels en tabla recepción** — columna Alimentación muestra “Exento” tras refresh.

- [ ] **Step 4: Omitir git commit.**

---

### Task 5: Drill-down caja → pago grupal

**Files:**
- Modify: `src/components/admin/congress/cash/CashBoxView.tsx`
- Modify: `src/components/admin/congress/CongressOpsPanel.tsx`

**Interfaces:**
- Produces callback:  
  `onOpenGroupPayment: (input: { zoneId: string; churchBaseKey: string }) => void`
- Panel setea: `activeTab = "aportes"`, `groupZone`, `groupChurch`, `groupSelected` = ids seleccionables de esa zona+iglesia

- [ ] **Step 1: `CashBoxView` props**

```ts
onOpenGroupPayment?: (input: { zoneId: string; churchBaseKey: string }) => void;
```

En la lista de iglesias, convertir `<li>` en botón/clickable:

```tsx
import { foldCongressChurchBase } from "@/core/congress/church-name";

// dentro del map:
<button
  type="button"
  className={cn(
    "w-full px-3 py-2.5 text-left transition-colors",
    owes ? "bg-warning/10 hover:bg-warning/15" : "bg-white hover:bg-background-soft",
    onOpenGroupPayment ? "cursor-pointer" : "cursor-default"
  )}
  onClick={() => {
    if (!selectedZoneId || !onOpenGroupPayment) return;
    onOpenGroupPayment({
      zoneId: selectedZoneId,
      churchBaseKey: foldCongressChurchBase(row.key),
    });
  }}
>
  {/* mismo contenido: nombre, badge, AmountInline */}
</button>
```

Usar `foldCongressChurchBase(row.key)` porque `breakdownContributionsByChurch` agrupa por `churchName` crudo, mientras el select de Aportes usa base plegada.

- [ ] **Step 2: Handler en `CongressOpsPanel`**

```ts
const openGroupPaymentFromCash = (input: {
  zoneId: string;
  churchBaseKey: string;
}) => {
  setGroupZone(input.zoneId);
  setGroupChurch(input.churchBaseKey);
  const selected = registrations
    .filter(
      (r) =>
        r.zoneId === input.zoneId &&
        foldCongressChurchBase(r.churchName) === input.churchBaseKey &&
        isGroupPaymentSelectable(r)
    )
    .map((r) => r._id);
  setGroupSelected(selected);
  setActiveTab("aportes");
};
```

Pasar `onOpenGroupPayment={openGroupPaymentFromCash}` a `CashBoxView`.  
No tocar `groupPayer` / `groupMethod` / `groupPaidOn`.

- [ ] **Step 3: Smoke manual**

1. Caja → Zona 03 → clic BOLLENAR → tab Aportes con zona/iglesia y checks en deudores.
2. Iglesia al día → igual navega; selección puede quedar vacía.
3. Exentar a alguien en ficha → deja de aparecer en “Con saldo” y no es seleccionable en grupal.
4. Intentar exentar con imputado → error.

- [ ] **Step 4: Suite tests**

Run:

```bash
npx tsx --test tests/baseline/congress-domain.test.ts tests/baseline/congress-reception-labels.test.ts tests/baseline/congress-cash-box.test.ts
```

(Incluir `congress-charge.test.ts` si se creó aparte.)  
Expected: PASS.

- [ ] **Step 5: Omitir git commit.**

---

## Self-review (plan vs spec)

| Spec (enmienda) | Task |
|-----------------|------|
| `chargeHistory` + applyChargeChange | 1 |
| Exento etiqueta vs Sin cargo | 2 |
| Filtro Con saldo / no_charge | 2 (sin cambio de filtro; `contributionStatusHasBalance` ya excluye no_charge) |
| PATCH `/charge` + operate | 3 |
| UI ficha exento/restaurar + historial | 4 |
| Bloqueo si hay imputaciones | 1 + 3 + 4 |
| Restore solo con exempt previo | 1 + 3 |
| `isGroupPaymentSelectable` = saldo > 0 | 2 |
| Clic iglesia → aportes precargado | 5 |
| churchBaseKey via fold | 5 |
| Sin chip filtro nuevo / sin alta-exento | — (YAGNI, no hay task) |
| Sin git/deploy/import | Global Constraints |

## Execution handoff

Tras guardar este plan, elegir:

1. **Subagent-Driven (recomendado)** — un subagente por task + review entre tasks  
2. **Inline Execution** — ejecutar en esta sesión con checkpoints
