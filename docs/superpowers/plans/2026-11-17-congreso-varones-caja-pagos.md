# Congreso Varones — Caja y tipo de pago Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extender pagos del Congreso con tipo de medio (efectivo/transferencia/otro) y fecha de pago editable, y exponer en Aportes un control de caja filtrable con totales por tipo.

**Architecture:** Ampliar `CongressPayment` + `allocatePayment` con `method` y `paidOn`; helpers puros `normalizePaymentMethod` / `summarizeCashBox` / validación de fecha en `src/core/congress/`; cablear `recordCongressPayment` y `POST /api/congress/payments`; UI en ficha (individual) y pestaña Aportes (grupal + caja). Un método por movimiento; mixto iglesia = dos POSTs.

**Tech Stack:** TypeScript, Next.js App Router, MongoDB via repos actuales, admin kit (`Input`/`Select`/`Button`/`Section`), `npx tsx --test`.

**Spec:** `docs/superpowers/specs/2026-11-17-congreso-varones-caja-pagos-design.md`

## Global Constraints

- Sin cierre/arqueo, sin editar `method`/`paidOn` tras `posted`, sin multi-tender en un documento, sin endpoint Excel de caja.
- Sin formulario público, import commit Excel, despliegue; **sin commit/PR de git** salvo que el usuario lo pida explícitamente (omitir pasos `git commit` / `git push`).
- No inventar motor financiero nuevo; reutilizar `allocatePayment` / anulación / imputaciones.
- `method` obligatorio en altas nuevas; `receiptRef`/`note` opcionales.
- `paidOn` = `YYYY-MM-DD` en sentido `America/Santiago`; default hoy si se omite en API.
- Legacy sin `method` → `unclassified`; legacy sin `paidOn` → día de `createdAt` en Santiago solo para filtros (sin backfill DB).
- Anulados nunca suman en totales de caja.
- Mixto efectivo+transferencia solo operado como dos movimientos (sobre todo grupal).
- Estados de alimentación (`deriveContributionStatus`) no cambian por tipo de medio.

## File map

| Path | Responsibility |
|------|----------------|
| `src/core/congress/types.ts` | `CongressPaymentMethod`; campos `method?`, `paidOn?` en `CongressPayment` |
| `src/core/congress/payment-dates.ts` | `isValidPaidOn`, `todayPaidOnSantiago`, `effectivePaidOn` |
| `src/core/congress/cash-box.ts` | `normalizePaymentMethod`, `summarizeCashBox` |
| `src/core/congress/payments.ts` | Persistir `method`/`paidOn` en `allocatePayment`; error `invalid_method` / `invalid_paid_on` |
| `src/lib/congress/repository.ts` | Pasar `method`/`paidOn` a `allocatePayment` |
| `src/app/api/congress/payments/route.ts` | Validar y exigir `method`; default `paidOn` |
| `src/components/admin/congress/labels.ts` | Labels ES de método |
| `src/components/admin/congress/participant/ParticipantSheet.tsx` | Tipo + fecha en pago individual |
| `src/components/admin/congress/CongressOpsPanel.tsx` | Grupal + caja (filtros/totales/filas) |
| `src/components/admin/congress/payments/CashBoxPanel.tsx` | (opcional extract) UI caja; si el panel sigue monolítico, implementar inline en `CongressOpsPanel` y extraer solo si el archivo crece demasiado |
| `tests/baseline/congress-cash-box.test.ts` | Tests dominio fechas + caja + method en allocate |
| `tests/baseline/congress-domain.test.ts` / `congress-critical-flows.test.ts` | Ajustar llamadas `allocatePayment` con `method`/`paidOn` |

---

### Task 1: Dominio — fechas, method y caja

