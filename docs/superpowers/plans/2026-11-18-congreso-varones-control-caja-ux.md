# Congreso Varones — Control de caja UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar la presentación de Control de caja para jerarquía operativa clara (cierre → recaudado → día condicional → zona|iglesia → movimientos), sin cambiar dominio ni APIs.

**Architecture:** Reescribir solo el layout de `CashBoxView.tsx` con helpers locales de presentación (chips, fila compacta, montos en línea). Misma props y mismos agregados (`summarizeContributionClose`, `summarizeCashBox`, `breakdownPaymentsByPaidOn`, `breakdownContributionsByZone` / `ByChurch`).

**Tech Stack:** React client component, kit admin (`Section`, `EmptyState`, `AlertBanner`, `LoadingState`), `Button` / `Input` / `Select`, `cn`, labels `formatClp` / `formatZoneLabel` / `paymentMethodLabel`.

**Spec:** `docs/superpowers/specs/2026-11-18-congreso-varones-control-caja-ux-design.md`

## Global Constraints

- Solo UI en `CashBoxView.tsx` (helpers locales OK); no tocar `cash-box.ts`, APIs ni permisos.
- Sin gráficos, sin cards decorativas, sin tema nuevo; kit admin (violeta selección, neutros).
- “Por día de pago”: no renderizar si `byDay.length === 0`; si hay datos, franja horizontal (no columna del grid zona/iglesia).
- Totales y conteos idénticos a hoy; solo cambia presentación.
- Sin commit/PR ni despliegue salvo que el usuario lo pida explícitamente.
- Zona UI: `formatZoneLabel`; iglesias ya vienen ordenadas por saldo desc desde `breakdownContributionsByChurch`.

## File map

| Path | Responsibility |
|------|----------------|
| `src/components/admin/congress/cash/CashBoxView.tsx` | Único archivo de implementación del rediseño |
| `docs/superpowers/specs/2026-11-18-congreso-varones-control-caja-ux-design.md` | Spec (ya autorizada; no hace falta editarla en tasks) |

---

### Task 1: Helpers de presentación + Cierre héroe

**Files:**
- Modify: `src/components/admin/congress/cash/CashBoxView.tsx`

**Interfaces:**
- Consumes: props actuales de `CashBoxView` (sin cambiar firma pública); `summarizeContributionClose`
- Produces (locales en el mismo archivo):
  ```ts
  function StatusChip({ label, count }: { label: string; count: number }): JSX.Element;
  function AmountInline({
    expectedClp, collectedClp, remainingClp, count, emphasizeRemaining?,
  }: {
    expectedClp: number; collectedClp: number; remainingClp: number;
    count: number; emphasizeRemaining?: boolean;
  }): JSX.Element;
  function PayBadge({ owes }: { owes: boolean }): JSX.Element;
  ```

- [ ] **Step 1: Reemplazar `AmountBlock` por helpers densos**

En `CashBoxView.tsx`, eliminar `AmountBlock` y añadir:

```tsx
function StatusChip({ label, count }: { label: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-2.5 py-1 text-sm">
      <span className="text-muted">{label}</span>
      <span className="tabular-nums font-semibold text-foreground">{count}</span>
    </span>
  );
}

function PayBadge({ owes }: { owes: boolean }) {
  return owes ? (
    <span className="shrink-0 rounded-md bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-950">
      Falta pagar
    </span>
  ) : (
    <span className="shrink-0 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-950">
      Al día
    </span>
  );
}

function AmountInline({
  expectedClp,
  collectedClp,
  remainingClp,
  count,
  emphasizeRemaining,
}: {
  expectedClp: number;
  collectedClp: number;
  remainingClp: number;
  count: number;
  emphasizeRemaining?: boolean;
}) {
  return (
    <div className="mt-1.5 space-y-0.5">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 text-sm">
        <span>
          <span className="text-muted">Esp. </span>
          <span className="tabular-nums font-medium">{formatClp(expectedClp)}</span>
        </span>
        <span>
          <span className="text-muted">Cob. </span>
          <span className="tabular-nums font-medium">{formatClp(collectedClp)}</span>
        </span>
        <span>
          <span className="text-muted">Saldo </span>
          <span
            className={cn(
              "tabular-nums font-semibold",
              emphasizeRemaining && remainingClp > 0
                ? "text-amber-900"
                : "text-foreground"
            )}
          >
            {formatClp(remainingClp)}
          </span>
        </span>
      </div>
      <p className="text-xs text-muted">{count} personas</p>
    </div>
  );
}
```

