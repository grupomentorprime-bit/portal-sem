# Pago grupal: recaudación partida — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** En Pago grupal, opción opcional “Partir recaudación” que reparte efectivo + transferencia proporcional al saldo y registra hasta dos ingresos con un Guardar; default sin cambios.

**Architecture:** Helper puro `distributeProportional` en `src/core/congress/`. La UI del panel activa un modo partido con dos `ClpAmountInput`, calcula allocations por tramo sobre los mismos saldos iniciales, y hace uno o dos `POST /api/congress/payments`.

**Tech Stack:** TypeScript, React client (`CongressOpsPanel`), `ClpAmountInput`, `node:test` vía `tsx --test`.

## Global Constraints

- Default off: un Tipo, allocations = saldo completo c/u, un POST.
- Partir on: inputs Efectivo + Transferencia; Tipo único oculto/ignorado.
- Un Guardar → hasta 2 POSTs (`cash`, `transfer`); tramo $0 no genera POST.
- Reparto proporcional al saldo; pesos enteros; residuo a mayor saldo restante (desempate `registrationId` asc).
- Ambos tramos usan los **mismos** saldos previos al guardado (no restar el primer tramo antes del segundo).
- Tope: `efectivo + transferencia ≤ suma saldos`; ambos ≥ 0; al menos uno > 0.
- Sin endpoints nuevos; sin transacción atómica multi-pago.
- Spec: `docs/superpowers/specs/2026-11-18-pago-grupal-recaudacion-partida-design.md`.

## File map

| File | Responsibility |
|------|----------------|
| `src/core/congress/payment-distribute.ts` | `distributeProportional` |
| `tests/baseline/congress-payment-distribute.test.ts` | Tests del reparto |
| `src/components/admin/congress/CongressOpsPanel.tsx` | Checkbox, inputs, preview, dual POST |

---

### Task 1: `distributeProportional`

**Files:**
- Create: `src/core/congress/payment-distribute.ts`
- Test: `tests/baseline/congress-payment-distribute.test.ts`

**Interfaces:**
- Produces:
```ts
export type DistributeRow = { registrationId: string; balanceClp: number };
export type DistributeAllocation = { registrationId: string; amountClp: number };

export function distributeProportional(
  rows: DistributeRow[],
  amountClp: number
): DistributeAllocation[];

/** Throws Error with message `amount_exceeds_balances` if amount > sum(balances). */
```

- [ ] **Step 1: Write the failing test**

Create `tests/baseline/congress-payment-distribute.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { distributeProportional } from "../../src/core/congress/payment-distribute";

describe("distributeProportional", () => {
  it("reparte en partes iguales cuando los saldos son iguales", () => {
    const rows = [
      { registrationId: "a", balanceClp: 17000 },
      { registrationId: "b", balanceClp: 17000 },
      { registrationId: "c", balanceClp: 17000 },
      { registrationId: "d", balanceClp: 17000 },
      { registrationId: "e", balanceClp: 17000 },
    ];
    const out = distributeProportional(rows, 42500);
    const sum = out.reduce((s, r) => s + r.amountClp, 0);
    assert.equal(sum, 42500);
    assert.equal(out.length, 5);
    // 42500 / 5 = 8500 exacto
    assert.deepEqual(
      out.map((r) => r.amountClp).sort((a, b) => a - b),
      [8500, 8500, 8500, 8500, 8500]
    );
  });

  it("reparte residuo por mayor saldo restante y desempate por id", () => {
    const rows = [
      { registrationId: "b", balanceClp: 100 },
      { registrationId: "a", balanceClp: 100 },
    ];
    // floor: 50+50 = 100, amount 101 → +1 al mayor remaining tras floor.
    // floor each = 50; remaining after floor = 50 each; tie → id "a" first
    const out = distributeProportional(rows, 101);
    assert.equal(out.reduce((s, r) => s + r.amountClp, 0), 101);
    const byId = Object.fromEntries(out.map((r) => [r.registrationId, r.amountClp]));
    assert.equal(byId.a, 51);
    assert.equal(byId.b, 50);
  });

  it("ignora saldo 0 y retorna vacío si monto <= 0", () => {
    assert.deepEqual(distributeProportional([{ registrationId: "a", balanceClp: 0 }], 100), []);
    assert.deepEqual(
      distributeProportional([{ registrationId: "a", balanceClp: 100 }], 0),
      []
    );
  });

  it("lanza si el monto supera la suma de saldos", () => {
    assert.throws(
      () =>
        distributeProportional([{ registrationId: "a", balanceClp: 100 }], 101),
      /amount_exceeds_balances/
    );
  });

  it("reparte proporcional con saldos desiguales", () => {
    const rows = [
      { registrationId: "x", balanceClp: 10000 },
      { registrationId: "y", balanceClp: 5000 },
    ];
    // total 15000, amount 3000 → x:2000 y:1000 exact
    const out = distributeProportional(rows, 3000);
    const byId = Object.fromEntries(out.map((r) => [r.registrationId, r.amountClp]));
    assert.equal(byId.x, 2000);
    assert.equal(byId.y, 1000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/congress-payment-distribute.test.ts`