**Files:**
- Modify: `src/core/congress/types.ts`
- Create: `src/core/congress/payment-dates.ts`
- Create: `src/core/congress/cash-box.ts`
- Modify: `src/core/congress/payments.ts`
- Create: `tests/baseline/congress-cash-box.test.ts`
- Modify: `tests/baseline/congress-domain.test.ts` (añadir `method`/`paidOn` a fixtures de `allocatePayment`)
- Modify: `tests/baseline/congress-critical-flows.test.ts` (igual)

**Interfaces:**
- Produces:
  - `export type CongressPaymentMethod = "cash" | "transfer" | "other"`
  - `export type CashMethodKey = CongressPaymentMethod | "unclassified"`
  - `isValidPaidOn(value: string): boolean` — true solo si `/^\d{4}-\d{2}-\d{2}$/` y día calendario real
  - `todayPaidOnSantiago(now?: Date): string`
  - `effectivePaidOn(payment: Pick<CongressPayment, "paidOn" | "createdAt">): string`
  - `normalizePaymentMethod(method?: CongressPaymentMethod | null): CashMethodKey`
  - `summarizeCashBox(payments, filters) → { rows; totalsClp }`
  - `allocatePayment` input: `+ method: CongressPaymentMethod; + paidOn: string`; errores `+ "invalid_method" | "invalid_paid_on"`

- [ ] **Step 1: Extender tipos**

En `types.ts`, junto a `CongressPayment`:

```ts
export type CongressPaymentMethod = "cash" | "transfer" | "other";
```

En `CongressPayment`:

```ts
  /** Medio de pago. Ausente = legacy (caja: Sin clasificar). */
  method?: CongressPaymentMethod;
  /** Día del pago YYYY-MM-DD (America/Santiago). Ausente = legacy. */
  paidOn?: string;
```

- [ ] **Step 2: Test fallido — fechas + caja + allocate con method**

