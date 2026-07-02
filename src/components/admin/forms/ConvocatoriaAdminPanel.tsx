"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminModuleLayout } from "@/components/admin/AdminModuleLayout";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import {
  attendanceLabel,
  formatConvocatoriaDate,
  publicFormUrl,
  type FormConvocatoria,
} from "@/lib/admin/forms-center";
import type { ExperienceFormSubmission } from "@/types/experience-forms";

interface SubmissionStats {
  total: number;
  attending: number;
  notAttending: number;
  other: number;
}

interface ConvocatoriaAdminPanelProps {
  convocatoria: FormConvocatoria;
}

export function ConvocatoriaAdminPanel({ convocatoria }: ConvocatoriaAdminPanelProps) {
  const [submissions, setSubmissions] = useState<ExperienceFormSubmission[]>([]);
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "yes" | "no">("all");
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subsRes, statsRes] = await Promise.all([
        fetch(
          `/api/experience/forms/submissions?formId=${encodeURIComponent(convocatoria.formId)}&limit=500`
        ),
        fetch(
          `/api/experience/forms/submissions?formId=${encodeURIComponent(convocatoria.formId)}&stats=true`
        ),
      ]);
      const subsData = await subsRes.json();
      const statsData = await statsRes.json();

      if (!subsData.ok || !statsData.ok) {
        setError("No se pudieron cargar las respuestas.");
        return;
      }

      setSubmissions(subsData.submissions ?? []);
      setStats(statsData.stats ?? null);
    } catch {
      setError("Error de red al cargar respuestas.");
    } finally {
      setLoading(false);
    }
  }, [convocatoria.formId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = submissions.filter((submission) => {
    if (filter === "all") return true;
    return submission.data.attendance === filter;
  });

  const exportCsv = () => {
    const headers = ["Nombre", "Correo", "Teléfono", "Programa", "Asistencia", "Justificación", "Fecha"];
    const rows = filtered.map((submission) => {
      const data = submission.data;
      return [
        String(data.fullName ?? ""),
        String(data.email ?? ""),
        String(data.phone ?? ""),
        String(data.program ?? ""),
        attendanceLabel(data.attendance),
        String(data.justification ?? ""),
        formatSubmissionDate(submission.createdAt),
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${convocatoria.slug}-respuestas.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminModuleLayout
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Portal", href: "/admin/pages" },
        { label: "Centro de formularios", href: "/admin/portal/forms" },
        { label: convocatoria.title },
      ]}
      title={convocatoria.title}
      description={`${formatConvocatoriaDate(convocatoria.date)} · ${convocatoria.location}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href={publicFormUrl(convocatoria.formId)}
            target="_blank"
            className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium"
          >
            Formulario público
          </Link>
          <Link
            href={`/admin/portal/forms/${convocatoria.formId}`}
            className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium"
          >
            Editar formulario
          </Link>
          <Button variant="secondary" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            Exportar CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void loadData()}>
            Actualizar
          </Button>
        </div>
      }
    >
      <p className="mb-6 text-sm text-muted">{convocatoria.description}</p>

      {stats ? (
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total respuestas" value={stats.total} />
          <StatCard label="Asistirán" value={stats.attending} variant="success" />
          <StatCard label="No asistirán" value={stats.notAttending} variant="warning" />
          <StatCard label="Sin definir" value={stats.other} />
        </section>
      ) : null}

      <section className="mb-4 flex flex-wrap gap-2">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
          Todas ({submissions.length})
        </FilterButton>
        <FilterButton active={filter === "yes"} onClick={() => setFilter("yes")}>
          Asistirán ({stats?.attending ?? 0})
        </FilterButton>
        <FilterButton active={filter === "no"} onClick={() => setFilter("no")}>
          No asistirán ({stats?.notAttending ?? 0})
        </FilterButton>
      </section>

      {error ? <p className="mb-4 text-sm text-primary">{error}</p> : null}
      {loading ? <p className="text-sm text-muted">Cargando respuestas…</p> : null}

      {!loading && filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          Aún no hay respuestas para esta convocatoria. Comparte el enlace del formulario con los
          participantes.
        </p>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-background-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Programa</th>
                <th className="px-4 py-3 font-medium">Asistencia</th>
                <th className="px-4 py-3 font-medium">Justificación</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((submission) => (
                <tr key={submission._id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{String(submission.data.fullName ?? "—")}</td>
                  <td className="px-4 py-3 text-muted">{String(submission.data.email ?? "—")}</td>
                  <td className="px-4 py-3 text-muted">{String(submission.data.program ?? "—")}</td>
                  <td className="px-4 py-3">
                    <AttendanceBadge value={submission.data.attendance} />
                  </td>
                  <td className="max-w-xs px-4 py-3 text-muted">
                    {submission.data.attendance === "no"
                      ? String(submission.data.justification ?? "—")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {formatSubmissionDate(submission.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </AdminModuleLayout>
  );
}

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant?: "success" | "warning";
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      {variant === "success" ? (
        <Badge variant="success" className="mt-2">
          Confirmados
        </Badge>
      ) : null}
      {variant === "warning" ? (
        <Badge variant="warning" className="mt-2">
          Justificados
        </Badge>
      ) : null}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          : "rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:bg-background-muted"
      }
    >
      {children}
    </button>
  );
}

function AttendanceBadge({ value }: { value: unknown }) {
  if (value === "yes") return <Badge variant="success">Asistirá</Badge>;
  if (value === "no") return <Badge variant="warning">No asistirá</Badge>;
  return <Badge variant="neutral">Sin definir</Badge>;
}

function formatSubmissionDate(iso: string): string {
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
