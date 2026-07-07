"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ArrowLeft, Mail, Search, UserPlus } from "lucide-react";
import { AuditTimeline, type AuditTimelineEntry } from "@/components/admin/AuditTimeline";
import { InviteUserWizard } from "@/components/admin/InviteUserWizard";
import {
  UserMemberDrawer,
  type UserMemberDrawerMode,
  type UserMemberDrawerTarget,
} from "@/components/admin/UserMemberDrawer";
import {
  UserCmsCard,
  type AssignableRole,
  type MemberAction,
  type UserCmsCardData,
  type UserCmsCardPanel,
} from "@/components/admin/UserCmsCard";
import { useConfirmDialog } from "@/components/admin/kit/hooks/useConfirmDialog";
import { Button } from "@/components/ui/button";
import { CMS_USER_GROUPS } from "@/lib/admin/institutional";
import { isProtectedMember, rolesIncludeCode } from "@/core/identity/roles/helpers";
import { cn } from "@/lib/utils";
import "@/styles/admin-users-cms.css";

type UsersCmsTab = "team" | "invite" | "activity";
type StatusFilter = "active" | "archived" | "suspended" | "all";
type SortOption = "name" | "last-login";

const MEMBER_ACTION_COPY: Record<
  MemberAction,
  { title: string; description: string; confirmLabel: string; destructive?: boolean }
> = {
  suspend: {
    title: "¿Suspender acceso al CMS?",
    description:
      "El usuario perderá acceso al panel hasta que lo restaure. Sus sesiones activas se cerrarán.",
    confirmLabel: "Sí, suspender",
    destructive: true,
  },
  block: {
    title: "¿Bloquear usuario?",
    description:
      "Se bloqueará la cuenta y se cerrarán sus sesiones activas. No podrá iniciar sesión hasta reactivarlo manualmente.",
    confirmLabel: "Sí, bloquear",
    destructive: true,
  },
  archive: {
    title: "¿Eliminar este usuario?",
    description:
      "Primero quedará archivado: dejará de tener acceso activo al CMS. Luego podrá eliminarlo definitivamente si lo confirma otra vez.",
    confirmLabel: "Sí, archivar",
    destructive: true,
  },
  restore: {
    title: "¿Restaurar acceso?",
    description: "El usuario volverá a estado activo y podrá acceder al CMS según su rol.",
    confirmLabel: "Sí, restaurar",
  },
  remove: {
    title: "¿Eliminar definitivamente?",
    description:
      "Se borrará del equipo de forma permanente. Esta acción no se puede deshacer.",
    confirmLabel: "Sí, eliminar definitivamente",
    destructive: true,
  },
};