Crear `tests/baseline/congress-cash-box.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  effectivePaidOn,
  isValidPaidOn,
  todayPaidOnSantiago,
} from "../../src/core/congress/payment-dates";
import {
  normalizePaymentMethod,
  summarizeCashBox,
} from "../../src/core/congress/cash-box";
import { allocatePayment } from "../../src/core/congress/payments";
import { CONGRESS_EVENT_ID } from "../../src/core/congress/constants";
import type { CongressPayment, CongressRegistration } from "../../src/core/congress/types";

function baseReg(over: Partial<CongressRegistration> = {}): CongressRegistration {
  return {
    _id: "reg-1",
    tenantId: "ipn-chile",
    eventId: CONGRESS_EVENT_ID,
    identity: {
      fullName: "Juan",
      rut: null,
      email: null,
      phone: null,
      status: "provisional",
    },
    zoneId: "zona-1",
    churchName: "Iglesia",
    attendance: { saturday: null, sunday: null },
    chargeAmountClp: 17_000,
    allocatedPaidClp: 0,
    needsReview: false,
    source: "door",
    version: 1,
    createdAt: "2026-11-17T12:00:00.000Z",
    updatedAt: "2026-11-17T12:00:00.000Z",
    ...over,
  };
}

function pay(over: Partial<CongressPayment> = {}): CongressPayment {
  return {
    _id: "p1",
    tenantId: "ipn-chile",
    eventId: CONGRESS_EVENT_ID,
    payerType: "individual",
    payerName: "Juan",
    amountClp: 10_000,
    allocations: [],
    unallocatedClp: 0,
    status: "posted",
    createdByUserId: "u1",
    createdAt: "2026-11-21T15:00:00.000Z",
    ...over,
  };
}

describe("payment dates", () => {
  it("valida YYYY-MM-DD real y calcula hoy Santiago", () => {
    assert.equal(isValidPaidOn("2026-11-21"), true);
    assert.equal(isValidPaidOn("2026-13-01"), false);
    assert.equal(isValidPaidOn("21-11-2026"), false);
    assert.match(todayPaidOnSantiago(new Date("2026-11-22T03:00:00.000Z")), /^\d{4}-\d{2}-\d{2}$/);
  });

  it("effectivePaidOn usa paidOn o día Santiago de createdAt", () => {
    assert.equal(
      effectivePaidOn({ paidOn: "2026-11-20", createdAt: "2026-11-21T15:00:00.000Z" }),
      "2026-11-20"
    );
    assert.equal(
      effectivePaidOn({ createdAt: "2026-11-21T15:00:00.000Z" }),
      todayPaidOnSantiago(new Date("2026-11-21T15:00:00.000Z")) ===
        effectivePaidOn({ createdAt: "2026-11-21T15:00:00.000Z" })
        ? effectivePaidOn({ createdAt: "2026-11-21T15:00:00.000Z" })
        : effectivePaidOn({ createdAt: "2026-11-21T15:00:00.000Z" })
    );
    // Día calendario Santiago del createdAt:
    assert.equal(effectivePaidOn({ createdAt: "2026-11-21T15:00:00.000Z" }), "2026-11-21");
  });
});

describe("cash box", () => {
  it("normaliza method y suma solo posted por tipo", () => {
    assert.equal(normalizePaymentMethod("cash"), "cash");
    assert.equal(normalizePaymentMethod(undefined), "unclassified");

    const result = summarizeCashBox(
      [
        pay({ _id: "a", method: "cash", paidOn: "2026-11-21", amountClp: 5_000 }),
        pay({ _id: "b", method: "transfer", paidOn: "2026-11-21", amountClp: 7_000 }),
        pay({ _id: "c", paidOn: "2026-11-21", amountClp: 3_000 }), // legacy
        pay({
          _id: "d",
          method: "cash",
          paidOn: "2026-11-21",
          amountClp: 9_000,
          status: "voided",
        }),
      ],
      { status: "posted" }
    );
    assert.equal(result.totalsClp.cash, 5_000);
    assert.equal(result.totalsClp.transfer, 7_000);
    assert.equal(result.totalsClp.unclassified, 3_000);
    assert.equal(result.totalsClp.other, 0);
    assert.equal(result.totalsClp.total, 15_000);
    assert.equal(result.rows.length, 3);
  });

  it("filtra por método y rango paidOn (legacy via createdAt)", () => {
    const result = summarizeCashBox(
      [
        pay({ _id: "a", method: "cash", paidOn: "2026-11-20", amountClp: 1_000 }),
        pay({ _id: "b", method: "cash", paidOn: "2026-11-22", amountClp: 2_000 }),
        pay({
          _id: "c",
          amountClp: 4_000,
          createdAt: "2026-11-21T18:00:00.000Z",
        }),
      ],
      { method: "unclassified", fromPaidOn: "2026-11-21", toPaidOn: "2026-11-21" }
    );
    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0]?._id, "c");
    assert.equal(result.totalsClp.unclassified, 4_000);
  });
});

describe("allocatePayment method/paidOn", () => {
  it("persiste method y paidOn; rechaza inválidos", () => {
    const ok = allocatePayment({
      paymentId: "pay-m1",
      tenantId: "ipn-chile",
      eventId: CONGRESS_EVENT_ID,
      payerType: "individual",
      payerName: "Juan",
      amountClp: 17_000,
      method: "transfer",
      paidOn: "2026-11-20",
      allocations: [{ registrationId: "reg-1", amountClp: 17_000 }],
      createdByUserId: "u1",
      createdAt: "2026-11-21T12:00:00.000Z",
      registrations: [baseReg()],
    });
    assert.equal(ok.ok, true);
    if (!ok.ok) return;
    assert.equal(ok.payment.method, "transfer");
    assert.equal(ok.payment.paidOn, "2026-11-20");

    const badMethod = allocatePayment({
      paymentId: "pay-m2",
      tenantId: "ipn-chile",
      eventId: CONGRESS_EVENT_ID,
      payerType: "individual",
      payerName: "Juan",
      amountClp: 17_000,
      method: "cheque" as "cash",
      paidOn: "2026-11-20",
      allocations: [{ registrationId: "reg-1", amountClp: 17_000 }],
      createdByUserId: "u1",
      createdAt: "2026-11-21T12:00:00.000Z",
      registrations: [baseReg()],
    });
    assert.equal(badMethod.ok, false);
    if (!badMethod.ok) assert.equal(badMethod.error, "invalid_method");

    const badDate = allocatePayment({
      paymentId: "pay-m3",
      tenantId: "ipn-chile",
      eventId: CONGRESS_EVENT_ID,
      payerType: "individual",
      payerName: "Juan",
      amountClp: 17_000,
      method: "cash",
      paidOn: "20/11/2026",
      allocations: [{ registrationId: "reg-1", amountClp: 17_000 }],
      createdByUserId: "u1",
      createdAt: "2026-11-21T12:00:00.000Z",
      registrations: [baseReg()],
    });
    assert.equal(badDate.ok, false);
    if (!badDate.ok) assert.equal(badDate.error, "invalid_paid_on");
  });
});
```

