"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ConfirmOptions } from "@/components/admin/kit/hooks/useConfirmDialog";
import { formatAbsenceContactDate } from "@/lib/student-affairs/absence-contact-labels";
import {
  buildDropoutConfirmDescription,
  formatDropoutClosedAt,
  validateDropoutNotes,
  willDropoutOverridePendingCase,
  DROPOUT_NOTES_MIN_LENGTH,
} from "@/lib/student-affairs/participant-closure";
import type { AbsenceListCategory } from "@/lib/student-affairs/absence-categories";
import { absenceCategoryLabel } from "@/lib/student-affairs/absence-categories";
import type { ExperienceFormSubmission } from "@/types/experience-forms";
import { cn } from "@/lib/utils";

function DrawerHint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted">{children}</p>;
}

export function DropoutRecordCard({ submission }: { submission: ExperienceFormSubmission }) {
  const review = submission.absenceReview;
  const closedAt = formatDropoutClosedAt(review?.closedAt);

  return (
    <div className="rounded-xl border border-border bg-background-muted/40 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">Baja institucional</p>
      <p className="mt-2 text-sm font-semibold text-foreground">Desertor</p>
      {review?.closureNotes ? (
        <p className="mt-2 text-sm text-foreground">{review.closureNotes}</p>
      ) : null}
      <dl className="mt-3 space-y-1 text-xs text-muted">
        {review?.closedByName ? (
          <div>
            <span className="font-medium">Registrado por:</span> {review.closedByName}
          </div>
        ) : null}
        {closedAt ? (
          <div>
            <span className="font-medium">Fecha:</span> {closedAt}
          </div>
        ) : null}
      </dl>
    </div>
  );
}

interface DropoutClosureFormProps {
  participantName: string;
  absenceCategory: AbsenceListCategory | null;
  busy?: boolean;
  contactHint?: boolean;
  onConfirm: (options: ConfirmOptions) => Promise<boolean>;
  onSubmit: (notes: string) => Promise<{ ok: true } | { ok: false; error: string }>;
}

export function DropoutClosureForm({
  participantName,
  absenceCategory,
  busy = false,
  contactHint = false,
  onConfirm,
  onSubmit,
}: DropoutClosureFormProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const validation = validateDropoutNotes(notes);
  const canSubmit = validation.ok;

  const handleSubmit = async () => {
    const parsed = validateDropoutNotes(notes);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    const currentStatusLabel = absenceCategory
      ? absenceCategoryLabel(absenceCategory)
      : "Sin estado de inasistencia";
    const ok = await onConfirm({
      title: "Marcar como desertor",
      description: buildDropoutConfirmDescription({
        participantName,
        currentStatusLabel,
        overridesPending: willDropoutOverridePendingCase(absenceCategory),
      }),
      confirmLabel: "Cerrar como desertor",
      destructive: true,
    });
    if (!ok) return;

    setSaving(true);
    setError(null);
    const result = await onSubmit(parsed.normalized);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNotes("");
    setOpen(false);
  };

  return (
    <div className="rounded-xl border border-[var(--state-warning-border)] bg-[var(--state-warning-bg)]/40">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-foreground">Cerrar expediente</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted transition", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="space-y-3 border-t border-[var(--state-warning-border)] px-4 pb-4 pt-3">
          <DrawerHint>
            {contactHint
              ? "Si confirmó la deserción en un contacto, use el resultado «Alumno desertor» al registrar la gestión."
              : "Use esta acción cuando la baja institucional ya está confirmada y no corresponde seguir el flazo de justificación."}
          </DrawerHint>
          <p className="text-xs text-[var(--color-warning)]">
            Acción irreversible: el participante quedará como <strong>Desertor</strong> y saldrá de
            las listas de gestión pendiente.
          </p>
          <Textarea
            label="Antecedente de deserción"
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              setError(null);
            }}
            placeholder="Ej.: Desertó en 2025; pastor titular confirmó baja institucional por cambio de ciudad."
            rows={3}
          />
          <p className="text-xs text-muted">
            Mínimo {DROPOUT_NOTES_MIN_LENGTH} caracteres con contexto (año, acuerdo o fuente).
          </p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button
            variant="outline"
            className="w-full border-[var(--state-danger-border)] text-[var(--color-danger)] hover:bg-[var(--state-danger-bg)]"
            loading={saving}
            disabled={busy || saving || !canSubmit}
            onClick={() => void handleSubmit()}
          >
            Marcar como desertor
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function ContactLogDropoutHint({ contactedAt }: { contactedAt?: string }) {
  if (!contactedAt) return null;
  return (
    <p className="text-xs text-muted">
      Última gestión: {formatAbsenceContactDate(contactedAt)}
    </p>
  );
}
