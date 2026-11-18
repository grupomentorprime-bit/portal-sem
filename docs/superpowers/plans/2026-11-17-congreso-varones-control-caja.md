# Congreso Varones — Control de caja Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separar Control de caja como pestaña propia con recaudación por medio, cierre esperado/cobrado, desgloses día/zona/iglesia y movimientos con anulación, sin mezclarlo con Aportes ni duplicar el detalle en Resumen.

**Architecture:** Extender el motor puro `cash-box.ts` (cliente) con agregados de cierre y desgloses; nueva `CashBoxView`; cablear pestaña `caja` en `CongressOpsPanel`; teaser en `SummaryView` que cambia de tab. Sin API nueva. Hacer `Tabs` controlable para el CTA del resumen.

**Tech Stack:** TypeScript, Next.js App Router, dominio puro + `npx tsx --test`, kit admin (`Section`/`Button`/`Select`/`Input`).

**Spec:** `docs/superpowers/specs/2026-11-17-congreso-varones-control-caja-design.md`

## Global Constraints

- Sin apertura/cierre de turno, arqueo, export Excel, API `/cash-box`, engordar `GET /summary` con estos agregados.
- Sin commit/PR de git ni despliegue (acuerdo vigente: omitir pasos `git commit` / `git push`).
- Totales “recaudado” solo `status === "posted"`.
- Estados de aporte solo vía `deriveContributionStatus` / `remainingBalanceClp` — no inventar estados.
- Pagos nuevos: individual en ficha, grupal en Aportes; Caja no crea pagos.
- Zona en UI: `formatZoneLabel` (“Zona 7”), nunca crudo `zona-7` en labels visibles.
- Reutilizar permisos `capabilities.payments` / `financeCorrect` y `POST /api/congress/payments/[id]/void`.

## File map

| Path | Responsibility |
|------|----------------|
| `src/core/congress/cash-box.ts` | `summarizeCashBox` + cierre + desgloses puros |
| `tests/baseline/congress-cash-box.test.ts` | Tests dominio caja/cierre/desgloses |
| `src/components/ui/tabs.tsx` | Soporte `value` controlado (CTA Resumen → Caja) |
| `src/components/admin/congress/cash/CashBoxView.tsx` | UI Control de caja |
| `src/components/admin/congress/summary/SummaryView.tsx` | Teaser finanzas + `onOpenCashBox` |
| `src/components/admin/congress/CongressOpsPanel.tsx` | Tab `caja`, sacar Caja de Aportes, wire |

---

### Task 1: Dominio — cierre de aportes

**Files:**
- Modify: `src/core/congress/cash-box.ts`
- Modify: `tests/baseline/congress-cash-box.test.ts`

**Interfaces:**
- Consumes: `deriveContributionStatus`, `remainingBalanceClp`, `CongressRegistration`
- Produces:
  ```ts
  export type ContributionCloseSummary = {
    expectedClp: number;
    collectedClp: number;
    remainingClp: number;
    countsByStatus: Record<
      "no_charge" | "needs_verification" | "pending" | "partial" | "paid",
      number
    >;
  };

  export function summarizeContributionClose(
    registrations: Array<
      Pick<
        CongressRegistration,
        "chargeAmountClp" | "allocatedPaidClp" | "needsReview"
      >
    >
  ): ContributionCloseSummary;
  ```

- [ ] **Step 1: Escribir test fallido**

En `congress-cash-box.test.ts`, añadir:

```ts
import { summarizeContributionClose } from "../../src/core/congress/cash-box";

describe("contribution close", () => {
  it("suma esperado/cobrado/saldo y cuenta estados", () => {
    const result = summarizeContributionClose([
      baseReg({ _id: "1", chargeAmountClp: 17_000, allocatedPaidClp: 0 }),
      baseReg({ _id: "2", chargeAmountClp: 17_000, allocatedPaidClp: 5_000 }),
      baseReg({
        _id: "3",
        chargeAmountClp: 17_000,
        allocatedPaidClp: 17_000,
        needsReview: false,
      }),
      baseReg({
        _id: "4",
        chargeAmountClp: 17_000,
        allocatedPaidClp: 17_000,
        needsReview: true,
      }),
      baseReg({ _id: "5", chargeAmountClp: null, allocatedPaidClp: 0 }),
    ]);
    assert.equal(result.expectedClp, 68_000);
    assert.equal(result.collectedClp, 39_000);
    assert.equal(result.remainingClp, 29_000); // 17000 + 12000 + 0 + 0
    assert.equal(result.countsByStatus.pending, 1);
    assert.equal(result.countsByStatus.partial, 1);
    assert.equal(result.countsByStatus.paid, 1);
    assert.equal(result.countsByStatus.needs_verification, 1);
    assert.equal(result.countsByStatus.no_charge, 1);
  });
});
```

