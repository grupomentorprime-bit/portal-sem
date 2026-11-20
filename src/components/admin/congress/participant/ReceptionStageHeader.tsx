"use client";

import { Button } from "@/components/ui/button";
import {
  receptionPrimaryAction,
  type ReceptionProgress,
  type ReceptionStepId,
  type ReceptionStepState,
} from "@/core/congress/reception-stage";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Bed,
  Check,
  Circle,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

const STEP_LABEL: Record<ReceptionStepId, string> = {
  asistencia: "Asistencia",
  alojamiento: "Alojamiento",
};

const STEP_ICON: Record<ReceptionStepId, LucideIcon> = {
  asistencia: UserCheck,
  alojamiento: Bed,
};

const STATE_LABEL = {
  ahora: "Ahora",
  pendiente: "Pendiente",
  listo: "Listo",
  bloqueado: "Bloqueado",
} as const;

type Props = {
  progress: ReceptionProgress;
  viewStep: ReceptionStepId;
  operate: boolean;
  busy: boolean;
  onViewStep: (step: ReceptionStepId) => void;
  onPrimary: () => void;
};

export function ReceptionStageHeader({
  progress,
  viewStep,
  operate,
  busy,
  onViewStep,
  onPrimary,
}: Props) {
  const action = receptionPrimaryAction(viewStep, progress.steps);
  const steps = Object.keys(STEP_LABEL) as ReceptionStepId[];

  return (
    <div className="space-y-3">
      <p
        className={cn(
          "inline-flex rounded-full px-3 py-1 text-sm font-extrabold",
          progress.stage === "listo"
            ? "bg-[color-mix(in_srgb,var(--growth-os-success)_16%,white)] text-[var(--growth-os-success)]"
            : "bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] text-primary"
        )}
        role="status"
      >
        {progress.stageLabel}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {steps.map((step) => {
          const state = progress.steps[step];
          const cellClassName = cn(
            "rounded-md border px-2 py-2 text-left",
            state === "listo"
              ? "border-[color-mix(in_srgb,var(--growth-os-success)_45%,white)] bg-[color-mix(in_srgb,var(--growth-os-success)_10%,white)]"
              : viewStep === step
                ? "border-primary bg-[color-mix(in_srgb,var(--color-primary)_8%,white)]"
                : "border-border bg-white"
          );
          const labels = <StepFace step={step} state={state} />;

          if (!operate) {
            return (
              <div key={step} className={cellClassName}>
                {labels}
              </div>
            );
          }

          return (
            <button
              key={step}
              type="button"
              onClick={() => onViewStep(step)}
              className={cellClassName}
            >
              {labels}
            </button>
          );
        })}
      </div>
      {operate ? (
        <div>
          <Button
            type="button"
            variant={action.enabled ? "primary" : "outline"}
            disabled={busy || !action.enabled}
            onClick={onPrimary}
          >
            {action.kind === "close" ? (
              <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
            ) : (
              <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
            )}
            {action.label}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function StepFace({
  step,
  state,
}: {
  step: ReceptionStepId;
  state: ReceptionStepState;
}) {
  const Icon = STEP_ICON[step];
  const ready = state === "listo";
  const current = state === "ahora";
  return (
    <span className="flex items-center gap-2">
      <span
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-md",
          ready
            ? "bg-[color-mix(in_srgb,var(--growth-os-success)_16%,white)] text-[var(--growth-os-success)]"
            : current
              ? "bg-[color-mix(in_srgb,var(--color-primary)_14%,white)] text-primary"
              : "bg-background-soft text-muted"
        )}
      >
        <Icon className="h-7 w-7" strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{STEP_LABEL[step]}</span>
        <span
          className={cn(
            "flex items-center gap-1 text-xs",
            ready
              ? "font-semibold text-[var(--growth-os-success)]"
              : current
                ? "font-semibold text-primary"
                : "text-muted"
          )}
        >
          {ready ? (
            <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          ) : (
            <Circle className="h-4 w-4" strokeWidth={2} aria-hidden />
          )}
          {STATE_LABEL[state]}
        </span>
      </span>
    </span>
  );
}
