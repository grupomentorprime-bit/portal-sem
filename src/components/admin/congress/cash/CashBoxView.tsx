"use client";

import { useMemo, useState } from "react";
import {
  ActionMenu,
  ActionMenuItem,
  AlertBanner,
  Dialog,
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
import {
  PaymentCorrectionFields,
  type PaymentCorrectionPatch,
} from "@/components/admin/congress/cash/PaymentCorrectionFields";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  breakdownContributionsByChurch,
  breakdownContributionsByZone,
  breakdownPaymentsByPaidOn,
  normalizePaymentMethod,
  reconcilePostedAllocationsWithCollected,
  summarizeCashBox,
  summarizeContributionClose,
  type CashMethodKey,
  type ContributionGroupRow,
} from "@/core/congress/cash-box";
import {
  foldCongressChurchBase,
  formatCongressChurchLabel,
} from "@/core/congress/church-name";
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

function paymentPlace(
  payment: CongressPayment,
  registrations: CongressRegistration[]
): { zone: string; church: string } {
  const byId = new Map(registrations.map((row) => [row._id, row]));
  const zones = new Set<string>();
  const churches = new Set<string>();
  for (const allocation of payment.allocations) {
    const reg = byId.get(allocation.registrationId);
    if (!reg) continue;
    if (reg.zoneId.trim()) zones.add(formatZoneLabel(reg.zoneId));
    if (reg.churchName?.trim()) churches.add(formatCongressChurchLabel(reg.churchName));
  }
  if (churches.size === 0 && payment.churchName?.trim()) {
    churches.add(formatCongressChurchLabel(payment.churchName));
  }
  return {
    zone: zones.size > 0 ? [...zones].join(", ") : "Sin zona",
    church: churches.size > 0 ? [...churches].join(", ") : "Sin iglesia",
  };
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
  onVoid: (paymentId: string, reason: string) => void | Promise<boolean | void>;
  onRevisePayment?: (paymentId: string, patch: PaymentCorrectionPatch) => Promise<boolean>;
  onRestorePayment?: (paymentId: string) => Promise<boolean>;
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
  onDownloadReceipt?: (payment: CongressPayment) => void;
  view: "close" | "movements";
};