- [ ] **Step 2: Correr test y verificar fallo**

Run: `npx tsx --test tests/baseline/congress-cash-box.test.ts`  
Expected: FAIL — `summarizeContributionClose` no exportado / undefined

- [ ] **Step 3: Implementación mínima**

En `cash-box.ts`:

```ts
import { remainingBalanceClp } from "@/core/congress/charges";
import { deriveContributionStatus } from "@/core/congress/finance-status";
import type { CongressRegistration } from "@/core/congress/types";
import type { ContributionStatus } from "@/core/congress/finance-status";

export type ContributionCloseSummary = {
  expectedClp: number;
  collectedClp: number;
  remainingClp: number;
  countsByStatus: Record<ContributionStatus, number>;
};

export function summarizeContributionClose(
  registrations: Array<
    Pick<CongressRegistration, "chargeAmountClp" | "allocatedPaidClp" | "needsReview">
  >
): ContributionCloseSummary {
  const countsByStatus: Record<ContributionStatus, number> = {
    no_charge: 0,
    needs_verification: 0,
    pending: 0,
    partial: 0,
    paid: 0,
  };
  let expectedClp = 0;
  let collectedClp = 0;
  let remainingClp = 0;
  for (const reg of registrations) {
    countsByStatus[deriveContributionStatus(reg)] += 1;
    if (reg.chargeAmountClp == null) continue;
    expectedClp += Math.trunc(reg.chargeAmountClp);
    collectedClp += Math.max(0, Math.trunc(reg.allocatedPaidClp));
    remainingClp += remainingBalanceClp(reg);
  }
  return { expectedClp, collectedClp, remainingClp, countsByStatus };
}
```

Mantener imports existentes de payments/dates; no romper `summarizeCashBox`.

- [ ] **Step 4: Correr tests**

Run: `npx tsx --test tests/baseline/congress-cash-box.test.ts`  
Expected: PASS (incluye tests previos de cash box)

- [ ] **Step 5: Commit**

Omitir (`acuerdo vigente: sin git commit`).

---

### Task 2: Dominio — desgloses día / zona / iglesia

**Files:**
- Modify: `src/core/congress/cash-box.ts`
- Modify: `tests/baseline/congress-cash-box.test.ts`

**Interfaces:**
- Consumes: `summarizeCashBox` / `effectivePaidOn` / `CashBoxFilters`, `summarizeContributionClose` patterns
- Produces:
  ```ts
  export type PaidOnBreakdownRow = {
    paidOn: string;
    totalClp: number;
    count: number;
  };

  export type ContributionGroupRow = {
    key: string;
    expectedClp: number;
    collectedClp: number;
    remainingClp: number;
    count: number;
  };

  export function breakdownPaymentsByPaidOn(
    payments: CongressPayment[],
    filters?: CashBoxFilters
  ): PaidOnBreakdownRow[];

  export function breakdownContributionsByZone(
    registrations: Array<
      Pick<
        CongressRegistration,
        "zoneId" | "chargeAmountClp" | "allocatedPaidClp" | "needsReview"
      >
    >
  ): ContributionGroupRow[];

  export function breakdownContributionsByChurch(
    registrations: Array<
      Pick<
        CongressRegistration,
        "churchName" | "chargeAmountClp" | "allocatedPaidClp" | "needsReview"
      >
    >
  ): ContributionGroupRow[];
  ```

- [ ] **Step 1: Tests fallidos**