Nota: en el assert de `effectivePaidOn` del ejemplo intermedio hay ruido — **implementar solo** el assert final `createdAt → "2026-11-21"` (UTC-3 sigue siendo 21 nov a las 15:00Z).

- [ ] **Step 3: Run FAIL**

Run: `npx tsx --test tests/baseline/congress-cash-box.test.ts`  
Expected: FAIL — módulos / exports ausentes.

- [ ] **Step 4: Implementar `payment-dates.ts`**

```ts
const PAID_ON_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const SANTIAGO = "America/Santiago";

export function isValidPaidOn(value: string): boolean {
  const m = PAID_ON_RE.exec(value.trim());
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

export function todayPaidOnSantiago(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SANTIAGO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function effectivePaidOn(payment: {
  paidOn?: string | null;
  createdAt: string;
}): string {
  if (payment.paidOn && isValidPaidOn(payment.paidOn)) return payment.paidOn;
  return todayPaidOnSantiago(new Date(payment.createdAt));
}
```

- [ ] **Step 5: Implementar `cash-box.ts`**

```ts
import type { CongressPayment, CongressPaymentMethod } from "@/core/congress/types";
import { effectivePaidOn } from "@/core/congress/payment-dates";

export type CashMethodKey = CongressPaymentMethod | "unclassified";

export type CashBoxFilters = {
  method?: CashMethodKey | "all";
  fromPaidOn?: string;
  toPaidOn?: string;
  status?: "posted" | "voided" | "all";
};

export function normalizePaymentMethod(
  method?: CongressPaymentMethod | null
): CashMethodKey {
  if (method === "cash" || method === "transfer" || method === "other") return method;
  return "unclassified";
}

export function summarizeCashBox(
  payments: CongressPayment[],
  filters: CashBoxFilters = {}
): {
  rows: CongressPayment[];
  totalsClp: Record<CashMethodKey, number> & { total: number };
} {
  const statusFilter = filters.status ?? "posted";
  const methodFilter = filters.method ?? "all";

  const rows = payments.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    const key = normalizePaymentMethod(p.method);
    if (methodFilter !== "all" && key !== methodFilter) return false;
    const day = effectivePaidOn(p);
    if (filters.fromPaidOn && day < filters.fromPaidOn) return false;
    if (filters.toPaidOn && day > filters.toPaidOn) return false;
    return true;
  });

  const totalsClp: Record<CashMethodKey, number> & { total: number } = {
    cash: 0,
    transfer: 0,
    other: 0,
    unclassified: 0,
    total: 0,
  };

  for (const p of rows) {
    if (p.status !== "posted") continue;
    const key = normalizePaymentMethod(p.method);
    const amount = Math.trunc(p.amountClp);
    totalsClp[key] += amount;
    totalsClp.total += amount;
  }

  return { rows, totalsClp };
}
```

- [ ] **Step 6: Extender `allocatePayment`**

