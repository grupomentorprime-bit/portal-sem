"use client";

import { useCallback, useEffect, useState } from "react";
import { ExperienceFormSubmissionsTable } from "@/components/admin/forms/ExperienceFormSubmissionsTable";
import type { ExperienceFormSubmission } from "@/types/experience-forms";

interface FormSubmissionsPanelProps {
  formId: string;
}

export function FormSubmissionsPanel({ formId }: FormSubmissionsPanelProps) {
  const [submissions, setSubmissions] = useState<ExperienceFormSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/experience/forms/submissions?formId=${encodeURIComponent(formId)}&limit=200`
      );
      const data = await res.json();
      if (!data.ok) {
        setError("No se pudieron cargar las respuestas.");
        return;
      }
      setSubmissions(data.submissions ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (submissionId: string, _participantName: string) => {
    setError(null);
    const res = await fetch(`/api/experience/forms/submissions/${encodeURIComponent(submissionId)}`, {
      method: "DELETE",
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    if (!data.ok) {
      setError(data.error ?? "No se pudo eliminar la respuesta.");
      return;
    }
    setSubmissions((current) => current.filter((submission) => submission._id !== submissionId));
    setTotal((current) => Math.max(0, current - 1));
  };

  return (
    <ExperienceFormSubmissionsTable
      formId={formId}
      submissions={submissions}
      total={total}
      loading={loading}
      error={error}
      onRefresh={() => void load()}
      onDelete={handleDelete}
      onReviewSaved={(submissionId, review) => {
        setSubmissions((current) =>
          current.map((submission) =>
            submission._id === submissionId ? { ...submission, absenceReview: review } : submission
          )
        );
      }}
      onTestimonialReviewSaved={(submissionId, review) => {
        setSubmissions((current) =>
          current.map((submission) =>
            submission._id === submissionId ? { ...submission, testimonialReview: review } : submission
          )
        );
      }}
    />
  );
}
