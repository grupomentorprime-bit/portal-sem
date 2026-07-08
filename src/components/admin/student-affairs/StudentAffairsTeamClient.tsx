"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import { AlertBanner } from "@/components/admin/kit/states/AlertBanner";
import { useToast } from "@/components/admin/kit/states/Toast";
import { EmptyState } from "@/components/admin/kit/states/EmptyState";
import { LoadingState } from "@/components/admin/kit/states/LoadingState";
import { Section } from "@/components/admin/kit/layout/Section";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CONVOCATORIA_GENERATIONS } from "@/lib/experience/forms/generations";
import { STUDENT_AFFAIRS_HOME_PATH } from "@/lib/admin/nav-access";
import { ROLE_CODES } from "@/core/identity/roles/codes";
import { rolesIncludeCode } from "@/core/identity/roles/helpers";
import type { StudentAffairsScope } from "@/types/identity";

interface TeamMember {
  membershipId: string;
  displayName: string;
  email: string;
  roles: Array<{ name: string; code?: string; label: string }>;
  studentAffairsScope?: StudentAffairsScope;
}

interface ExperienceFormOption {
  id: string;
  name: string;
}

export function StudentAffairsTeamClient() {
  const { push } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [forms, setForms] = useState<ExperienceFormOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, StudentAffairsScope>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [teamRes, contextRes] = await Promise.all([
        fetch("/api/identity/team"),
        fetch("/api/student-affairs/context"),
      ]);
      const team = await teamRes.json();
      const context = await contextRes.json();

      if (!team.ok) {
        setError(team.error ?? "No se pudo cargar el equipo.");
        return;
      }
      if (!context.ok) {
        setError(context.error ?? "No se pudo cargar formularios.");
        return;
      }

      const studentAffairsMembers = (team.members ?? []).filter((member: TeamMember) =>
        rolesIncludeCode(member.roles, ROLE_CODES.STUDENT_AFFAIRS)
      );

      setMembers(studentAffairsMembers);
      setForms(
        (context.forms ?? []).map((form: ExperienceFormOption & { id: string }) => ({
          id: form.id,
          name: form.name,
        }))
      );

      const initialDrafts: Record<string, StudentAffairsScope> = {};
      for (const member of studentAffairsMembers) {
        initialDrafts[member.membershipId] = member.studentAffairsScope ?? {
          formIds: [],
          generationCodes: [],
        };
      }
      setDrafts(initialDrafts);
    } catch {
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  }, []);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  const allForms = useMemo(() => {
    if (forms.length > 0) return forms;
    return [];
  }, [forms]);

  const toggleForm = (membershipId: string, formId: string) => {
    setDrafts((current) => {
      const scope = current[membershipId] ?? { formIds: [], generationCodes: [] };
      const formIds = scope.formIds.includes(formId)
        ? scope.formIds.filter((id) => id !== formId)
        : [...scope.formIds, formId];
      return { ...current, [membershipId]: { ...scope, formIds } };
    });
  };

  const toggleGeneration = (membershipId: string, generationCode: string) => {
    setDrafts((current) => {
      const scope = current[membershipId] ?? { formIds: [], generationCodes: [] };
      const generationCodes = scope.generationCodes.includes(generationCode)
        ? scope.generationCodes.filter((code) => code !== generationCode)
        : [...scope.generationCodes, generationCode];
      return { ...current, [membershipId]: { ...scope, generationCodes } };
    });
  };

  const saveScope = async (membershipId: string) => {
    const memberName =
      members.find((member) => member.membershipId === membershipId)?.displayName ?? "la encargada";
    const scope = drafts[membershipId];
    if (!scope?.formIds.length || !scope.generationCodes.length) {
      const message = "Cada encargada debe tener al menos un formulario y una generación.";
      setError(message);
      push({ title: "No se pudo guardar", description: message, tone: "warning" });
      return;
    }

    setSavingId(membershipId);
    setError(null);
    try {
      const res = await fetch(`/api/student-affairs/scope/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      });
      const data = await res.json();
      if (!data.ok) {
        const message = data.error ?? "No se pudo guardar.";
        setError(message);
        push({ title: "No se pudo guardar", description: message, tone: "error" });
        return;
      }
      setMembers((current) =>
        current.map((member) =>
          member.membershipId === membershipId
            ? { ...member, studentAffairsScope: data.scope }
            : member
        )
      );
      push({
        title: "Alcance guardado",
        description: `Permisos de ${memberName} actualizados.`,
        tone: "success",
      });
    } catch {
      const message = "Error de red al guardar.";
      setError(message);
      push({ title: "No se pudo guardar", description: message, tone: "error" });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: STUDENT_AFFAIRS_HOME_PATH },
        { label: "Formularios" },
        { label: "Operación", href: STUDENT_AFFAIRS_HOME_PATH },
        { label: "Equipo" },
      ]}
      title="Equipo y permisos"
      description="Defina qué formularios y generaciones puede gestionar cada persona de asuntos estudiantiles."
      actions={
        <Button variant="outline" size="sm" href={STUDENT_AFFAIRS_HOME_PATH}>
          Volver a operación
        </Button>
      }
    >
      {loading ? <LoadingState variant="cards" /> : null}
      {error ? <AlertBanner variant="warning">{error}</AlertBanner> : null}

      {!loading && members.length === 0 ? (
        <EmptyState
          title="Sin usuarios de asuntos estudiantiles"
          description="Invite usuarios con rol Asuntos estudiantiles desde Usuarios CMS."
          action={{ label: "Ir a Usuarios CMS", href: "/admin/settings/users" }}
        />
      ) : null}

      {!loading && members.length > 0 ? (
        <div className="space-y-6">
          {members.map((member) => {
            const draft = drafts[member.membershipId] ?? { formIds: [], generationCodes: [] };
            return (
              <Section key={member.membershipId}>
                <div className="rounded-xl border border-border bg-background p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="font-semibold text-foreground">{member.displayName}</h2>
                      <p className="text-sm text-muted">{member.email}</p>
                    </div>
                    <Button
                      size="sm"
                      disabled={savingId === member.membershipId}
                      onClick={() => void saveScope(member.membershipId)}
                    >
                      {savingId === member.membershipId ? "Guardando…" : "Guardar alcance"}
                    </Button>
                  </div>

                  <div className="mt-5 grid gap-6 lg:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Formularios
                      </p>
                      <div className="mt-2 space-y-2">
                        {allForms.map((form) => (
                          <label key={form.id} className="flex items-start gap-2 text-sm">
                            <Checkbox
                              checked={draft.formIds.includes(form.id)}
                              onChange={() => toggleForm(member.membershipId, form.id)}
                            />
                            <span>{form.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Generaciones
                      </p>
                      <div className="mt-2 space-y-2">
                        {CONVOCATORIA_GENERATIONS.map((generation) => (
                          <label key={generation.value} className="flex items-start gap-2 text-sm">
                            <Checkbox
                              checked={draft.generationCodes.includes(generation.value)}
                              onChange={() =>
                                toggleGeneration(member.membershipId, generation.value)
                              }
                            />
                            <span>{generation.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Section>
            );
          })}
        </div>
      ) : null}
    </AdminModulePage>
  );
}