- [ ] **Step 2: Reordenar — Cierre operativo primero (héroe)**

En el `return` principal, poner **antes** de “Recaudado por medio”:

```tsx
<Section
  title="Cierre operativo"
  description="Universo completo de inscripciones (no usa filtros de movimientos)."
>
  <div className="rounded-lg border border-border bg-white p-4">
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Cargo esperado
        </p>
        <p className="mt-1 tabular-nums text-2xl font-semibold text-foreground">
          {formatClp(close.expectedClp)}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Cobrado imputado
        </p>
        <p className="mt-1 tabular-nums text-2xl font-semibold text-foreground">
          {formatClp(close.collectedClp)}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Saldo pendiente
        </p>
        <p className="mt-1 tabular-nums text-2xl font-bold text-amber-900">
          {formatClp(close.remainingClp)}
        </p>
      </div>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      <StatusChip label="Pendiente" count={close.countsByStatus.pending} />
      <StatusChip label="Abono" count={close.countsByStatus.partial} />
      <StatusChip label="Pagado" count={close.countsByStatus.paid} />
      <StatusChip
        label="Verificación"
        count={close.countsByStatus.needs_verification}
      />
      <StatusChip label="Sin cargo" count={close.countsByStatus.no_charge} />
    </div>
  </div>
</Section>
```

Quitar el bloque viejo de cierre (tres cards sueltas + texto “Pendiente: N”).

- [ ] **Step 3: Verificar en navegador (parcial)**

Abrir `/admin/portal/congreso-varones` → pestaña **Control de caja**.  
Expected: Cierre arriba con 3 cifras grandes + chips; saldo con más peso. Sin errores de consola.

---

### Task 2: Recaudado por medio alineado

**Files:**
- Modify: `src/components/admin/congress/cash/CashBoxView.tsx`

**Interfaces:**
- Consumes: filtros controlados + `cashBox.totalsClp` (sin cambio)
- Produces: sección “Recaudado por medio” debajo del cierre

- [ ] **Step 1: Unificar ancho filtros + totales**

Reemplazar la sección “Recaudado por medio” por:

```tsx
<Section
  title="Recaudado por medio"
  description="Según filtros · totales solo vigentes (posted)."
>
  <div className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Select
        label="Tipo"
        value={methodFilter}
        onChange={(e) =>
          onMethodFilterChange(e.target.value as CashMethodKey | "all")
        }
        options={[
          { value: "all", label: "Todos" },
          { value: "cash", label: "Efectivo" },
          { value: "transfer", label: "Transferencia" },
          { value: "other", label: "Otro" },
          { value: "unclassified", label: "Sin clasificar" },
        ]}
      />
      <Input
        label="Desde"
        type="date"
        value={fromPaidOn}
        onChange={(e) => onFromPaidOnChange(e.target.value)}
      />
      <Input
        label="Hasta"
        type="date"
        value={toPaidOn}
        onChange={(e) => onToPaidOnChange(e.target.value)}
      />
      <Select
        label="Estado"
        value={statusFilter}
        onChange={(e) =>
          onStatusFilterChange(e.target.value as "posted" | "voided" | "all")
        }
        options={[
          { value: "posted", label: "Vigentes" },
          { value: "voided", label: "Anulados" },
          { value: "all", label: "Todos" },
        ]}
      />
    </div>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {(
        [
          ["Efectivo", totalsClp.cash, false],
          ["Transferencia", totalsClp.transfer, false],
          ["Otro", totalsClp.other, false],
          ["Sin clasificar", totalsClp.unclassified, false],
          ["Total", totalsClp.total, true],
        ] as const
      ).map(([label, value, emphasize]) => (
        <div
          key={label}
          className={cn(
            "rounded-md border px-3 py-2.5",
            emphasize
              ? "border-violet-200 bg-violet-50"
              : "border-border bg-white"
          )}
        >
          <p className="text-xs text-muted">{label}</p>
          <p
            className={cn(
              "tabular-nums text-lg",
              emphasize ? "font-bold text-foreground" : "font-medium"
            )}
          >
            {formatClp(value)}
          </p>
        </div>
      ))}
    </div>
  </div>
</Section>
```

