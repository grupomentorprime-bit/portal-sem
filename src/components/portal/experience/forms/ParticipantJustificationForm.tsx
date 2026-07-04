"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { validateFormAttachmentFile } from "@/lib/experience/forms/attachments";
import { ABSENCE_REVIEW_POLICY } from "@/lib/admin/forms-center";

interface ParticipantJustificationFormProps {
  submissionId: string;
  token: string;
  participantName: string;
}

export function ParticipantJustificationForm({
  submissionId,
  token,
  participantName,
}: ParticipantJustificationFormProps) {
  const [justification, setJustification] = useState("");
  const [file, setFile] = useState<File | undefined>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (justification.trim().length < 10) {
      setError("Describe el motivo con al menos 10 caracteres.");
      return;
    }

    if (!file) {
      setError("Debes adjuntar un respaldo documental.");
      return;
    }

    const fileError = validateFormAttachmentFile(file);
    if (fileError) {
      setError(fileError);
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("token", token);
      formData.set("justification", justification.trim());
      formData.set("file", file);

      const res = await fetch(
        `/api/experience/forms/submissions/${encodeURIComponent(submissionId)}/participant-justification`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo enviar la justificación.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Error de red. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-background p-8 text-center shadow-sm">
        <p className="text-lg font-semibold text-foreground">Justificación recibida</p>
        <p className="mt-3 text-sm text-muted">
          Gracias, {participantName.split(/\s+/)[0] || participantName}. El equipo académico revisará
          tu caso y te informará por correo.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="mx-auto max-w-lg space-y-5 rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Justificación</p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">Completa tu inasistencia</h1>
        <p className="mt-2 text-sm text-muted">
          Hola, <strong className="text-foreground">{participantName}</strong>. Indica el motivo y
          adjunta un respaldo verificable.
        </p>
      </div>

      <p className="rounded-xl bg-background-muted/60 p-3 text-xs leading-relaxed text-muted">
        {ABSENCE_REVIEW_POLICY}
      </p>

      <Textarea
        label="Motivo de inasistencia"
        value={justification}
        onChange={(event) => setJustification(event.target.value)}
        rows={5}
        placeholder="Describe brevemente la situación de fuerza mayor…"
        required
      />

      <div className="space-y-2">
        <label htmlFor="justify-file" className="text-sm font-medium text-foreground">
          Respaldo documental
        </label>
        <input
          id="justify-file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
          className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-text-inverse"
          onChange={(event) => setFile(event.target.files?.[0])}
          required
        />
        <p className="text-xs text-muted">PDF o imagen, máximo 5 MB.</p>
      </div>

      {error ? <p className="text-sm text-primary">{error}</p> : null}

      <Button type="submit" className="w-full" loading={saving} disabled={saving}>
        Enviar justificación
      </Button>
    </form>
  );
}