export function CashBoxView({
  payments,
  registrations,
  loading,
  error,
  canVoid,
  voidReason: _voidReason,
  onVoidReasonChange: _onVoidReasonChange,
  voidingId,
  onVoid,
  onRevisePayment,
  onRestorePayment,
  methodFilter,
  onMethodFilterChange,
  fromPaidOn,
  onFromPaidOnChange,
  toPaidOn,
  onToPaidOnChange,
  statusFilter,
  onStatusFilterChange,
  onOpenGroupPayment,
  onDownloadReceipt,
  view,
}: Props) {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [voidTarget, setVoidTarget] = useState<CongressPayment | null>(null);
  const [confirmReason, setConfirmReason] = useState("");
  const [restoreTargetId, setRestoreTargetId] = useState<string | null>(null);

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

  const reconcile = useMemo(
    () => reconcilePostedAllocationsWithCollected(payments, registrations),
    [payments, registrations]
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
      {view === "close" ? (
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
          <div
            className={cn(
              "mt-4 rounded-md border px-3 py-2 text-sm",
              reconcile.deltaClp === 0
                ? "border-success/30 bg-success/10"
                : "border-warning/40 bg-warning/10"
            )}
          >
            <p className="font-medium text-foreground">
              Cuadre movimientos ↔ fichas
              {reconcile.deltaClp === 0 ? " · OK" : " · Descuadre"}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              Imputado en movimientos {formatClp(reconcile.movementsAllocatedClp)} ·
              Cobrado en fichas {formatClp(reconcile.collectedClp)}
              {reconcile.deltaClp !== 0
                ? ` · Δ ${formatClp(reconcile.deltaClp)}`
                : ""}
            </p>
          </div>
        </div>
      </Section>
      ) : null}

      {view === "movements" ? (
      <>
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
                { value: "unclassified", label: "Sin medio" },
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
                ["Sin medio", totalsClp.unclassified, false],
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
      </>
      ) : null}

      {view === "close" ? (
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
      ) : null}

      {view === "movements" ? (
      <Section title="Movimientos">
        {cashBox.rows.length === 0 ? (
          <EmptyState title="Sin pagos" />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-white">
            {cashBox.rows.map((p) => {
              const place = paymentPlace(p, registrations);
              const canEdit = canVoid && Boolean(onRevisePayment);
              const canCancel = p.status === "posted" && canVoid;
              const canRestore = p.status === "voided" && canVoid && Boolean(onRestorePayment);
              return (
              <li key={p._id} className="space-y-2 px-3 py-2.5 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="grid min-w-0 flex-1 gap-1 sm:grid-cols-6 sm:items-center sm:gap-3">
                  <span className="tabular-nums text-muted">
                    {effectivePaidOn(p)}
                  </span>
                  <span className="min-w-0">
                    <span className="block">
                      {paymentMethodLabel(normalizePaymentMethod(p.method))}
                      {p.bank?.trim() ? ` · ${p.bank.trim()}` : ""}
                    </span>
                    {p.note?.trim() ? (
                      <span className="block truncate text-xs text-muted">{p.note.trim()}</span>
                    ) : null}
                  </span>
                  <span className="truncate font-medium">{p.payerName}</span>
                  <span className="min-w-0">
                    <span className="block truncate">{place.zone}</span>
                    <span className="block truncate text-xs text-muted">{place.church}</span>
                  </span>
                  <span className="tabular-nums font-semibold">
                    {formatClp(p.amountClp)}
                  </span>
                  <span className="text-muted">
                    {p.status === "voided" ? "Anulado" : "Vigente"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {onDownloadReceipt ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDownloadReceipt(p)}
                    >
                      Comprobante
                    </Button>
                  ) : null}
                  {canEdit || canCancel || canRestore ? (
                    <ActionMenu label={`Acciones de ${p.payerName}`}>
                      {canEdit ? (
                        <ActionMenuItem
                          onClick={() =>
                            setEditingPaymentId((current) => (current === p._id ? null : p._id))
                          }
                        >
                          Modificar
                        </ActionMenuItem>
                      ) : null}
                      {canRestore ? (
                        <ActionMenuItem onClick={() => setRestoreTargetId(p._id)}>
                          Dejar vigente
                        </ActionMenuItem>
                      ) : null}
                      {canCancel ? (
                        <ActionMenuItem
                          destructive
                          onClick={() => {
                            setConfirmReason("");
                            setVoidTarget(p);
                          }}
                        >
                          Anular
                        </ActionMenuItem>
                      ) : null}
                    </ActionMenu>
                  ) : null}
                </div>
                </div>
                {editingPaymentId === p._id && onRevisePayment ? (
                  <PaymentCorrectionFields
                    payment={p}
                    busy={voidingId === p._id}
                    onCancel={() => setEditingPaymentId(null)}
                    onSave={async (patch) => {
                      const ok = await onRevisePayment(p._id, patch);
                      if (ok) setEditingPaymentId(null);
                      return ok;
                    }}
                  />
                ) : null}
              </li>
              );
            })}
          </ul>
        )}
        <Dialog
          open={voidTarget != null}
          onClose={() => setVoidTarget(null)}
          title="Anular pago"
          description={
            voidTarget
              ? `${voidTarget.payerName} · ${formatClp(voidTarget.amountClp)}. El monto vuelve al saldo de quien estaba imputado.`
              : undefined
          }
          size="sm"
        >
          <div className="space-y-4">
            <Input
              label="Motivo"
              value={confirmReason}
              onChange={(event) => setConfirmReason(event.target.value)}
              helper="Mínimo 5 caracteres."
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setVoidTarget(null)}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={voidTarget != null && voidingId === voidTarget._id}
                disabled={confirmReason.trim().length < 5}
                onClick={() => {
                  if (!voidTarget) return;
                  const reason = confirmReason.trim();
                  const paymentId = voidTarget._id;
                  void Promise.resolve(onVoid(paymentId, reason)).then((ok) => {
                    if (ok === false) return;
                    setVoidTarget(null);
                    setConfirmReason("");
                  });
                }}
              >
                Anular
              </Button>
            </div>
          </div>
        </Dialog>
        <Dialog
          open={restoreTargetId != null}
          onClose={() => setRestoreTargetId(null)}
          title="Dejar el pago vigente"
          description="El comprobante vuelve a contar en la caja y en los saldos."
          size="sm"
        >
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRestoreTargetId(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              loading={restoreTargetId != null && voidingId === restoreTargetId}
              onClick={() => {
                if (!restoreTargetId || !onRestorePayment) return;
                const paymentId = restoreTargetId;
                void onRestorePayment(paymentId).then((ok) => {
                  if (ok) setRestoreTargetId(null);
                });
              }}
            >
              Confirmar
            </Button>
          </div>
        </Dialog>
      </Section>
      ) : null}
    </div>
  );
}