Importante: quitar `max-w-4xl` del grid de filtros para alinear con los totales a ancho completo.

- [ ] **Step 2: Verificar filtros**

Cambiar Tipo/Estado y confirmar que los totales siguen respondiendo (mismo comportamiento que antes).

---

### Task 3: Por día (condicional) + Zona | Iglesias densas

**Files:**
- Modify: `src/components/admin/congress/cash/CashBoxView.tsx`

**Interfaces:**
- Consumes: `byDay`, `byZone`, `churchesInZone`, `churchesPending`, `selectedZoneId` / `setSelectedZoneId`
- Produces: franja día opcional; grid 2 columnas zona|iglesia

- [ ] **Step 1: Franja “Por día de pago” solo si hay datos**

Después de Recaudado, **antes** del grid zona/iglesia:

```tsx
{byDay.length > 0 ? (
  <Section title="Por día de pago">
    <div className="flex gap-2 overflow-x-auto pb-1">
      {byDay.map((row) => (
        <div
          key={row.paidOn}
          className="shrink-0 rounded-md border border-border bg-white px-3 py-2"
        >
          <p className="text-xs text-muted">{row.paidOn}</p>
          <p className="tabular-nums text-base font-semibold">
            {formatClp(row.totalClp)}
          </p>
        </div>
      ))}
    </div>
  </Section>
) : null}
```

No renderizar empty “Sin movimientos” para este bloque.

- [ ] **Step 2: Grid dos columnas zona | iglesia**

Reemplazar el `lg:grid-cols-3` actual por:

```tsx
<div className="grid gap-4 lg:grid-cols-2">
  <Section
    title="Por zona"
    description="Pulsa una zona para ver sus iglesias."
  >
    {byZone.length === 0 ? (
      <EmptyState title="Sin datos" />
    ) : (
      <ul className="max-h-[32rem] divide-y divide-border overflow-y-auto rounded-lg border border-border bg-white">
        {byZone.map((row) => {
          const active = selectedZoneId === row.key;
          const owes = row.remainingClp > 0;
          return (
            <li key={row.key}>
              <button
                type="button"
                onClick={() =>
                  setSelectedZoneId((prev) =>
                    prev === row.key ? null : row.key
                  )
                }
                className={cn(
                  "w-full px-3 py-2.5 text-left transition-colors",
                  active
                    ? "bg-violet-50 ring-1 ring-inset ring-violet-200"
                    : "hover:bg-background-soft"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">
                    {formatZoneLabel(row.key)}
                  </p>
                  <PayBadge owes={owes} />
                </div>
                <AmountInline
                  expectedClp={row.expectedClp}
                  collectedClp={row.collectedClp}
                  remainingClp={row.remainingClp}
                  count={row.count}
                  emphasizeRemaining
                />
              </button>
            </li>
          );
        })}
      </ul>
    )}
  </Section>

  <Section
    title={
      selectedZoneId
        ? `Iglesias · ${formatZoneLabel(selectedZoneId)}`
        : "Iglesias de la zona"
    }
    description={
      selectedZoneId
        ? `${churchesPending.length} con saldo · ${churchesInZone.length} iglesias`
        : "Elige una zona a la izquierda."
    }
  >
    {!selectedZoneId ? (
      <EmptyState title="Elige una zona" />
    ) : churchesInZone.length === 0 ? (
      <EmptyState title="Sin iglesias en esta zona" />
    ) : (
      <ul className="max-h-[32rem] divide-y divide-border overflow-y-auto rounded-lg border border-border bg-white">
        {churchesInZone.map((row) => {
          const owes = row.remainingClp > 0;
          return (
            <li
              key={row.key}
              className={cn("px-3 py-2.5", owes ? "bg-amber-50/70" : "bg-white")}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-foreground">{row.key}</p>
                {owes ? (
                  <PayBadge owes />
                ) : (
                  <span className="shrink-0 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-950">
                    Pagado
                  </span>
                )}
              </div>
              <AmountInline
                expectedClp={row.expectedClp}
                collectedClp={row.collectedClp}
                remainingClp={row.remainingClp}
                count={row.count}
                emphasizeRemaining
              />
            </li>
          );
        })}
      </ul>
    )}
  </Section>
</div>
```

