"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  absenceContactChannelLabel,
  absenceContactOutcomeLabel,
  formatAbsenceContactDate,
} from "@/lib/student-affairs/absence-contact-labels";
import { canSendJustificationRequest } from "@/lib/student-affairs/absence-categories";
import {
  getContactOutcomeOptions,
  isContactOutcomeValidForChannel,
  isFailedContactOutcomeForChannel,
  defaultContactOutcomeForChannel,
  contactNotesPlaceholder,
} from "@/lib/student-affairs/operator-contact-outcomes";
import {
  OPERATOR_CONTACT_CHANNEL_OPTIONS,
  type OperatorManualContactChannel,
} from "@/lib/student-affairs/operator-contact-channels";
import type {
  AbsenceContactLogEntry,
  AbsenceContactOutcome,
  ExperienceFormSubmission,
} from "@/types/experience-forms";

function GestionesExpedienteList({ entries }: { entries: AbsenceContactLogEntry[] }) {
  if (!entries.length) return null;
  return (
    <div className="space-y-2 rounded-xl border border-border bg-background-muted/30 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">Gestiones del expediente</p>
      <ul className="space-y-3">
        {entries.map((entry) => (
          <li key={entry.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-foreground">
                {absenceContactChannelLabel(entry.channel)}
              </span>
              <span className="text-muted">{formatAbsenceContactDate(entry.contactedAt)}</span>
              {entry.operatorName ? (
                <span className="text-muted">· {entry.operatorName}</span>
              ) : null}
            </div>
            {entry.email ? <p className="mt-0.5 text-xs text-muted">Correo: {entry.email}</p> : null}
            {entry.phone ? <p className="mt-0.5 text-xs text-muted">Tel.: {entry.phone}</p> : null}
            {entry.notes ? <p className="mt-1 text-sm text-foreground">{entry.notes}</p> : null}
            {entry.contactOutcome ? (
              <p className="mt-1 text-xs text-muted">
                {absenceContactOutcomeLabel(entry.contactOutcome, entry.channel)}
              </p>
            ) : null}
            {entry.startedJustificationDeadline ? (
              <p className="mt-1 text-xs text-primary">Inició plazo de 3 días para justificar</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface AbsenceContactDrawerProps {
  submission: ExperienceFormSubmission;
  onSaved: (submission: ExperienceFormSubmission) => void;
  onCancel: () => void;
}

export function AbsenceContactDrawer({
  submission,
  onSaved,
  onCancel,
}: AbsenceContactDrawerProps) {
  const submissionId = submission._id ?? "";
  const participantName = String(submission.data.name ?? submission.data.fullName ?? "Participante");
  const phone = String(submission.data.phone ?? "").trim();
  const canStartDeadline = canSendJustificationRequest(submission);
  const contacts = submission.absenceContactLog ?? [];

  const [channel, setChannel] = useState<OperatorManualContactChannel>("phone");
  const [notes, setNotes] = useState("");
  const [contactOutcome, setContactOutcome] = useState<AbsenceContactOutcome>("reached");
  const [startDeadline, setStartDeadline] = useState(canStartDeadline);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const outcomeOptions = getContactOutcomeOptions(channel);

  useEffect(() => {
    if (!isContactOutcomeValidForChannel(channel, contactOutcome)) {
      setContactOutcome(defaultContactOutcomeForChannel(channel));
    }
  }, [channel, contactOutcome]);

  useEffect(() => {
    if (isFailedContactOutcomeForChannel(channel, contactOutcome)) {
      setStartDeadline(false);
    } else if (canStartDeadline) {
      setStartDeadline(true);
    }
  }, [contactOutcome, channel, canStartDeadline]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/student-affairs/submissions/${encodeURIComponent(submissionId)}/absence-contact`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel,
            notes: notes.trim(),
            phone,
            startJustificationDeadline: startDeadline,
            contactOutcome,
          }),
        }
      );
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo registrar la gestión.");
        return;
      }
      onSaved(data.submission as ExperienceFormSubmission);
    } catch {
      setError("Error de red al registrar la gestión.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        Registre en el expediente de <strong>{participantName}</strong> cada gestión realizada
        (llamada, WhatsApp, presencial, etc.). Los correos de solicitud de justificación quedan
        registrados automáticamente al enviarlos desde el panel.
      </p>

      <GestionesExpedienteList entries={contacts} />

      <div className="space-y-3 rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-foreground">Nueva gestión</p>
        <Select
          label="Canal de contacto"
          value={channel}
          onChange={(event) => setChannel(event.target.value as OperatorManualContactChannel)}
          options={OPERATOR_CONTACT_CHANNEL_OPTIONS}
        />
        <Select
          label="Resultado"
          value={contactOutcome}
          onChange={(event) => setContactOutcome(event.target.value as AbsenceContactOutcome)}
          options={outcomeOptions}
        />
        <Textarea
          label="Detalle de la gestión"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={contactNotesPlaceholder(channel)}
          rows={4}
        />
        {canStartDeadline && !isFailedContactOutcomeForChannel(channel, contactOutcome) ? (
          <Checkbox
            checked={startDeadline}
            onChange={(event) => setStartDeadline(event.target.checked)}
            label="Informó plazo de 3 días para justificar (inicia conteo)"
          />
        ) : canStartDeadline && isFailedContactOutcomeForChannel(channel, contactOutcome) ? (
          <p className="text-xs text-muted">
            No se inicia plazo si no hubo contacto exitoso. Registre otro intento cuando logre
            comunicarse.
          </p>
        ) : (
          <p className="text-xs text-muted">
            El plazo de justificación ya está en curso; esta gestión quedará en el expediente.
          </p>
        )}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" loading={saving} onClick={() => void handleSave()}>
            Registrar gestión
          </Button>
        </div>
      </div>
    </div>
  );
}