En `AllocatePaymentInput` añadir `method` y `paidOn`. Al inicio de `allocatePayment`:

```ts
  const METHODS = new Set(["cash", "transfer", "other"]);
  if (!METHODS.has(input.method)) {
    return { ok: false, error: "invalid_method" };
  }
  if (!isValidPaidOn(input.paidOn)) {
    return { ok: false, error: "invalid_paid_on" };
  }
```

Incluir en el objeto `payment` creado: `method: input.method`, `paidOn: input.paidOn`.  
Extender unión de errores con `"invalid_method" | "invalid_paid_on"`.

- [ ] **Step 7: Actualizar tests existentes de allocate**

En `congress-domain.test.ts` y `congress-critical-flows.test.ts`, cada `allocatePayment({...})` debe incluir p.ej. `method: "cash", paidOn: "2026-11-17"` (o el día del fixture).

- [ ] **Step 8: Run PASS**

Run: `npx tsx --test tests/baseline/congress-cash-box.test.ts tests/baseline/congress-domain.test.ts tests/baseline/congress-critical-flows.test.ts`  
Expected: PASS.

---

### Task 2: Repository + API

**Files:**
- Modify: `src/lib/congress/repository.ts` (`recordCongressPayment`)
- Modify: `src/app/api/congress/payments/route.ts`

**Interfaces:**
- Consumes: `allocatePayment` con `method`/`paidOn`; `isValidPaidOn`; `todayPaidOnSantiago`
- Produces: `recordCongressPayment` acepta `method: CongressPaymentMethod; paidOn?: string`; API exige `method`, default `paidOn`

- [ ] **Step 1: Extender `recordCongressPayment`**

Firma:

```ts
export async function recordCongressPayment(input: {
  tenantId: string;
  payerType: CongressPayment["payerType"];
  payerName: string;
  churchName?: string | null;
  amountClp: number;
  method: CongressPaymentMethod;
  paidOn: string;
  receiptRef?: string | null;
  note?: string | null;
  allocations: CongressPaymentAllocation[];
  createdByUserId: string;
}): Promise<...>
```

Pasar `method` y `paidOn` a `allocatePayment`. Si `allocatePayment` falla con `invalid_method` / `invalid_paid_on`, propagar el `error` string (la route mapea a 400).

- [ ] **Step 2: Validar en `POST` route**

```ts
import { isValidPaidOn, todayPaidOnSantiago } from "@/core/congress/payment-dates";
import type { CongressPaymentMethod } from "@/core/congress/types";

// en body:
method?: CongressPaymentMethod;
paidOn?: string;

const METHODS: CongressPaymentMethod[] = ["cash", "transfer", "other"];
if (!body.method || !METHODS.includes(body.method)) {
  return NextResponse.json(
    { ok: false, error: "Debe indicar tipo de pago (efectivo, transferencia u otro)." },
    { status: 400 }
  );
}
const paidOn =
  typeof body.paidOn === "string" && body.paidOn.trim()
    ? body.paidOn.trim()
    : todayPaidOnSantiago();
if (!isValidPaidOn(paidOn)) {
  return NextResponse.json(
    { ok: false, error: "Fecha de pago inválida." },
    { status: 400 }
  );
}

const result = await recordCongressPayment({
  // ...existentes
  method: body.method,
  paidOn,
});
```

Incluir `method` y `paidOn` en `metadata` del audit `payment.record`.

- [ ] **Step 3: Smoke mental / types**

Run: `npx tsx --test tests/baseline/congress-cash-box.test.ts tests/baseline/congress-domain.test.ts tests/baseline/congress-critical-flows.test.ts`  
Expected: PASS. (No hay test HTTP dedicado; la validación queda cubierta en dominio + inspección de route.)

---

### Task 3: UI — labels + pago individual (ficha)