```ts
import {
  breakdownPaymentsByPaidOn,
  breakdownContributionsByZone,
  breakdownContributionsByChurch,
} from "../../src/core/congress/cash-box";

describe("cash box breakdowns", () => {
  it("agrupa posted por paidOn ascendente e ignora voided en totales", () => {
    const rows = breakdownPaymentsByPaidOn(
      [
        pay({ _id: "a", method: "cash", paidOn: "2026-11-22", amountClp: 2_000 }),
        pay({ _id: "b", method: "cash", paidOn: "2026-11-21", amountClp: 5_000 }),
        pay({
          _id: "c",
          method: "cash",
          paidOn: "2026-11-21",
          amountClp: 9_000,
          status: "voided",
        }),
        pay({ _id: "d", method: "transfer", paidOn: "2026-11-21", amountClp: 3_000 }),
      ],
      { status: "all" }
    );
    assert.deepEqual(rows, [
      { paidOn: "2026-11-21", totalClp: 8_000, count: 2 },
      { paidOn: "2026-11-22", totalClp: 2_000, count: 1 },
    ]);
  });

  it("agrupa por zona (orden zoneId) y por iglesia (saldo desc)", () => {
    const regs = [
      baseReg({
        _id: "a",
        zoneId: "zona-2",
        churchName: "Beta",
        chargeAmountClp: 17_000,
        allocatedPaidClp: 0,
      }),
      baseReg({
        _id: "b",
        zoneId: "zona-1",
        churchName: "Alpha",
        chargeAmountClp: 17_000,
        allocatedPaidClp: 17_000,
      }),
      baseReg({
        _id: "c",
        zoneId: "zona-1",
        churchName: "Alpha",
        chargeAmountClp: 17_000,
        allocatedPaidClp: 5_000,
      }),
    ];
    const byZone = breakdownContributionsByZone(regs);
    assert.equal(byZone[0]?.key, "zona-1");
    assert.equal(byZone[0]?.expectedClp, 34_000);
    assert.equal(byZone[0]?.collectedClp, 22_000);
    assert.equal(byZone[0]?.remainingClp, 12_000);
    assert.equal(byZone[0]?.count, 2);
    assert.equal(byZone[1]?.key, "zona-2");

    const byChurch = breakdownContributionsByChurch(regs);
    assert.equal(byChurch[0]?.key, "Beta"); // saldo 17000 > Alpha 12000
    assert.equal(byChurch[0]?.remainingClp, 17_000);
    assert.equal(byChurch[1]?.key, "Alpha");
    assert.equal(byChurch[1]?.remainingClp, 12_000);
  });
});
```

- [ ] **Step 2: Correr y verificar fallo**

Run: `npx tsx --test tests/baseline/congress-cash-box.test.ts`  
Expected: FAIL — funciones no definidas

- [ ] **Step 3: Implementar**

```ts
export type PaidOnBreakdownRow = {
  paidOn: string;
  totalClp: number;
  count: number;
};

export type ContributionGroupRow = {
  key: string;
  expectedClp: number;
  collectedClp: number;
  remainingClp: number;
  count: number;
};

export function breakdownPaymentsByPaidOn(
  payments: CongressPayment[],
  filters: CashBoxFilters = {}
): PaidOnBreakdownRow[] {
  const { rows } = summarizeCashBox(payments, {
    ...filters,
    status: filters.status ?? "all",
  });
  const map = new Map<string, PaidOnBreakdownRow>();
  for (const p of rows) {
    if (p.status !== "posted") continue;
    const paidOn = effectivePaidOn(p);
    const cur = map.get(paidOn) ?? { paidOn, totalClp: 0, count: 0 };
    cur.totalClp += Math.trunc(p.amountClp);
    cur.count += 1;
    map.set(paidOn, cur);
  }
  return Array.from(map.values()).sort((a, b) => a.paidOn.localeCompare(b.paidOn));
}

function groupContributions(
  registrations: Array<
    Pick<
      CongressRegistration,
      "chargeAmountClp" | "allocatedPaidClp" | "needsReview"
    > & { key: string }
  >
): ContributionGroupRow[] {
  const map = new Map<string, ContributionGroupRow>();
  for (const reg of registrations) {
    const cur = map.get(reg.key) ?? {
      key: reg.key,
      expectedClp: 0,
      collectedClp: 0,
      remainingClp: 0,
      count: 0,
    };
    cur.count += 1;
    if (reg.chargeAmountClp != null) {
      cur.expectedClp += Math.trunc(reg.chargeAmountClp);
      cur.collectedClp += Math.max(0, Math.trunc(reg.allocatedPaidClp));
      cur.remainingClp += remainingBalanceClp(reg);
    }
    map.set(reg.key, cur);
  }
  return Array.from(map.values());
}

export function breakdownContributionsByZone(
  registrations: Array<
    Pick<
      CongressRegistration,
      "zoneId" | "chargeAmountClp" | "allocatedPaidClp" | "needsReview"
    >
  >
): ContributionGroupRow[] {
  return groupContributions(
    registrations.map((r) => ({ ...r, key: r.zoneId }))
  ).sort((a, b) => a.key.localeCompare(b.key));
}

export function breakdownContributionsByChurch(
  registrations: Array<
    Pick<
      CongressRegistration,
      "churchName" | "chargeAmountClp" | "allocatedPaidClp" | "needsReview"
    >
  >
): ContributionGroupRow[] {
  return groupContributions(
    registrations.map((r) => ({ ...r, key: r.churchName }))
  ).sort((a, b) => b.remainingClp - a.remainingClp || a.key.localeCompare(b.key));
}
```

