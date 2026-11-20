"use client";

import { Button } from "@/components/ui/button";
import {
  receptionPrimaryAction,
  type ReceptionProgress,
  type ReceptionStepId,
} from "@/core/congress/reception-stage";
import { cn } from "@/lib/utils";

const STEP_LABEL: Record<ReceptionStepId, string> = {
  asistencia: "Asistencia",
  alimentacion: "Alimentación",
  alojamiento: "Alojamiento",
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
            : "bg-primary text-text-inverse"
        )}
        role="status"
      >
        {progress.stageLabel}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {steps.map((step) => {
          const state = progress.steps[step];
          const openable = state !== "pendiente";
          const cellClassName = cn(
            "rounded-md border px-2 py-2 text-left",
            viewStep === step ? "border-primary" : "border-border",
            !openable && "opacity-50"
          );
          const labels = (
            <>
              <span className="block text-sm font-semibold">{STEP_LABEL[step]}</span>
              <span className="block text-xs text-muted">{STATE_LABEL[state]}</span>
            </>
          );

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
              disabled={!openable}
              onClick={() => {
                if (!openable) return;
                onViewStep(step);
              }}
              className={cellClassName}
            >
              {labels}
            </button>
          );
        })}
      </div>
      {operate ? (
        <Button type="button" disabled={busy || !action.enabled} onClick={onPrimary}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
