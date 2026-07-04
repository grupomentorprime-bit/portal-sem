"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  TESTIMONIAL_REVIEW_POLICY,
  TESTIMONIAL_REVIEW_STATUS_OPTIONS,
  testimonialReviewStatusLabel,
} from "@/lib/admin/forms-center";
import {
  TESTIMONIAL_FORM_LIMITS,
  testimonialSubmissionPreview,
} from "@/lib/experience/forms/testimonial-limits";
import type {
  ExperienceFormSubmission,
  ExperienceFormTestimonialReview,
} from "@/types/experience-forms";

interface TestimonialReviewEditorProps {
  submission: ExperienceFormSubmission;
  onSaved: (review: ExperienceFormTestimonialReview) => void;
  onCancel?: () => void;
}

export function TestimonialReviewEditor({
  submission,
  onSaved,
  onCancel,
}: TestimonialReviewEditorProps) {
  const submissionId = submission._id ?? "";
  const preview = useMemo(() => testimonialSubmissionPreview(submission.data), [submission.data]);
  const initial = submission.testimonialReview;

  const [status, setStatus] = useState<ExperienceFormTestimonialReview["status"]>(
    initial?.status ?? "pending"
  );
  const [publishQuote, setPublishQuote] = useState(initial?.publishQuote ?? true);
  const [publishAuthor, setPublishAuthor] = useState(initial?.publishAuthor ?? true);
  const [publishGeneration, setPublishGeneration] = useState(initial?.publishGeneration ?? true);
  const [publishAffiliation, setPublishAffiliation] = useState(initial?.publishAffiliation ?? true);
  const [editedQuote, setEditedQuote] = useState(initial?.editedQuote ?? preview.quote);
  const [editedAuthor, setEditedAuthor] = useState(initial?.editedAuthor ?? preview.author);
  const [editedRole, setEditedRole] = useState(initial?.editedRole ?? preview.role);
  const [editedProgram, setEditedProgram] = useState(initial?.editedProgram ?? preview.program);
  const [reviewNotes, setReviewNotes] = useState(initial?.reviewNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = String(submission.data.email ?? "—");

  const save = async (options: { publishNow?: boolean }) => {
    if (!submissionId) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/experience/forms/submissions/${submissionId}/testimonial-review`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            publishQuote,
            publishAuthor,
            publishGeneration,
            publishAffiliation,
            editedQuote,
            editedAuthor,
            editedRole,
            editedProgram,
            reviewNotes,
            publishNow: options.publishNow,
          }),
        }
      );
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo guardar la revisión.");
        return;
      }
      onSaved(data.submission.testimonialReview);
    } catch {
      setError("Error de red al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-background-muted/30 p-4">
      <Alert variant="info">{TESTIMONIAL_REVIEW_POLICY}</Alert>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Correo (interno)</p>
          <p className="mt-1 text-sm">{email}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Estado actual</p>
          <p className="mt-1 text-sm font-medium">{testimonialReviewStatusLabel(status)}</p>
        </div>
      </div>

      <Select
        label="Decisión editorial"
        value={status}
        onChange={(event) =>
          setStatus(event.target.value as ExperienceFormTestimonialReview["status"])
        }
        options={TESTIMONIAL_REVIEW_STATUS_OPTIONS.filter((option) => option.value !== "published").map(
          (option) => ({
            value: option.value,
            label: option.label,
          })
        )}
      />

      <div className="space-y-3 rounded-lg border border-border bg-background p-4">
        <p className="text-sm font-medium text-foreground">Qué se publica en el sitio</p>
        <Checkbox
          id={`publish-quote-${submissionId}`}
          checked={publishQuote}
          onChange={(event) => setPublishQuote(event.target.checked)}
          label="Publicar testimonio (cita)"
        />
        <Checkbox
          id={`publish-author-${submissionId}`}
          checked={publishAuthor}
          onChange={(event) => setPublishAuthor(event.target.checked)}
          label="Publicar nombre y título"
        />
        <Checkbox
          id={`publish-generation-${submissionId}`}
          checked={publishGeneration}
          onChange={(event) => setPublishGeneration(event.target.checked)}
          label="Publicar generación"
        />
        <Checkbox
          id={`publish-affiliation-${submissionId}`}
          checked={publishAffiliation}
          onChange={(event) => setPublishAffiliation(event.target.checked)}
          label="Publicar iglesia o comunidad y ciudad"
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Vista previa editable</p>
        <Textarea
          label="Testimonio"
          value={editedQuote}
          onChange={(event) => setEditedQuote(event.target.value)}
          maxLength={TESTIMONIAL_FORM_LIMITS.quote}
          helper={`${editedQuote.length}/${TESTIMONIAL_FORM_LIMITS.quote} caracteres`}
          rows={4}
        />
        <Input
          label="Autor (nombre en tarjeta)"
          value={editedAuthor}
          onChange={(event) => setEditedAuthor(event.target.value)}
          maxLength={TESTIMONIAL_FORM_LIMITS.author}
          helper={`${editedAuthor.length}/${TESTIMONIAL_FORM_LIMITS.author} caracteres`}
        />
        <Input
          label="Generación"
          value={editedRole}
          onChange={(event) => setEditedRole(event.target.value)}
          maxLength={TESTIMONIAL_FORM_LIMITS.generationRole}
          helper={`${editedRole.length}/${TESTIMONIAL_FORM_LIMITS.generationRole} caracteres`}
        />
        <Input
          label="Iglesia o comunidad y ciudad"
          value={editedProgram}
          onChange={(event) => setEditedProgram(event.target.value)}
          maxLength={TESTIMONIAL_FORM_LIMITS.program}
          helper={`${editedProgram.length}/${TESTIMONIAL_FORM_LIMITS.program} caracteres — formato «Iglesia, Ciudad»`}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`review-notes-${submissionId}`}>Notas internas</Label>
        <Textarea
          id={`review-notes-${submissionId}`}
          value={reviewNotes}
          onChange={(event) => setReviewNotes(event.target.value)}
          rows={3}
          placeholder="Motivo de rechazo, ajustes solicitados al alumno, etc."
        />
      </div>

      {initial?.publishedTestimonialId ? (
        <p className="text-sm text-muted">
          Publicado en CMS:{" "}
          <Link
            href={`/admin/content/testimonials/edit/${initial.publishedTestimonialId}`}
            className="font-medium text-primary hover:underline"
          >
            Ver testimonio
          </Link>
        </p>
      ) : null}

      {initial?.reviewedAt ? (
        <p className="text-xs text-muted">
          Última actualización: {new Date(initial.reviewedAt).toLocaleString("es-CL")}
          {initial.reviewedByName ? ` · ${initial.reviewedByName}` : ""}
        </p>
      ) : null}

      {error ? <p className="text-sm text-primary">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" size="sm" onClick={() => void save({ publishNow: true })} loading={saving}>
          Publicar en Home
        </Button>
        <Button variant="outline" size="sm" onClick={() => void save({})} loading={saving}>
          Guardar revisión
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
