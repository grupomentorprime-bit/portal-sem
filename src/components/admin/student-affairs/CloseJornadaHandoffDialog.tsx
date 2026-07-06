"use client";

import { Dialog } from "@/components/admin/kit/dialogs/Dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, ClipboardCheck } from "lucide-react";

interface HandoffStat {
  label: string;
  value: number;
  tone?: "success" | "warning" | "info" | "neutral";
}

export interface CloseJornadaHandoffDialogProps {
  open: boolean;
  loading?: boolean;
  checkedInCount: number;
  expectedAttendees: number;
  arrivalPct: number;
  pendingArrival: number;
  pendingReview: number;
  unclosedCount: number;
  pendingEmail: number;
  awaitingJustification: number;
  onClose: () => void;
  onConfirm: () => void;
}

function HandoffStatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: HandoffStat["tone"];
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5",
        tone === "success" && "border-[color-mix(in_srgb,var(--color-success)_28%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-success)_8%,white)]",
        tone === "warning" && "border-[color-mix(in_srgb,var(--color-warning)_28%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-warning)_8%,white)]",
        tone === "info" && "border-[color-mix(in_srgb,var(--color-primary)_22%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-primary)_6%,white)]",
        tone === "neutral" && "border-border bg-background-muted/40"
      )}
    >
      <p className="text-[11px] font-medium leading-snug text-muted">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-xl font-bold tabular-nums",
          tone === "success" && "text-[var(--state-success-fg)]",
          tone === "warning" && "text-[var(--state-warning-fg)]",
          tone === "info" && "text-[var(--state-info-fg)]",
          tone === "neutral" && "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function getArrivalBarClass(pct: number): string {
  if (pct >= 90) return "student-affairs-jornada__progress-fill--complete";
  if (pct >= 70) return "student-affairs-jornada__progress-fill--good";
  if (pct >= 40) return "student-affairs-jornada__progress-fill--warning";
  return "student-affairs-jornada__progress-fill--low";
}

export function CloseJornadaHandoffDialog({
  open,
  loading = false,
  checkedInCount,
  expectedAttendees,
  arrivalPct,
  pendingArrival,
  pendingReview,
  unclosedCount,
  pendingEmail,
  awaitingJustification,
  onClose,
  onConfirm,
}: CloseJornadaHandoffDialogProps) {
  const followUpStats: HandoffStat[] = (
    [
      { label: "Por revisar (excusas)", value: pendingReview, tone: "info" as const },
      { label: "Sin registrar ni justificar", value: unclosedCount, tone: "warning" as const },
      { label: "Pendiente contacto", value: pendingEmail, tone: "neutral" as const },
      { label: "Plazo justificación", value: awaitingJustification, tone: "neutral" as const },
    ] satisfies HandoffStat[]
  ).filter((item) => item.value > 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Cerrar jornada y entregar informe"
      description="Finaliza el registro de asistencia presencial y entrega el caso a Asuntos Estudiantiles."
      size="md"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-background-muted/30 p-4">
          <div className="mb-3 flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--color-success)_14%,white)] text-[var(--state-success-fg)]">
              <ClipboardCheck className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">
                Resumen presencial
              </p>
              <p className="mt-1 text-sm text-foreground">
                <span className="text-2xl font-bold tabular-nums">{checkedInCount}</span>
                {expectedAttendees > 0 ? (
                  <span className="text-muted"> / {expectedAttendees} asistieron</span>
                ) : null}
                {expectedAttendees > 0 ? (
                  <span className="ml-2 text-sm font-semibold text-[var(--state-success-fg)]">
                    ({arrivalPct}%)
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          {expectedAttendees > 0 ? (
            <div className="student-affairs-jornada__progress-track h-2">
              <div
                className={cn("student-affairs-jornada__progress-fill", getArrivalBarClass(arrivalPct))}
                style={{ width: `${arrivalPct}%` }}
              />
            </div>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <HandoffStatCard
              label="Asistieron"
              value={checkedInCount}
              tone="success"
            />
            {pendingArrival > 0 ? (
              <HandoffStatCard
                label="Sin asistir (confirmados)"
                value={pendingArrival}
                tone="warning"
              />
            ) : null}
          </div>
        </div>

        {followUpStats.length > 0 ? (
          <div className="rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_22%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-primary)_5%,white)] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              Pasa a Asuntos Estudiantiles
            </div>
            <div className="grid grid-cols-2 gap-2">
              {followUpStats.map((item) => (
                <HandoffStatCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  tone={item.tone}
                />
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Revisión de excusas, contacto a inasistentes y cierre de quienes no completaron el
              formulario.
            </p>
          </div>
        ) : null}

        <p className="text-xs text-muted">
          Después del cierre no podrá marcar asistencia presencial. Asuntos Estudiantiles continúa
          desde este mismo panel.
        </p>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" loading={loading} disabled={loading} onClick={onConfirm}>
            Cerrar jornada
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