Nota: para el test de día con `status: "all"`, `summarizeCashBox` incluye voided en `rows` pero el loop salta no-posted — correcto.

- [ ] **Step 4: Correr tests**

Run: `npx tsx --test tests/baseline/congress-cash-box.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

Omitir.

---

### Task 3: Tabs controladas

**Files:**
- Modify: `src/components/ui/tabs.tsx`

**Interfaces:**
- Produces: `Tabs` acepta `value?: string` además de `defaultValue`; si `value` está definido, esa es la pestaña activa (controlled).

- [ ] **Step 1: Extender `TabsProps` y el estado**

```tsx
interface TabsProps {
  defaultValue: string;
  value?: string;
  children: ReactNode;
  className?: string;
  onChange?: (value: string) => void;
}

export function Tabs({ defaultValue, value, children, className, onChange }: TabsProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const activeTab = value ?? uncontrolled;

  const handleChange = (id: string) => {
    if (value === undefined) setUncontrolled(id);
    onChange?.(id);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}
```

- [ ] **Step 2: Verificar TypeScript del archivo**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | head -n 40`  
(o el check de tipos que use el repo; si es lento, al menos que el archivo compile en el IDE)

Expected: sin errores nuevos en `tabs.tsx`

- [ ] **Step 3: Commit**

Omitir.

---

### Task 4: UI `CashBoxView`

**Files:**
- Create: `src/components/admin/congress/cash/CashBoxView.tsx`

**Interfaces:**
- Consumes: funciones de Tasks 1–2, `formatClp`, `formatZoneLabel`, `paymentMethodLabel`, `normalizePaymentMethod`, `effectivePaidOn`
- Produces:
  ```tsx
  export function CashBoxView(props: {
    payments: CongressPayment[];
    registrations: CongressRegistration[];
    loading?: boolean;
    error?: string | null;
    canVoid: boolean;
    voidReason: string;
    onVoidReasonChange: (value: string) => void;
    voidingId: string | null;
    onVoid: (paymentId: string) => void | Promise<void>;
    methodFilter: CashMethodKey | "all";
    onMethodFilterChange: (v: CashMethodKey | "all") => void;
    fromPaidOn: string;
    onFromPaidOnChange: (v: string) => void;
    toPaidOn: string;
    onToPaidOnChange: (v: string) => void;
    statusFilter: "posted" | "voided" | "all";
    onStatusFilterChange: (v: "posted" | "voided" | "all") => void;
  }): JSX.Element;
  ```

- [ ] **Step 1: Crear componente**

Estructura de secciones (usar `Section`, `Select`, `Input`, `Button`, `EmptyState`, `LoadingState`, `AlertBanner` del kit):

1. Si `loading` → `LoadingState`; si `error` → `AlertBanner`.
2. **Recaudado por medio** — grid con Efectivo / Transferencia / Otro / Sin clasificar / Total desde `summarizeCashBox(...).totalsClp`.
3. Filtros en grid (copiar opciones de la Caja actual en `CongressOpsPanel`).
4. **Cierre operativo** — `summarizeContributionClose(registrations)`: esperado, cobrado, saldo + conteos de estado (labels: Pendiente, Abono, Pagado, Pendiente de verificación, Sin cargo).
5. **Por día de pago** — tabla/lista de `breakdownPaymentsByPaidOn(payments, filters)`.
6. **Por zona** — `breakdownContributionsByZone` con label `formatZoneLabel(row.key)`.
7. **Por iglesia** — `breakdownContributionsByChurch`.
8. **Movimientos** — `cashBox.rows`; botón Anular si `canVoid && status===posted` (misma validación motivo ≥ 5 en el padre o aquí vía `onVoid`).

Filtros pasados a `summarizeCashBox` / `breakdownPaymentsByPaidOn`:

```ts
{
  method: methodFilter,
  fromPaidOn: fromPaidOn || undefined,
  toPaidOn: toPaidOn || undefined,
  status: statusFilter,
}
```

Cierre y desgloses zona/iglesia **no** usan filtros de movimientos (universo completo de `registrations`).

- [ ] **Step 2: Commit**

Omitir.

---

### Task 5: Cablear panel + teaser Resumen

**Files:**
- Modify: `src/components/admin/congress/CongressOpsPanel.tsx`
- Modify: `src/components/admin/congress/summary/SummaryView.tsx`

**Interfaces:**
- Consumes: `CashBoxView`, Tabs `value`
- Produces: tab `caja` funcional; Aportes sin sección Caja; Resumen con CTA

- [ ] **Step 1: `SummaryView` — teaser**

- Añadir prop `onOpenCashBox: () => void`.
- Reemplazar el `Section title="Alimentación y aportes"` (conteos largos + cargo esperado) por un bloque corto:
  - Cargo esperado: `formatClp(balances.totalChargeClp)`
  - Cobrado: `formatClp(balances.totalPaidClp)`
  - Saldo: `formatClp(balances.totalOutstandingClp)`
  - `Button` “Ver control de caja” → `onOpenCashBox()`
- Quitar el `useMemo` `finance` si ya no se usa.
- Mantener el panorama superior (Inscritos / Recaudado / Saldo / Por verificar) — el teaser es el bloque que era “Alimentación y aportes”.

- [ ] **Step 2: `CongressOpsPanel` — tab y extracción**

1. Extender `TabId` con `"caja"`.
2. Tabs controladas:

```tsx
<Tabs
  defaultValue="recepcion"
  value={activeTab}
  onChange={(value) => setActiveTab(value as TabId)}
  className="w-full"
>
```

3. Insertar `<TabsTrigger value="caja">Control de caja</TabsTrigger>` después de Aportes.
4. `useDeferredEffect`: también `if (activeTab === "caja") void loadPayments();`
5. En `TabsContent value="aportes"`: **borrar** todo el `<Section title="Caja" …>` (filtros, totales, listado, anulación). Dejar solo pago grupal.
6. Nuevo `TabsContent value="caja"`:

```tsx
<TabsContent value="caja">
  {!capabilities.payments ? (
    <AlertBanner variant="warning">
      No tienes permiso para ver pagos / caja.
    </AlertBanner>
  ) : (
    <CashBoxView
      payments={payments}
      registrations={registrations}
      canVoid={capabilities.financeCorrect}
      voidReason={voidReason}
      onVoidReasonChange={setVoidReason}
      voidingId={voidingId}
      onVoid={async (paymentId) => {
        if (voidReason.trim().length < 5) {
          push({ title: "Motivo mínimo 5 caracteres", tone: "warning" });
          return;
        }
        setVoidingId(paymentId);
        try {
          const res = await fetch(`/api/congress/payments/${paymentId}/void`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: voidReason.trim() }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) {
            push({ title: data.error ?? "No se pudo anular", tone: "warning" });
            return;
          }
          void loadPayments();
          void loadRegistrations();
          void loadSummary();
        } finally {
          setVoidingId(null);
        }
      }}
      methodFilter={cashMethodFilter}
      onMethodFilterChange={setCashMethodFilter}
      fromPaidOn={cashFrom}
      onFromPaidOnChange={setCashFrom}
      toPaidOn={cashTo}
      onToPaidOnChange={setCashTo}
      statusFilter={cashStatus}
      onStatusFilterChange={setCashStatus}
    />
  )}
</TabsContent>
```

7. Pasar a `SummaryView` `onOpenCashBox={() => setActiveTab("caja")}`.
8. Limpiar imports muertos en el panel (`summarizeCashBox` / labels de método si solo los usaba Caja — ahora viven en `CashBoxView`). Mantener estado de filtros de caja en el panel (controlados).

- [ ] **Step 3: Tests dominio + typecheck rápido**

Run: `npx tsx --test tests/baseline/congress-cash-box.test.ts`  
Expected: PASS

- [ ] **Step 4: Commit**

Omitir.

---

### Task 6: Verificación en navegador

**Files:** ninguna (manual)

- [ ] **Step 1: Abrir** `http://localhost:3000/admin/portal/congreso-varones` (dev server).

- [ ] **Step 2: Checklist**

1. Pestaña **Control de caja** visible entre Aportes y Alojamiento.
2. **Aportes** solo muestra pago grupal (sin listado/totales de caja).
3. **Resumen** → “Ver control de caja” cambia a la pestaña Caja.
4. Cabecera muestra recaudado Efectivo / Transferencia / Otro / Total coherente con pagos vigentes.
5. Cierre + desgloses día / zona / iglesia visibles.
6. Si hay permiso, anular un pago de prueba refresca totales (o documentar si no se pudo probar).

- [ ] **Step 3: Commit**

Omitir.

---

## Spec coverage (self-review)

| Spec | Task |
|------|------|
| Pestaña propia `caja` | 5 |
| Aportes solo grupal | 5 |
| Resumen teaser + CTA | 3 + 5 |
| Recaudado por medio | 4 (usa `summarizeCashBox`) |
| Cierre esperado/cobrado/saldo + conteos | 1 + 4 |
| Desglose día / zona / iglesia | 2 + 4 |
| Movimientos + anulación | 4 + 5 |
| Sin API nueva / sin sesión caja | constraints |
| Tests dominio | 1 + 2 |
| Verificación navegador | 6 |