Expected: FAIL — module not found / not exported.

- [ ] **Step 3: Write minimal implementation**

Create `src/core/congress/payment-distribute.ts`:

```ts
export type DistributeRow = { registrationId: string; balanceClp: number };
export type DistributeAllocation = { registrationId: string; amountClp: number };

export function distributeProportional(
  rows: DistributeRow[],
  amountClp: number
): DistributeAllocation[] {
  const amount = Math.trunc(amountClp);
  if (!Number.isFinite(amount) || amount <= 0) return [];

  const eligible = rows
    .map((r) => ({
      registrationId: r.registrationId,
      balanceClp: Math.max(0, Math.trunc(r.balanceClp)),
    }))
    .filter((r) => r.balanceClp > 0);

  if (eligible.length === 0) return [];

  const totalBalance = eligible.reduce((s, r) => s + r.balanceClp, 0);
  if (amount > totalBalance) {
    throw new Error("amount_exceeds_balances");
  }

  const floors = eligible.map((r) => {
    const raw = (amount * r.balanceClp) / totalBalance;
    const floor = Math.floor(raw);
    return {
      registrationId: r.registrationId,
      balanceClp: r.balanceClp,
      amountClp: floor,
      remainderAfterFloor: r.balanceClp - floor,
    };
  });

  let leftover = amount - floors.reduce((s, r) => s + r.amountClp, 0);

  const order = [...floors].sort((a, b) => {
    if (b.remainderAfterFloor !== a.remainderAfterFloor) {
      return b.remainderAfterFloor - a.remainderAfterFloor;
    }
    return a.registrationId.localeCompare(b.registrationId);
  });

  for (const row of order) {
    if (leftover <= 0) break;
    if (row.amountClp >= row.balanceClp) continue;
    row.amountClp += 1;
    leftover -= 1;
  }

  // If still leftover (all at cap), keep assigning in same order while under balance
  while (leftover > 0) {
    let progressed = false;
    for (const row of order) {
      if (leftover <= 0) break;
      if (row.amountClp >= row.balanceClp) continue;
      row.amountClp += 1;
      leftover -= 1;
      progressed = true;
    }
    if (!progressed) break;
  }

  return floors
    .filter((r) => r.amountClp > 0)
    .map((r) => ({
      registrationId: r.registrationId,
      amountClp: r.amountClp,
    }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/congress-payment-distribute.test.ts`

Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add src/core/congress/payment-distribute.ts tests/baseline/congress-payment-distribute.test.ts
git commit -m "feat(congreso): reparte recaudación grupal proporcional al saldo."
```

---

### Task 2: UI — Partir recaudación + preview

**Files:**
- Modify: `src/components/admin/congress/CongressOpsPanel.tsx`

**Interfaces:**
- Consumes: `distributeProportional`, `ClpAmountInput`, `remainingBalanceClp`, `formatClp`
- Produces: state `groupSplitRecaudacion: boolean`, `groupCashClp: number | null`, `groupTransferClp: number | null`; memos `groupSplitCashAlloc` / `groupSplitTransferAlloc`

- [ ] **Step 1: State e imports**

Near other group state (`groupSelected`, `groupMethod`, …) add:

```ts
const [groupSplitRecaudacion, setGroupSplitRecaudacion] = useState(false);
const [groupCashClp, setGroupCashClp] = useState<number | null>(null);
const [groupTransferClp, setGroupTransferClp] = useState<number | null>(null);
```

Import `distributeProportional` from `@/core/congress/payment-distribute`.
Import `ClpAmountInput` from `@/components/admin/congress/ClpAmountInput`.

- [ ] **Step 2: Memos de balances y allocations partidas**

After `groupPreview` / `groupAmount` (modo default = saldo completo), add:

```ts
  const groupBalanceRows = useMemo(() => {
    const byId = new Map(registrations.map((r) => [r._id, r]));
    return groupSelectedActive
      .map((id) => {
        const reg = byId.get(id);
        return {
          registrationId: id,
          balanceClp: reg ? remainingBalanceClp(reg) : 0,
        };
      })
      .filter((r) => r.balanceClp > 0);
  }, [groupSelectedActive, registrations]);

  const groupSaldoTotal = useMemo(
    () => groupBalanceRows.reduce((s, r) => s + r.balanceClp, 0),
    [groupBalanceRows]
  );

  const groupSplitCashAlloc = useMemo(() => {
    if (!groupSplitRecaudacion) return [];
    const amount = groupCashClp ?? 0;
    if (amount <= 0) return [];
    try {
      return distributeProportional(groupBalanceRows, amount);
    } catch {
      return [];
    }
  }, [groupSplitRecaudacion, groupCashClp, groupBalanceRows]);

  const groupSplitTransferAlloc = useMemo(() => {
    if (!groupSplitRecaudacion) return [];
    const amount = groupTransferClp ?? 0;
    if (amount <= 0) return [];
    try {
      return distributeProportional(groupBalanceRows, amount);
    } catch {
      return [];
    }
  }, [groupSplitRecaudacion, groupTransferClp, groupBalanceRows]);
