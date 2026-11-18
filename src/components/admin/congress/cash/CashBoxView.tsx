"use client";

import { useMemo, useState } from "react";
import {
  AlertBanner,
  EmptyState,
  LoadingState,
  Section,
} from "@/components/admin/kit";
import {
  formatClp,
  formatZoneLabel,
  paymentMethodLabel,
} from "@/components/admin/congress/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  breakdownContributionsByChurch,
  breakdownContributionsByZone,
  breakdownPaymentsByPaidOn,
  normalizePaymentMethod,
  summarizeCashBox,
  summarizeContributionClose,
  type CashMethodKey,
  type ContributionGroupRow,
} from "@/core/congress/cash-box";
import { foldCongressChurchBase } from "@/core/congress/church-name";
import { effectivePaidOn } from "@/core/congress/payment-dates";
import type {
  CongressPayment,
  CongressRegistration,
} from "@/core/congress/types";
import { cn } from "@/lib/utils";

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
    <span className="shrink-0 rounded-md bg-warning/20 px-2 py-0.5 text-xs font-semibold text-warning">
      Falta pagar
    </span>
  ) : (
    <span className="shrink-0 rounded-md bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
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
                ? "text-warning"
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

function sortZonesNumeric(rows: ContributionGroupRow[]): ContributionGroupRow[] {
  return [...rows].sort((a, b) => {
    const na = Number(a.key.match(/(\d+)/)?.[1] ?? Number.NaN);
    const nb = Number(b.key.match(/(\d+)/)?.[1] ?? Number.NaN);
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
    return a.key.localeCompare(b.key);
  });
}

type Props = {
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
  onOpenGroupPayment?: (input: {
    zoneId: string;
    churchBaseKey: string;
  }) => void;
};

export function CashBoxView({
  payments,
  registrations,
  loading,
  error,
  canVoid,
  voidReason,
  onVoidReasonChange,
  voidingId,
  onVoid,
  methodFilter,
  onMethodFilterChange,
  fromPaidOn,
  onFromPaidOnChange,
  toPaidOn,
  onToPaidOnChange,
  statusFilter,
  onStatusFilterChange,
  onOpenGroupPayment,
}: Props) {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      method: methodFilter,
      fromPaidOn: fromPaidOn || undefined,
      toPaidOn: toPaidOn || undefined,
      status: statusFilter,
    }),
    [methodFilter, fromPaidOn, toPaidOn, statusFilter]
  );

  const cashBox = useMemo(
    () => summarizeCashBox(payments, filters),
    [payments, filters]
  );

  const close = useMemo(
    () => summarizeContributionClose(registrations),
    [registrations]
  );

  const byDay = useMemo(
    () => breakdownPaymentsByPaidOn(payments, filters),
    [payments, filters]
  );

  const byZone = useMemo(
    () => sortZonesNumeric(breakdownContributionsByZone(registrations)),
    [registrations]
  );

  const churchesInZone = useMemo(() => {
    if (!selectedZoneId) return [];
    const regs = registrations.filter((r) => r.zoneId === selectedZoneId);
    return breakdownContributionsByChurch(regs);
  }, [registrations, selectedZoneId]);

  const churchesPending = useMemo(
    () => churchesInZone.filter((row) => row.remainingClp > 0),
    [churchesInZone]
  );

  if (loading) return <LoadingState variant="cards" />;
  if (error) return <AlertBanner variant="warning">{error}</AlertBanner>;

  const { totalsClp } = cashBox;

  return (
    <div className="space-y-6">
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
              <p className="mt-1 tabular-nums text-2xl font-bold text-warning">
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
                    ? "border-primary/25 bg-primary/5"
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
                          ? "bg-primary/10 ring-1 ring-inset ring-primary/20"
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
                  <li key={row.key}>
                    <button
                      type="button"
                      className={cn(
                        "w-full px-3 py-2.5 text-left transition-colors",
                        owes
                          ? "bg-warning/10 hover:bg-warning/15"
                          : "bg-white hover:bg-background-soft",
                        onOpenGroupPayment
                          ? "cursor-pointer"
                          : "cursor-default"
                      )}
                      onClick={() => {
                        if (!selectedZoneId || !onOpenGroupPayment) return;
                        onOpenGroupPayment({
                          zoneId: selectedZoneId,
                          churchBaseKey: foldCongressChurchBase(row.key),
                        });
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-foreground">{row.key}</p>
                        {owes ? (
                          <PayBadge owes />
                        ) : (
                          <span className="shrink-0 rounded-md bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
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
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>

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
                  <span className="tabular-nums text-muted">
                    {effectivePaidOn(p)}
                  </span>
                  <span>
                    {paymentMethodLabel(normalizePaymentMethod(p.method))}
                  </span>
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
    </div>
  );
}
