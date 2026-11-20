"use client";

import { activeChargeConsideration } from "@/core/congress/charge";
import { isGroupPaymentSelectable } from "@/core/congress/finance-status";
import type { CongressPayment, CongressRegistration } from "@/core/congress/types";
import { cn } from "@/lib/utils";
import {
  formatClp,
  groupRosterStatusText,
  paymentMethodLabel,
  registrationDisplayName,
  registrationRoleBadges,
} from "@/components/admin/congress/labels";
import { Button } from "@/components/ui/button";

type Props = {
  candidates: CongressRegistration[];
  payments: CongressPayment[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSetSelected: (ids: string[]) => void;
  churchChosen: boolean;
  highlightId?: string | null;
  onDownloadExemptions?: (people: CongressRegistration[]) => void;
};

function statusTone(text: string): string {
  if (text.startsWith("Ya pagó")) return "text-[var(--growth-os-success)]";
  if (text.startsWith("Exento")) return "text-primary";
  if (text.startsWith("Abono")) return "text-[var(--color-warning)]";
  return "text-muted";
}

function paymentLines(reg: CongressRegistration, payments: CongressPayment[]): string[] {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const payment of payments) {
    if (payment.status !== "posted" || seen.has(payment._id)) continue;
    const share = payment.allocations.find((row) => row.registrationId === reg._id);
    if (!share) continue;
    seen.add(payment._id);
    const parts = [
      formatClp(share.amountClp),
      paymentMethodLabel(payment.method),
      payment.bank?.trim() || "",
      payment.paidOn || "",
      payment.payerName?.trim() || "",
      payment.note?.trim() || "",
    ].filter(Boolean);
    lines.push(parts.join(" · "));
  }
  const note = activeChargeConsideration(reg);
  if (note && !note.total) {
    lines.push(`No paga ${formatClp(note.unpaidClp)} · ${note.reason}`);
  }
  const paid = Math.max(0, Math.trunc(reg.allocatedPaidClp));
  if (lines.length === 0 && paid > 0) lines.push(formatClp(paid));
  return lines;
}

export function GroupPaymentRoster({
  candidates,
  payments,
  selectedIds,
  onToggle,
  onSetSelected,
  churchChosen,
  highlightId,
  onDownloadExemptions,
}: Props) {
  const unique = new Map<string, CongressRegistration>();
  for (const row of candidates) unique.set(row._id, row);
  const sorted = [...unique.values()].sort((a, b) =>
    registrationDisplayName(a).localeCompare(registrationDisplayName(b), "es")
  );
  const due = sorted.filter((row) => {
    const status = groupRosterStatusText(row);
    return !status.startsWith("Exento") && status !== "Ya pagó";
  });
  const paid = sorted.filter((row) => groupRosterStatusText(row) === "Ya pagó");
  const exempt = sorted.filter((row) => groupRosterStatusText(row).startsWith("Exento"));
  const selectableIds = due.filter(isGroupPaymentSelectable).map((row) => row._id);
  const selected = new Set(selectedIds);
  const allPendingSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  const sections = [
    { id: "due", title: "Deben", rows: due },
    { id: "paid", title: "Ya pagaron", rows: paid },
    { id: "exempt", title: "Exentos", rows: exempt },
  ].filter((section) => section.rows.length > 0);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-border bg-white">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border px-3 py-2">
        <p className="text-sm font-semibold text-foreground">Nómina</p>
        <p className="text-xs text-muted">
          {churchChosen
            ? `${selectableIds.length} deben · ${paid.length} ya pagaron · ${exempt.length} exentos`
            : "Elija zona e iglesia"}
        </p>
        {churchChosen && selectableIds.length > 1 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onSetSelected(allPendingSelected ? [] : selectableIds)}
          >
            {allPendingSelected ? "Quitar marcas" : "Marcar todos"}
          </Button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {!churchChosen ? (
          <p className="px-1 py-2 text-xs text-muted">Sin nómina todavía.</p>
        ) : sorted.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted">Sin participantes en esa iglesia.</p>
        ) : (
          <div className="space-y-3">
            {sections.map((section) => (
              <section key={section.id}>
                <div className="flex items-center justify-between gap-2 px-1 pb-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    {section.title} · {section.rows.length}
                  </p>
                  {section.id === "exempt" && onDownloadExemptions ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onDownloadExemptions(section.rows)}
                    >
                      Comprobante
                    </Button>
                  ) : null}
                </div>
                <ul className="grid grid-cols-1 gap-1 xl:grid-cols-2">
                  {section.rows.map((row) => {
                    const selectable = isGroupPaymentSelectable(row);
                    const checked = selectable && selected.has(row._id);
                    const status = groupRosterStatusText(row);
                    const roles = registrationRoleBadges(row);
                    const details = paymentLines(row, payments);
                    return (
                      <li key={row._id}>
                        <label
                          className={cn(
                            "flex min-w-0 items-start gap-2 rounded-md border border-transparent px-2 py-1.5 text-sm",
                            selectable ? "hover:bg-background-soft" : "bg-background-soft/70",
                            highlightId === row._id && "border-primary"
                          )}
                        >
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={checked}
                            disabled={!selectable}
                            onChange={() => {
                              if (!selectable) return;
                              onToggle(row._id);
                            }}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-foreground">
                              {registrationDisplayName(row)}
                              {roles.length ? (
                                <span className="font-normal text-muted">
                                  {" "}
                                  · {roles.join(" · ")}
                                </span>
                              ) : null}
                            </span>
                            <span className={cn("block text-xs font-semibold", statusTone(status))}>
                              {status}
                            </span>
                            {details.map((line) => (
                              <span key={line} className="block truncate text-xs text-muted">
                                {line}
                              </span>
                            ))}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
