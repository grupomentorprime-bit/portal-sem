"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { attendanceLabel } from "@/lib/admin/forms-center";
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

  if (loading) return <p className="text-sm text-muted">Cargando respuestas…</p>;
  if (error) return <p className="text-sm text-primary">{error}</p>;

  if (submissions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
        Aún no hay respuestas para este formulario.
      </p>
    );
  }

  const hasAttendance = submissions.some((s) => s.data.attendance !== undefined);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">{total} respuesta{total === 1 ? "" : "s"} registrada{total === 1 ? "" : "s"}</p>
        <Button variant="ghost" size="sm" onClick={() => void load()}>
          Actualizar
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-background-muted/50">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Correo</th>
              {hasAttendance ? <th className="px-4 py-3 font-medium">Asistencia</th> : null}
              <th className="px-4 py-3 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission._id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">
                  {String(submission.data.fullName ?? submission.data.name ?? "—")}
                </td>
                <td className="px-4 py-3 text-muted">{String(submission.data.email ?? "—")}</td>
                {hasAttendance ? (
                  <td className="px-4 py-3">
                    {submission.data.attendance === "yes" ? (
                      <Badge variant="success">{attendanceLabel(submission.data.attendance)}</Badge>
                    ) : submission.data.attendance === "no" ? (
                      <Badge variant="warning">{attendanceLabel(submission.data.attendance)}</Badge>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                ) : null}
                <td className="px-4 py-3 text-muted whitespace-nowrap">
                  {formatDate(submission.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
