"use client";

import { cn } from "@/lib/utils";
import { formatClosureDateTime } from "@/lib/student-affairs/closure-datetime";
import { FileCheck, ShieldCheck, UserRound } from "lucide-react";
import type { HandoffValidationStatus } from "@/types/student-affairs-operations";
import type { ReactNode } from "react";

export interface OperationsClosureRecordProps {
  closedByName?: string;
  closedAt?: string;
  validatedByName?: string;
  validatedAt?: string;
  validationStatus?: HandoffValidationStatus | null;
  className?: string;
  compact?: boolean;
}

export function OperationsClosureRecord({
  closedByName,
  closedAt,
  validatedByName,
  validatedAt,
  validationStatus,
  className,
  compact = false,
}: OperationsClosureRecordProps) {
  if (!closedByName && !closedAt) return null;

  const when = closedAt ? formatClosureDateTime(closedAt) : null;
  const validatedWhen = validatedAt ? formatClosureDateTime(validatedAt) : null;
  const operator = closedByName?.trim() || "—";
  const validator = validatedByName?.trim() || "—";

  return (
    <div
      className={cn(
        "rounded-lg border border-[color-mix(in_srgb,var(--color-success)_28%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-success)_6%,white)]",
        compact ? "p-3" : "p-4",
        className
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
        Registro de cierre e informe
      </p>

      <div className={cn("mt-3 grid gap-3", compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4")}>
        <ClosureField
          icon={<UserRound className="h-4 w-4" aria-hidden />}
          label="Cerrado por"
          value={operator}
        />
        <ClosureField
          icon={<FileCheck className="h-4 w-4" aria-hidden />}
          label="Informe gestionado por"
          value={operator}
        />
        <ClosureField label="Fecha" value={when?.dateLabel ?? "—"} />
        <ClosureField label="Hora" value={when?.timeLabel ?? "—"} />
      </div>

      {validationStatus ? (
        <div className="mt-3 rounded-md border border-border bg-background/70 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Validación del informe
          </p>
          {validationStatus === "validated" ? (
            <p className="mt-1 text-sm text-foreground">
              Validado por <span className="font-semibold">{validator}</span>
              {validatedWhen ? (
                <span className="text-muted"> · {validatedWhen.fullLabel}</span>
              ) : null}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">
              Pendiente de validación por encargado de gestión.
            </p>
          )}
        </div>
      ) : null}

      {!compact && when ? (
        <p className="mt-3 text-xs text-muted">
          Entrega registrada: <span className="font-medium text-foreground">{when.fullLabel}</span>
        </p>
      ) : null}
    </div>
  );
}

function ClosureField({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-semibold text-foreground" title={value}>
        {value}
      </p>
    </div>
  );
}
