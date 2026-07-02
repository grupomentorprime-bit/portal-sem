"use client";

import { useState } from "react";
import { Alert } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ABSENCE_REVIEW_POLICY,
  ABSENCE_REVIEW_STATUS_OPTIONS,
} from "@/lib/admin/forms-center";
import type { ExperienceFormAbsenceReview } from "@/types/experience-forms";
import type { FormSubmissionAttachment } from "@/lib/experience/forms/attachments";

interface AbsenceReviewEditorProps {
  submissionId: string;
  participantName: string;
  participantJustification: string;
  participantAttachment?: FormSubmissionAttachment | null;
  initialReview?: ExperienceFormAbsenceReview;
  onSaved: (review: ExperienceFormAbsenceReview) => void;
  onCancel?: () => void;
  /** Ruta PATCH personalizada (p. ej. panel de asuntos estudiantiles). */
  saveEndpoint?: string;
}

export function AbsenceReviewEditor({
  submissionId,
  participantName,
  participantJustification,
  participantAttachment,
  initialReview,
  onSaved,
  onCancel,
  saveEndpoint,
}: AbsenceReviewEditorProps) {
  const [status, setStatus] = useState(initialReview?.status ?? "pending");
  const [managementNotes, setManagementNotes] = useState(initialReview?.managementNotes ?? "");
  const [evidenceReceived, setEvidenceReceived] = useState(initialReview?.evidenceReceived ?? false);
  const [evidenceNotes, setEvidenceNotes] = useState(initialReview?.evidenceNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const endpoint =
        saveEndpoint ?? `/api/experience/forms/submissions/${submissionId}`;
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          managementNotes,
          evidenceReceived,
          evidenceNotes,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo guardar la gestión.");
        return;
      }
      onSaved(data.submission.absenceReview);
    } catch {
      setError("Error de red al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-background-muted/30 p-4">
      <Alert variant="info">{ABSENCE_REVIEW_POLICY}</Alert>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Participante</p>
          <p className="mt-1 text-sm font-medium">{participantName}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Motivo declarado
          </p>
          <p className="mt-1 text-sm text-foreground">
            {participantJustification.trim() || "Sin motivo registrado."}
          </p>
          {participantAttachment ? (
            <a
              href={participantAttachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex text-sm font-medium text-primary hover:underline"
            >
              Ver justificativo adjunto ({participantAttachment.filename})
            </a>
          ) : null}
        </div>
      </div>

      <Select
        label="Estado de la gestión"
        value={status}
        onChange={(event) => setStatus(event.target.value as ExperienceFormAbsenceReview["status"])}
        options={ABSENCE_REVIEW_STATUS_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
      />

      <Checkbox
        id={`evidence-${submissionId}`}
        checked={evidenceReceived}
        onChange={(event) => setEvidenceReceived(event.target.checked)}
        label="Respaldo documental recibido"
        description="Certificado médico, carta institucional u otro documento que acredite fuerza mayor."
      />

      <div className="space-y-2">
        <Label htmlFor={`evidence-notes-${submissionId}`}>Detalle del respaldo</Label>
        <Textarea
          id={`evidence-notes-${submissionId}`}
          value={evidenceNotes}
          onChange={(event) => setEvidenceNotes(event.target.value)}
          rows={3}
          placeholder="Ej.: certificado médico del 2 jul, enviado por correo el 3 jul."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`management-notes-${submissionId}`}>Gestiones realizadas</Label>
        <Textarea
          id={`management-notes-${submissionId}`}
          value={managementNotes}
          onChange={(event) => setManagementNotes(event.target.value)}
          rows={4}
          placeholder="Contacto con el participante, solicitud de documentos, derivación académica, etc."
        />
      </div>

      {initialReview?.reviewedAt ? (
        <p className="text-xs text-muted">
          Última actualización:{" "}
          {new Date(initialReview.reviewedAt).toLocaleString("es-CL")}
          {initialReview.reviewedByName ? ` · ${initialReview.reviewedByName}` : ""}
        </p>
      ) : null}

      {error ? <p className="text-sm text-primary">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" size="sm" onClick={() => void handleSave()} loading={saving}>
          Guardar gestión
        </Button>
        {onCancel ? (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cerrar
          </Button>
        ) : null}
      </div>
    </div>
  );
}