```

- [ ] **Step 3: Controles UI en el formulario**

Después del bloque “Monto total (CLP)” (o antes de Tipo), insertar:

```tsx
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={groupSplitRecaudacion}
                  onChange={(e) => {
                    setGroupSplitRecaudacion(e.target.checked);
                    if (!e.target.checked) {
                      setGroupCashClp(null);
                      setGroupTransferClp(null);
                    }
                  }}
                />
                Partir recaudación (efectivo + transferencia)
              </label>

              {groupSplitRecaudacion ? (
                <div className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-2">
                  <p className="sm:col-span-2 text-sm font-medium">Recaudación</p>
                  <ClpAmountInput
                    label="Efectivo (CLP)"
                    value={groupCashClp}
                    onValueChange={setGroupCashClp}
                  />
                  <ClpAmountInput
                    label="Transferencia (CLP)"
                    value={groupTransferClp}
                    onValueChange={setGroupTransferClp}
                  />
                  <p className="sm:col-span-2 text-xs text-muted">
                    Suma ≤ saldo del grupo ({formatClp(groupSaldoTotal)}). Un
                    Guardar registra hasta dos ingresos.
                  </p>
                </div>
              ) : null}

              {!groupSplitRecaudacion ? (
                <Select
                  label="Tipo"
                  value={groupMethod}
                  onChange={(e) =>
                    setGroupMethod(e.target.value as CongressPaymentMethod)
                  }
                  options={[
                    { value: "cash", label: "Efectivo" },
                    { value: "transfer", label: "Transferencia" },
                    { value: "other", label: "Otro" },
                  ]}
                />
              ) : null}
```

Quitar el `<Select label="Tipo" …>` duplicado que ya existía (solo debe quedar el condicional de arriba).

Actualizar la nota del pie:

```tsx
              <p className="text-xs text-muted">
                Por defecto un solo tipo de pago. Si el líder trae efectivo y
                transferencia, active Partir recaudación: un Guardar genera
                ambos ingresos.
              </p>