**Files:**
- Modify: `src/components/admin/congress/labels.ts`
- Modify: `src/components/admin/congress/participant/ParticipantSheet.tsx`
- Modify: `src/components/admin/congress/CongressOpsPanel.tsx` (`individualPayment` body)

**Interfaces:**
- Consumes: `CongressPaymentMethod`, `todayPaidOnSantiago`
- Produces: `paymentMethodLabel(method | unclassified)`; form ficha envía `method` + `paidOn`

- [ ] **Step 1: Labels**

En `labels.ts`:

```ts
import type { CongressPaymentMethod } from "@/core/congress/types";
import type { CashMethodKey } from "@/core/congress/cash-box";

export function paymentMethodLabel(method: CashMethodKey | CongressPaymentMethod | null | undefined): string {
  switch (method) {
    case "cash":
      return "Efectivo";
    case "transfer":
      return "Transferencia";
    case "other":
      return "Otro";
    default:
      return "Sin clasificar";
  }
}
```

- [ ] **Step 2: Estado y campos en `ParticipantSheet`**

Añadir estado:

```ts
const [payMethod, setPayMethod] = useState<CongressPaymentMethod>("cash");
const [paidOn, setPaidOn] = useState(todayPaidOnSantiago());
```

Reset en el `useEffect` de apertura: `setPayMethod("cash"); setPaidOn(todayPaidOnSantiago());`

Extender `onIndividualPayment` input:

```ts
onIndividualPayment: (input: {
  registrationId: string;
  amountClp: number;
  payerName: string;
  method: CongressPaymentMethod;
  paidOn: string;
  receiptRef?: string;
}) => Promise<void>;
```

En el grid del form (junto a Pagador/Monto/Referencia), añadir:

```tsx
<Select
  label="Tipo"
  value={payMethod}
  onChange={(e) => setPayMethod(e.target.value as CongressPaymentMethod)}
  options={[
    { value: "cash", label: "Efectivo" },
    { value: "transfer", label: "Transferencia" },
    { value: "other", label: "Otro" },
  ]}
/>
<Input
  label="Fecha de pago"
  type="date"
  value={paidOn}
  onChange={(e) => setPaidOn(e.target.value)}
/>
```

En el click de Registrar pago, pasar `method: payMethod, paidOn`.

- [ ] **Step 3: Cablear `individualPayment` en panel**

```ts
body: JSON.stringify({
  payerType: "individual",
  payerName: input.payerName,
  amountClp: input.amountClp,
  method: input.method,
  paidOn: input.paidOn,
  receiptRef: input.receiptRef,
  allocations: [
    { registrationId: input.registrationId, amountClp: input.amountClp },
  ],
}),
```

- [ ] **Step 4: Smoke local**

Con `npm run dev`, abrir ficha → Alimentación → registrar pago efectivo con fecha distinta de hoy; verificar toast OK y que el listado de Aportes muestra el movimiento tras refresh.

---

### Task 4: UI — pago grupal + caja en Aportes

**Files:**
- Modify: `src/components/admin/congress/CongressOpsPanel.tsx`
- Prefer: Create `src/components/admin/congress/payments/CashBoxPanel.tsx` si el bloque de listado supera ~80 líneas nuevas; si no, inline en la misma pestaña.

**Interfaces:**
- Consumes: `summarizeCashBox`, `normalizePaymentMethod`, `paymentMethodLabel`, `effectivePaidOn`, `todayPaidOnSantiago`
- Produces: form grupal con `method`/`paidOn`; caja con filtros y totales

- [ ] **Step 1: Estado grupal**

```ts
const [groupMethod, setGroupMethod] = useState<CongressPaymentMethod>("cash");
const [groupPaidOn, setGroupPaidOn] = useState(todayPaidOnSantiago());
```

En el form de pago grupal, añadir `Select` Tipo y `Input type="date"` Fecha (mismo patrón que ficha).  
En `submitGroupPayment` body:

```ts
method: groupMethod,
paidOn: groupPaidOn,
```

