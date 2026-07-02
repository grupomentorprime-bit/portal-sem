"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Cloud, Mail, UserPlus, Users } from "lucide-react";
import { AuditTimeline, type AuditTimelineEntry } from "@/components/admin/AuditTimeline";
import {
  AdminModuleCenter,
  AdminModuleHero,
  AdminModuleSectionHeader,
  AdminModuleStats,
} from "@/components/admin/AdminModuleCenter";
import { ADMIN_PANEL_META } from "@/lib/admin/module-panels";
import { InviteUserWizard } from "@/components/admin/InviteUserWizard";
import { UserCmsCard, type UserCmsCardData } from "@/components/admin/UserCmsCard";
import { CMS_USER_GROUPS } from "@/lib/admin/institutional";
import { cn } from "@/lib/utils";

export function UsuariosCmsClient() {
  const [members, setMembers] = useState<UserCmsCardData[]>([]);
  const [invitations, setInvitations] = useState<
    Array<{
      id: string;
      email: string;
      displayName: string;
      expiresAt: string;
      createdAt: string;
      roles: Array<{ label: string }>;
    }>
  >([]);
  const [audit, setAudit] = useState<AuditTimelineEntry[]>([]);
  const [activeGroup, setActiveGroup] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [compatMode, setCompatMode] = useState(false);
  const [roleSavingId, setRoleSavingId] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    const [teamRes, meRes] = await Promise.all([
      fetch("/api/identity/team"),
      fetch("/api/identity/me"),
    ]);
    const team = await teamRes.json();
    const me = await meRes.json();

    if (team.ok) {
      setMembers(team.members ?? []);
      setInvitations(team.invitations ?? []);
      setAudit(team.audit ?? []);
    }
    if (me.ok) setCompatMode(me.compatMode === true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadTeam();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadTeam]);

  const filteredMembers = useMemo(() => {
    const group = CMS_USER_GROUPS.find((g) => g.id === activeGroup);
    if (!group || group.id === "all") return members;
    if (!("roles" in group)) return members;
    return members.filter((m) =>
      m.roles.some((r) => (group.roles as readonly string[]).includes(r.name))
    );
  }, [members, activeGroup]);

  async function handleInvite(payload: {
    email: string;
    displayName: string;
    roleName: string;
  }) {
    setError("");
    const res = await fetch("/api/identity/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error ?? "No se pudo enviar la invitación");
      throw new Error(data.error);
    }
    await loadTeam();
  }

  async function handleRoleChange(membershipId: string, roleName: string) {
    setRoleSavingId(membershipId);
    setError("");
    const res = await fetch(`/api/identity/members/${membershipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleName }),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error ?? "No se pudo actualizar el rol");
      setRoleSavingId(null);
      return;
    }
    await loadTeam();
    setRoleSavingId(null);
  }

  if (loading) {
    return <p className="text-sm text-muted">Cargando usuarios del CMS…</p>;
  }

  return (
    <AdminModuleCenter>
      <AdminModuleHero {...ADMIN_PANEL_META.users} />

      <AdminModuleStats
        items={[
          { label: "Usuarios activos", value: members.length, icon: Users, tone: "total" },
          {
            label: "Invitaciones pendientes",
            value: invitations.length,
            icon: Mail,
            tone: "active",
          },
          { label: "Eventos recientes", value: audit.length, icon: Activity, tone: "published" },
        ]}
      />

      {compatMode ? (
        <div className="rounded-xl border border-[var(--state-warning-border)] bg-[var(--state-warning-bg)] px-4 py-3 text-sm text-[var(--color-warning)]">
          Este entorno permite acceder al CMS sin iniciar sesión. Activa el modo seguro en producción.
        </div>
      ) : null}

      <section className="space-y-4">
        <AdminModuleSectionHeader
          icon={Cloud}
          title="Integraciones de plataforma"
          description="Almacenamiento en la nube y conexiones de infraestructura del portal."
        />
        <Link
          href="/admin/settings/integrations"
          className="inline-flex rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-primary underline"
        >
          Almacenamiento en la nube (S3 / Backblaze B2)
        </Link>
      </section>

      <section className="space-y-4">
        <AdminModuleSectionHeader
          icon={Users}
          title="Equipo del CMS"
          description="Filtra por grupo institucional y ajusta roles de cada colaborador."
        />
        <div className="flex flex-wrap gap-2">
          {CMS_USER_GROUPS.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => setActiveGroup(group.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition",
                activeGroup === group.id
                  ? "bg-primary text-text-inverse"
                  : "bg-background text-muted hover:bg-background-muted"
              )}
            >
              {group.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredMembers.map((member) => (
            <UserCmsCard
              key={member.membershipId}
              member={member}
              saving={roleSavingId === member.membershipId}
              onRoleChange={handleRoleChange}
            />
          ))}
        </div>

        {filteredMembers.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted">
            No hay usuarios en este grupo.
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        <AdminModuleSectionHeader
          icon={UserPlus}
          title="Invitar usuario"
          description="Asistente guiado para nuevos accesos al CMS."
        />
        <InviteUserWizard onSubmit={handleInvite} error={error} />
        {invitations.length > 0 ? (
          <div>
            <h3 className="mb-2 text-sm font-semibold">Invitaciones pendientes</h3>
            <ul className="space-y-2 text-sm">
              {invitations.map((inv) => (
                <li key={inv.id} className="rounded-xl border border-border px-4 py-3">
                  <div className="font-medium">{inv.displayName || inv.email}</div>
                  <div className="text-muted">{inv.email}</div>
                  <div className="mt-1 text-muted">
                    {inv.roles.map((r) => r.label).join(", ")} · expira{" "}
                    {new Date(inv.expiresAt).toLocaleString("es-CL", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <AdminModuleSectionHeader
          icon={Activity}
          title="Actividad reciente"
          description="Historial legible de cambios en el CMS."
        />
        <AuditTimeline entries={audit} />
      </section>
    </AdminModuleCenter>
  );
}