```

- [ ] **Step 4: Preview partido**

Reemplazar el bloque “Distribución prevista” para que, si `groupSplitRecaudacion`:

```tsx
              {groupSplitRecaudacion && groupBalanceRows.length > 0 ? (
                <div className="rounded-md border border-border bg-white p-3 text-sm">
                  <p className="mb-2 font-medium">Distribución prevista</p>
                  <ul className="space-y-1">
                    {groupBalanceRows.map((row) => {
                      const reg = registrations.find(
                        (r) => r._id === row.registrationId
                      );
                      const cash =
                        groupSplitCashAlloc.find(
                          (a) => a.registrationId === row.registrationId
                        )?.amountClp ?? 0;
                      const transfer =
                        groupSplitTransferAlloc.find(
                          (a) => a.registrationId === row.registrationId
                        )?.amountClp ?? 0;
                      return (
                        <li key={row.registrationId}>
                          {reg
                            ? registrationDisplayName(reg)
                            : row.registrationId}
                          : Ef {formatClp(cash)} · Tr {formatClp(transfer)} ·
                          Total {formatClp(cash + transfer)}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {!groupSplitRecaudacion && groupPreview.length > 0 ? (
                <div className="rounded-md border border-border bg-white p-3 text-sm">
                  <p className="mb-2 font-medium">Distribución prevista</p>
                  <ul className="space-y-1">
                    {groupPreview.map((row) => {
                      const reg = registrations.find(
                        (r) => r._id === row.registrationId
                      );
                      return (
                        <li key={row.registrationId}>
                          {reg
                            ? registrationDisplayName(reg)
                            : row.registrationId}
                          : {formatClp(row.amountClp)}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
```

- [ ] **Step 5: Commit UI (sin submit dual aún — preview/estado listos; submit en Task 3)**

Si el Guardar aún no usa el modo partido, dejar el submit default intacto en este commit.

```bash
git add src/components/admin/congress/CongressOpsPanel.tsx
git commit -m "feat(congreso): UI de partir recaudación en pago grupal."
```

---

### Task 3: Guardar — dual POST + validación

**Files:**
- Modify: `src/components/admin/congress/CongressOpsPanel.tsx` (`submitGroupPayment`)

**Interfaces:**
- Consumes: `groupSplitRecaudacion`, `groupCashClp`, `groupTransferClp`, `groupSplitCashAlloc`, `groupSplitTransferAlloc`, `groupPreview`, `groupAmount`

- [ ] **Step 1: Helper local postPayment**

Dentro del componente (o justo antes de `submitGroupPayment`), factorizar:

```ts
  const postGroupPayment = async (input: {
    amountClp: number;
    method: CongressPaymentMethod;
    allocations: Array<{ registrationId: string; amountClp: number }>;
  }) => {
    const res = await fetch("/api/congress/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payerType: "church",
        payerName: groupPayer.trim(),
        churchName: groupChurchLabel || undefined,
        amountClp: input.amountClp,
        method: input.method,
        paidOn: groupPaidOn,
        allocations: input.allocations,
      }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && Boolean(data.ok), error: data.error as string | undefined };
  };
```

- [ ] **Step 2: Reescribir submitGroupPayment**

```ts
  const submitGroupPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!groupPayer.trim() || groupSelectedActive.length === 0) {
      push({
        title: "Complete pagador y seleccione al menos un participante",
        tone: "warning",
      });
      return;
    }

    if (groupSplitRecaudacion) {
      const cash = groupCashClp ?? 0;
      const transfer = groupTransferClp ?? 0;
      if (cash < 0 || transfer < 0 || (cash <= 0 && transfer <= 0)) {
        push({
          title: "Indique al menos un monto en recaudación",
          tone: "warning",
        });
        return;
      }
      if (cash + transfer > groupSaldoTotal) {
        push({
          title: "La recaudación supera el saldo del grupo",
          description: `Máximo ${formatClp(groupSaldoTotal)}.`,
          tone: "warning",
        });
        return;
      }
      if (
        (cash > 0 && groupSplitCashAlloc.length === 0) ||
        (transfer > 0 && groupSplitTransferAlloc.length === 0)
      ) {
        push({
          title: "No se pudo repartir la recaudación",
          tone: "warning",
        });
        return;
      }

      setPaymentSaving(true);
      try {
        const legs: Array<{
          label: string;
          method: CongressPaymentMethod;
          amountClp: number;
          allocations: Array<{ registrationId: string; amountClp: number }>;
        }> = [];
        if (cash > 0) {
          legs.push({
            label: "Efectivo",
            method: "cash",
            amountClp: cash,
            allocations: groupSplitCashAlloc,
          });
        }
        if (transfer > 0) {
          legs.push({
            label: "Transferencia",
            method: "transfer",
            amountClp: transfer,
            allocations: groupSplitTransferAlloc,
          });
        }

        const done: string[] = [];
        for (const leg of legs) {
          const result = await postGroupPayment(leg);
          if (!result.ok) {
            push({
              title: `No se registró: ${leg.label}`,
              description:
                done.length > 0
                  ? `Ya quedó registrado: ${done.join(", ")}. Reintente el tramo faltante.`
                  : result.error ?? "Error del servidor.",
              tone: "warning",
            });
            void loadPayments();
            void loadRegistrations();
            void loadSummary();
            return;
          }
          done.push(leg.label);
        }

        push({
          title:
            done.length > 1
              ? "Recaudación partida registrada"
              : "Pago grupal registrado",
          tone: "success",
        });
        setGroupSelected([]);
        setGroupCashClp(null);
        setGroupTransferClp(null);
        setGroupSplitRecaudacion(false);
        void loadPayments();
        void loadRegistrations();
        void loadSummary();
      } finally {
        setPaymentSaving(false);
      }
      return;
    }

    const amount = groupAmount;
    if (!amount || groupPreview.length === 0) {
      push({
        title: "Complete pagador y seleccione al menos un participante",
        tone: "warning",
      });
      return;
    }
    setPaymentSaving(true);
    try {
      const result = await postGroupPayment({
        amountClp: amount,
        method: groupMethod,
        allocations: groupPreview,
      });
      if (!result.ok) {
        push({
          title: "Pago grupal no registrado",
          description: result.error ?? "Error del servidor.",
          tone: "warning",
        });
        return;
      }
      push({ title: "Pago grupal registrado", tone: "success" });
      setGroupSelected([]);
      void loadPayments();
      void loadRegistrations();
      void loadSummary();
    } finally {
      setPaymentSaving(false);
    }
  };
```

- [ ] **Step 3: Run unit tests del core**

Run: `npx tsx --test tests/baseline/congress-payment-distribute.test.ts`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/congress/CongressOpsPanel.tsx
git commit -m "feat(congreso): guarda recaudación partida en dos ingresos grupales."
```

---

### Task 4: Verificación

**Files:** ninguna (checklist)

- [ ] **Step 1: Unit tests**

Run: `npx tsx --test tests/baseline/congress-payment-distribute.test.ts`

Expected: PASS.

- [ ] **Step 2: Browser smoke** (login requerido)

1. Sin Partir: 2–3 personas → Guardar efectivo → Pagado.
2. Partir: 5 personas, $42.500 + $42.500 → 2 movimientos; todos Pagado.
3. Partir solo efectivo parcial → Abono; segundo guardado completa.
4. Checkbox off restaura Tipo único.

- [ ] **Step 3: Commit solo si hubo fixes**

```bash
git add -p
git commit -m "fix(congreso): ajustes recaudación partida tras verificación."
```

Sin cambios → no crear commit vacío.

---

## Spec coverage (self-review)

| Spec | Task |
|------|------|
| Default intacto | Task 2+3 |
| Checkbox Partir + Recaudación | Task 2 |
| Dual POST / tramo 0 | Task 3 |
| Proporcional + residuo | Task 1 |
| Mismos saldos iniciales ambos tramos | Task 2 memos + Task 3 |
| Tope suma ≤ saldo | Task 3 validación |
| Preview columnas Ef/Tr/Total | Task 2 |
| Fallo 2º POST mensaje | Task 3 |
| Nota UI | Task 2 |
| Tests unitarios | Task 1+4 |