export function UsuariosCmsClient() {
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [activeTab, setActiveTab] = useState<UsersCmsTab>("team");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [drawer, setDrawer] = useState<{
    target: UserMemberDrawerTarget;
    mode: UserMemberDrawerMode;
  } | null>(null);
  const [assignableRoles, setAssignableRoles] = useState<AssignableRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [compatMode, setCompatMode] = useState(false);
  const [roleSavingId, setRoleSavingId] = useState<string | null>(null);
  const [memberActionSaving, setMemberActionSaving] = useState<{
    membershipId: string;
    action: MemberAction;
  } | null>(null);
  const [invitationRevokingId, setInvitationRevokingId] = useState<string | null>(null);
  const [openCardPanel, setOpenCardPanel] = useState<{
    membershipId: string;
    panel: UserCmsCardPanel;
  } | null>(null);

  const handlePanelToggle = useCallback((membershipId: string, panel: UserCmsCardPanel) => {
    setOpenCardPanel((current) =>
      current?.membershipId === membershipId && current.panel === panel
        ? null
        : { membershipId, panel }
    );
  }, []);

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
      setAssignableRoles(team.assignableRoles ?? []);
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

  const activeMemberCount = useMemo(
    () => members.filter((member) => member.status === "active").length,
    [members]
  );

  const filteredMembers = useMemo(() => {
    const byStatus =
      statusFilter === "all"
        ? members
        : members.filter((member) => member.status === statusFilter);

    const group = CMS_USER_GROUPS.find((g) => g.id === activeGroup);
    const byRole =
      !group || group.id === "all" || !("roleCodes" in group)
        ? byStatus
        : byStatus.filter((m) =>
            m.roles.some((r) => group.roleCodes.some((code) => rolesIncludeCode([r], code)))
          );

    const query = searchQuery.trim().toLowerCase();
    const bySearch = query
      ? byRole.filter(
          (m) =>
            m.displayName.toLowerCase().includes(query) || m.email.toLowerCase().includes(query)
        )
      : byRole;

    return [...bySearch].sort((a, b) => {
      if (sortBy === "last-login") {
        const aTime = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
        const bTime = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
        return bTime - aTime;
      }
      const aName = (a.displayName || a.email).toLowerCase();
      const bName = (b.displayName || b.email).toLowerCase();
      return aName.localeCompare(bName, "es");
    });
  }, [members, activeGroup, statusFilter, searchQuery, sortBy]);

  const openMemberDrawer = useCallback(
    (member: UserCmsCardData, mode: UserMemberDrawerMode) => {
      setOpenCardPanel(null);
      setDrawer({
        mode,
        target: {
          membershipId: member.membershipId,
          displayName: member.displayName || member.email,
          isProtected: isProtectedMember(member.roles),
        },
      });
    },
    []
  );

  async function handleInvite(payload: {
    email: string;
    displayName: string;
    roleCode: string;
  }) {
    setError("");
    const res = await fetch("/api/identity/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: payload.email,
        displayName: payload.displayName,
        roleCode: payload.roleCode,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error ?? "No se pudo enviar la invitación");
      throw new Error(data.error);
    }
    await loadTeam();
  }

  async function handleRoleChange(membershipId: string, roleCode: string) {
    setRoleSavingId(membershipId);
    setError("");
    const res = await fetch(`/api/identity/members/${membershipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleCode }),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error ?? "No se pudo actualizar el rol");
      setRoleSavingId(null);
      return;
    }
    await loadTeam();
    setRoleSavingId(null);
    setOpenCardPanel(null);
  }

  async function handleMemberAction(membershipId: string, action: MemberAction) {
    const member = members.find((m) => m.membershipId === membershipId);
    const label = member?.displayName || member?.email || "este usuario";
    const copy = MEMBER_ACTION_COPY[action];
    const ok = await confirm({
      ...copy,
      title: copy.title,
      description: `${copy.description}\n\nUsuario: ${label}`,
    });
    if (!ok) return;

    setMemberActionSaving({ membershipId, action });
    setError("");
    const res = await fetch(
      `/api/identity/members/${encodeURIComponent(membershipId)}?action=${action}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (!data.ok) {
      setError(data.error ?? "No se pudo completar la acción");
      setMemberActionSaving(null);
      return;
    }
    await loadTeam();
    setMemberActionSaving(null);
    setOpenCardPanel(null);
  }

  async function handleCancelInvitation(invitationId: string, email: string) {
    const ok = await confirm({
      title: "Cancelar invitación",
      description: `¿Cancelar la invitación enviada a ${email}? El enlace dejará de funcionar de inmediato.`,
      confirmLabel: "Cancelar invitación",
      destructive: true,
    });
    if (!ok) return;

    setInvitationRevokingId(invitationId);
    setError("");
    const res = await fetch("/api/identity/invitations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitationId }),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error ?? "No se pudo cancelar la invitación");
      setInvitationRevokingId(null);
      return;
    }
    await loadTeam();
    setInvitationRevokingId(null);
  }

  if (loading) {
    return <p className="text-sm text-muted">Cargando usuarios del CMS…</p>;
  }

  return (
    <div className="users-cms-page">
      {confirmDialog}
      <UserMemberDrawer
        target={drawer?.target ?? null}
        mode={drawer?.mode ?? null}
        onClose={() => setDrawer(null)}
      />

      <div className="users-cms-toolbar">
        <div className="users-cms-tabs" role="tablist" aria-label="Secciones de usuarios CMS">
          {(
            [
              { id: "team" as const, label: "Equipo", badge: activeMemberCount },
              { id: "invite" as const, label: "Invitar", badge: invitations.length },
              { id: "activity" as const, label: "Actividad" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn("users-cms-tab", activeTab === tab.id && "users-cms-tab--active")}
            >
              {tab.label}
              {"badge" in tab && tab.badge > 0 ? (
                <span className="users-cms-tab-badge">{tab.badge}</span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="users-cms-toolbar-actions">
          {activeTab !== "invite" ? (
            <Button
              type="button"
              size="sm"
              onClick={() => setActiveTab("invite")}
              className="shrink-0"
            >
              <UserPlus className="mr-1.5 h-4 w-4" aria-hidden />
              Crear usuario
            </Button>
          ) : null}
        </div>
      </div>

      {compatMode ? (
        <div className="rounded-xl border border-[var(--state-warning-border)] bg-[var(--state-warning-bg)] px-4 py-3 text-sm text-[var(--color-warning)]">
          Este entorno permite acceder al CMS sin iniciar sesión. Activa el modo seguro en producción.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-[var(--state-danger-border)] bg-[var(--state-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      ) : null}

      {activeTab === "team" ? (
        <section className="space-y-3" role="tabpanel">
          {invitations.length > 0 ? (
            <button
              type="button"
              onClick={() => setActiveTab("invite")}
              className="flex w-full items-center gap-2 rounded-lg border border-[var(--state-warning-border)] bg-[var(--state-warning-bg)] px-3 py-2 text-left text-sm text-[var(--color-warning)] hover:opacity-90"
            >
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              <span>
                {invitations.length} invitación{invitations.length === 1 ? "" : "es"} pendiente
                {invitations.length === 1 ? "" : "s"} — revisar
              </span>
            </button>
          ) : null}

          <div className="users-cms-controls">
            <label className="users-cms-search">
              <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o correo…"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </label>
            <select
              value={activeGroup}
              onChange={(e) => {
                setActiveGroup(e.target.value);
                setOpenCardPanel(null);
              }}
              className="users-cms-select"
              aria-label="Filtrar por rol"
            >
              {CMS_USER_GROUPS.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.label}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="users-cms-select"
              aria-label="Ordenar usuarios"
            >
              <option value="name">Nombre A–Z</option>
              <option value="last-login">Último acceso</option>
            </select>
          </div>

          <div className="users-cms-filters">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: "active" as const, label: "Activos" },
                  { id: "suspended" as const, label: "Suspendidos" },
                  { id: "archived" as const, label: "Archivados" },
                  { id: "all" as const, label: "Todos" },
                ] as const
              ).map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(filter.id);
                    setOpenCardPanel(null);
                  }}
                  className={cn(
                    "users-cms-filter-chip",
                    statusFilter === filter.id && "users-cms-filter-chip--active"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted">
              {filteredMembers.length} colaborador{filteredMembers.length === 1 ? "" : "es"}
            </span>
          </div>

          <div className="users-cms-grid">
            {filteredMembers.map((member) => (
              <UserCmsCard
                key={member.membershipId}
                member={member}
                assignableRoles={assignableRoles}
                activePanel={
                  openCardPanel?.membershipId === member.membershipId ? openCardPanel.panel : null
                }
                onPanelToggle={(panel) => handlePanelToggle(member.membershipId, panel)}
                onOpenDrawer={(mode) => openMemberDrawer(member, mode)}
                saving={roleSavingId === member.membershipId}
                actionSaving={
                  memberActionSaving?.membershipId === member.membershipId
                    ? memberActionSaving.action
                    : null
                }
                onRoleChange={handleRoleChange}
                onMemberAction={handleMemberAction}
              />
            ))}
          </div>

          {filteredMembers.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted">
              No hay usuarios en este filtro.
            </p>
          ) : null}
        </section>
      ) : null}

      {activeTab === "invite" ? (
        <section className="users-cms-invite-layout" role="tabpanel">
          <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
            <button
              type="button"
              onClick={() => setActiveTab("team")}
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Volver al equipo
            </button>
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserPlus className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Crear usuario</h3>
                <p className="mt-0.5 text-xs text-muted">
                  Invita por correo · el enlace expira en 30 minutos.
                </p>
              </div>
            </div>
            <InviteUserWizard
              embedded
              onSubmit={handleInvite}
              error={error}
              assignableRoles={assignableRoles}
            />
          </div>

          <div className="users-cms-pending-card">
            <h3 className="text-sm font-semibold text-foreground">Invitaciones pendientes</h3>
            <p className="mt-0.5 text-xs text-muted">
              Enlaces activos que aún no han sido aceptados.
            </p>
            {invitations.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {invitations.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background-soft px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{inv.displayName || inv.email}</p>
                      <p className="truncate text-xs text-muted">{inv.email}</p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {inv.roles.map((r) => r.label).join(", ")} · expira{" "}
                        {new Date(inv.expiresAt).toLocaleString("es-CL", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={invitationRevokingId === inv.id}
                      onClick={() => handleCancelInvitation(inv.id, inv.email)}
                      className="shrink-0 rounded-lg border border-[var(--state-danger-border)] px-2.5 py-1 text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--state-danger-bg)] disabled:opacity-50"
                    >
                      {invitationRevokingId === inv.id ? "Cancelando…" : "Cancelar"}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted">
                No hay invitaciones pendientes.
              </p>
            )}
          </div>
        </section>
      ) : null}

      {activeTab === "activity" ? (
        <section className="rounded-xl border border-border bg-background p-4 sm:p-5" role="tabpanel">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" aria-hidden />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Actividad reciente</h3>
                <p className="text-xs text-muted">Últimos cambios de accesos y roles en el CMS.</p>
              </div>
            </div>
            <Link
              href="/admin/settings/activity"
              className="text-xs font-medium text-primary hover:underline"
            >
              Ver historial completo
            </Link>
          </div>
          <AuditTimeline entries={audit.slice(0, 20)} compact />
        </section>
      ) : null}
    </div>
  );
}