- [ ] **Step 3: Verificar drill**

Sin pagos: no aparece “Por día”. Clic en Zona 01 → lista iglesias a la derecha; toggle deselecciona. Badges legibles.

---

### Task 4: Movimientos en columnas + verificación final

**Files:**
- Modify: `src/components/admin/congress/cash/CashBoxView.tsx`

**Interfaces:**
- Consumes: `cashBox.rows`, `canVoid`, `voidReason`, `onVoid`, `voidingId`
- Produces: listado columnar; sin cambio de contrato void

- [ ] **Step 1: Filas de movimientos legibles**

Reemplazar la sección Movimientos:

```tsx
<Section title="Movimientos">
  {canVoid ? (
    <Input
      className="mb-3 max-w-md"
      label="Motivo de anulación"
      value={voidReason}
      onChange={(e) => onVoidReasonChange(e.target.value)}
    />
  ) : null}
  {cashBox.rows.length === 0 ? (
    <EmptyState title="Sin pagos" />
  ) : (
    <ul className="divide-y divide-border rounded-lg border border-border bg-white">
      {cashBox.rows.map((p) => (
        <li
          key={p._id}
          className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 text-sm"
        >
          <div className="grid min-w-0 flex-1 gap-1 sm:grid-cols-5 sm:items-center sm:gap-3">
            <span className="tabular-nums text-muted">{effectivePaidOn(p)}</span>
            <span>{paymentMethodLabel(normalizePaymentMethod(p.method))}</span>
            <span className="truncate font-medium">{p.payerName}</span>
            <span className="tabular-nums font-semibold">
              {formatClp(p.amountClp)}
            </span>
            <span className="text-muted">{p.status}</span>
          </div>
          {p.status === "posted" && canVoid ? (
            <Button
              size="sm"
              variant="outline"
              loading={voidingId === p._id}
              onClick={() => void onVoid(p._id)}
            >
              Anular
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  )}
</Section>
```

- [ ] **Step 2: Checklist de verificación en navegador**

En `/admin/portal/congreso-varones` → **Control de caja**:

1. Orden: Cierre → Recaudado → (día solo si hay) → Zona|Iglesia → Movimientos  
2. Sin movimientos: no hay panel vacío “Por día”  
3. Cierre: cifras grandes + chips; números coherentes con antes  
4. Zona → iglesia: filas densas, badges con contraste, selección violeta  
5. Movimientos: columnas legibles (o empty compacto)  
6. Responsive: estrechar ventana — secciones apilan; zonas arriba de iglesias  
7. Consola sin errores; anulación (si hay permiso y datos) sigue pidiendo motivo

- [ ] **Step 3: No commit** salvo petición explícita del usuario.

---

## Spec coverage (self-review)

| Spec | Task |
|------|------|
| Orden cierre → recaudado → día → zona\|iglesia → movimientos | 1–4 |
| Cierre héroe + chips | 1 |
| Recaudado filtros alineados + Total destacado | 2 |
| Día oculto / franja chips | 3 |
| Filas densas zona/iglesia + badges | 3 |
| Movimientos columnas | 4 |
| Sin cambios dominio/API | Global + file map |
| Sin commit automático | Task 4 Step 3 |