Tras éxito, no hace falta resetear método/fecha (el operador puede hacer el segundo movimiento del mixto seguido). Copy bajo el botón:

```tsx
<p className="text-xs text-muted">
  Si pagan parte en efectivo y parte por transferencia, registre dos pagos grupales (uno por tipo).
</p>
```

- [ ] **Step 2: Estado filtros de caja**

```ts
const [cashMethodFilter, setCashMethodFilter] = useState<CashMethodKey | "all">("all");
const [cashFrom, setCashFrom] = useState("");
const [cashTo, setCashTo] = useState("");
const [cashStatus, setCashStatus] = useState<"posted" | "voided" | "all">("posted");

const cashBox = useMemo(
  () =>
    summarizeCashBox(payments, {
      method: cashMethodFilter,
      fromPaidOn: cashFrom || undefined,
      toPaidOn: cashTo || undefined,
      status: cashStatus,
    }),
  [payments, cashMethodFilter, cashFrom, cashTo, cashStatus]
);
```

- [ ] **Step 3: UI Caja (reemplazar listado mínimo actual)**

Renombrar sección a **Caja** (o “Caja y pagos”). Controles:

- Select tipo: Todos / Efectivo / Transferencia / Otro / Sin clasificar  
- Inputs date Desde / Hasta  
- Select estado: Vigentes / Anulados / Todos  

Totales (solo `totalsClp` del helper):

```tsx
<p className="text-sm">
  Efectivo {formatClp(cashBox.totalsClp.cash)} · Transferencia{" "}
  {formatClp(cashBox.totalsClp.transfer)} · Otro {formatClp(cashBox.totalsClp.other)} ·
  Sin clasificar {formatClp(cashBox.totalsClp.unclassified)} ·{" "}
  <strong>Total {formatClp(cashBox.totalsClp.total)}</strong>
</p>
```

Filas: usar `cashBox.rows` en lugar de `payments.map`. Mostrar:

`{effectivePaidOn(p)} · {paymentMethodLabel(normalizePaymentMethod(p.method))} · {p.payerName} · {formatClp(p.amountClp)} · {p.status}`

Conservar botón Anular con la misma lógica/permiso.

- [ ] **Step 4: Smoke local**

1. Pago grupal transferencia.  
2. Segundo pago grupal efectivo (mixto).  
3. Filtros caja por tipo y fecha; totales coherentes.  
4. Anular uno → sale de totales vigentes.

---

### Task 5: Verificación

**Files:** ninguno de producto (evidencia en respuesta al usuario)

- [ ] **Step 1: Suite tests**

Run: `npx tsx --test tests/baseline/congress-cash-box.test.ts tests/baseline/congress-domain.test.ts tests/baseline/congress-critical-flows.test.ts`  
Expected: PASS.

- [ ] **Step 2: Navegador**

- Individual: cash / transfer / other + `paidOn` ≠ hoy; recarga conserva.  
- Grupal mixto: dos movimientos; saldos de participantes OK.  
- Caja: filtros; legacy sin method en Sin clasificar si existen.  
- API: POST sin `method` → 400 (DevTools o curl local).

- [ ] **Step 3: Capturas** de ficha con tipo/fecha, caja con totales, y (si aplica) rechazo sin method.

---

## Self-review (plan vs spec)

| Spec | Task |
|------|------|
| `method` + `paidOn` en modelo | 1 |
| Helpers caja / legacy unclassified / effectivePaidOn | 1 |
| `allocatePayment` valida y persiste | 1 |
| POST exige method; default paidOn hoy Santiago | 2 |
| Ficha individual Tipo + Fecha | 3 |
| Grupal Tipo + Fecha; mixto = dos movimientos | 4 |
| Caja filtros + totales solo posted | 4 |
| Alimentación status sin cambio | (implícito; no tocar `finance-status`) |
| Sin arqueo / sin edit post-guardar / sin multi-tender | Global Constraints |
| Verificación | 5 |
