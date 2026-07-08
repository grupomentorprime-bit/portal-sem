"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import { ClipboardList, Settings2, Users } from "lucide-react";
import {
  AlertBanner,
  ContentGrid,
  EmptyState,
  KpiCard,
  LoadingState,
  QuickActions,
} from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { Button } from "@/components/ui/button";
import { ROLE_CODES } from "@/core/identity/roles/codes";
import { rolesIncludeCode } from "@/core/identity/roles/helpers";
import { CONFIRMED_NO_SHOW_LABEL } from "@/lib/student-affairs/operations-labels";
import { STUDENT_AFFAIRS_HOME_PATH } from "@/lib/admin/nav-access";

interface StudentAffairsForm {
  id: string;
  name: string;
  description: string;
  active: boolean;
  visible: boolean;
}

interface FormStats {
  pendingArrival: number;
}

export function StudentAffairsHomeClient() {
  const [forms, setForms] = useState<StudentAffairsForm[]>([]);
  const [canManageScope, setCanManageScope] = useState(false);
  const [operatorCount, setOperatorCount] = useState<number | null>(null);
  const [aggregateStats, setAggregateStats] = useState<FormStats>({ pendingArrival: 0 });
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

      const loadedForms: StudentAffairsForm[] = data.forms ?? [];
      setForms(loadedForms);
      setCanManageScope(Boolean(data.canManageScope));

      if (loadedForms.length > 0) {
        const statsResults = await Promise.all(
          loadedForms.map(async (form) => {
            try {
              const statsRes = await fetch(
                `/api/student-affairs/forms/${encodeURIComponent(form.id)}/submissions?stats=true`
              );
              const statsData = await statsRes.json();
              if (!statsData.ok || !statsData.stats) return 0;
              const attending = statsData.stats.attending ?? 0;
              const checkedIn = statsData.stats.checkedIn ?? 0;
              return Math.max(0, attending - checkedIn);
            } catch {
              return 0;
            }
          })
        );
        setAggregateStats({ pendingArrival: statsResults.reduce((sum, n) => sum + n, 0) });
      } else {
        setAggregateStats({ pendingArrival: 0 });
      }

      if (data.canManageScope) {
        try {
          const teamRes = await fetch("/api/identity/team");
          const team = await teamRes.json();
          if (team.ok) {
            const count = (team.members ?? []).filter(
              (member: { roles: Array<{ code?: string }> }) =>
                rolesIncludeCode(member.roles, ROLE_CODES.STUDENT_AFFAIRS)
            ).length;
            setOperatorCount(count);
          }
        } catch {
          setOperatorCount(null);
        }
      }
    } catch {
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  }, []);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  const activeForms = useMemo(() => forms.filter((form) => form.active).length, [forms]);

  const quickActionItems = useMemo(() => {
    const items = forms.map((form) => ({
      id: form.id,
      title: form.name,
      description: form.description || "Publicado en el portal",
      href: `/admin/portal/asuntos-estudiantiles/${encodeURIComponent(form.id)}`,
      icon: <ClipboardList className="h-5 w-5" />,
    }));

    if (canManageScope) {
      items.push({
        id: "team",
        title: "Equipo y permisos",
        description: "Asignar formularios y generaciones",
        href: "/admin/portal/asuntos-estudiantiles/equipo",
        icon: <Settings2 className="h-5 w-5" />,
      });
    }

    return items;
  }, [forms, canManageScope]);

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: STUDENT_AFFAIRS_HOME_PATH },
        { label: "Formularios" },
        { label: "Operación" },
      ]}
      title="Operación de formularios"
      description="Gestiona respuestas, seguimiento, asistencia y operación de formularios activos."
      actions={
        canManageScope ? (
          <Button variant="outline" size="sm" href="/admin/portal/asuntos-estudiantiles/equipo">
            <Settings2 className="mr-2 h-4 w-4" />
            Asignar encargadas
          </Button>
        ) : null
      }
    >
      {loading ? <LoadingState variant="cards" /> : null}
      {error ? <AlertBanner variant="warning">{error}</AlertBanner> : null}

      {!loading && !error && forms.length > 0 ? (
        <>
          <ContentGrid cols={3} className="mb-6">
            <KpiCard
              label="Convocatorias activas"
              value={activeForms}
              accent="info"
              icon={<ClipboardList className="h-4 w-4" />}
            />
            <KpiCard
              label={CONFIRMED_NO_SHOW_LABEL}
              value={aggregateStats.pendingArrival}
              accent={aggregateStats.pendingArrival > 0 ? "warning" : "success"}
              variant={aggregateStats.pendingArrival > 0 ? "warning" : "success"}
              icon={<Users className="h-4 w-4" />}
            />
            {canManageScope && operatorCount !== null ? (
              <KpiCard label="Operadores" value={operatorCount} />
            ) : (
              <KpiCard label="Formularios asignados" value={forms.length} />
            )}
          </ContentGrid>

          <QuickActions items={quickActionItems} cols={3} />
        </>
      ) : null}

      {!loading && !error && forms.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="Sin formularios asignados"
          description={
            canManageScope
              ? "Un administrador debe configurar su alcance en Asignar encargadas."
              : "Un administrador debe asignarte formularios y generaciones para operar en esta jornada."
          }
          action={
            canManageScope
              ? { label: "Asignar encargadas", href: "/admin/portal/asuntos-estudiantiles/equipo" }
              : undefined
          }
        />
      ) : null}
    </AdminModulePage>
  );
}
