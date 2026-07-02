"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Settings2, Users } from "lucide-react";
import { AdminModuleLayout } from "@/components/admin/AdminModuleLayout";
import { Alert } from "@/components/ui";
import { Button } from "@/components/ui/button";

interface StudentAffairsForm {
  id: string;
  name: string;
  description: string;
  active: boolean;
  visible: boolean;
}

export function StudentAffairsHomeClient() {
  const [forms, setForms] = useState<StudentAffairsForm[]>([]);
  const [canManageScope, setCanManageScope] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/student-affairs/context");
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo cargar el panel.");
        return;
      }
      setForms(data.forms ?? []);
      setCanManageScope(Boolean(data.canManageScope));
    } catch {
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminModuleLayout
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Asuntos estudiantiles" },
      ]}
      title="Asuntos estudiantiles"
      description="Gestión de respuestas, inasistencias y check-in el día de la jornada."
      actions={
        canManageScope ? (
          <Button variant="outline" size="sm" href="/admin/portal/asuntos-estudiantiles/equipo">
            <Settings2 className="mr-2 h-4 w-4" />
            Asignar encargadas
          </Button>
        ) : null
      }
    >
      {loading ? <p className="text-sm text-muted">Cargando…</p> : null}
      {error ? <Alert variant="warning">{error}</Alert> : null}

      {!loading && !error && forms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <Users className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 text-sm text-muted">
            No tiene formularios asignados. Un administrador debe configurar su alcance en{" "}
            <Link href="/admin/portal/asuntos-estudiantiles/equipo" className="text-primary underline">
              Asignar encargadas
            </Link>
            .
          </p>
        </div>
      ) : null}

      {!loading && forms.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {forms.map((form) => (
            <Link
              key={form.id}
              href={`/admin/portal/asuntos-estudiantiles/${encodeURIComponent(form.id)}`}
              className="group rounded-xl border border-border bg-background p-5 transition hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground group-hover:text-primary">{form.name}</h2>
                  {form.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{form.description}</p>
                  ) : null}
                  <p className="mt-3 text-xs font-medium text-primary">Publicado en el portal</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </AdminModuleLayout>
  );
}
