"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, UserPlus } from "lucide-react";
import { InviteUserWizard } from "@/components/admin/InviteUserWizard";
import {
  UserCmsCard,
  type AssignableRole,
  type MemberAction,
  type UserCmsCardData,
  type UserCmsCardPanel,
} from "@/components/admin/UserCmsCard";
import { useConfirmDialog } from "@/components/admin/kit/hooks/useConfirmDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import "@/styles/admin-users-cms.css";

type UsersCmsTab = "team" | "invite";

const LAST_ADMIN_API_HINT = /sin un Dueño o Administrador|LAST_SPACE_ADMIN|último administrador/i;

function humanizeTeamError(raw: string | undefined, fallback: string): string {
  const message = (raw ?? "").trim();
  if (!message) return fallback;
  if (LAST_ADMIN_API_HINT.test(message)) {
    return "No puedes quitar este acceso porque el Espacio debe tener al menos un administrador.";
  }
  if (/forbidden|no autorizado|permission|permiso/i.test(message)) {
    return "No tienes permiso para hacer esta acción.";
  }
  if (/already|ya (tiene|pertenece|existe)|409/i.test(message)) {
    return "Esta persona ya forma parte del Equipo.";
  }
  return message;
}

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
  const [activeTab, setActiveTab] = useState<UsersCmsTab>("team");
  const [searchQuery, setSearchQuery] = useState("");
  const [assignableRoles, setAssignableRoles] = useState<AssignableRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
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

    if (!teamRes.ok || !team.ok) {
      throw new Error(
        humanizeTeamError(team.error, "No se pudo cargar el Equipo. Inténtalo de nuevo.")
      );
    }

    setMembers(team.members ?? []);
    setInvitations(team.invitations ?? []);
    setAssignableRoles(team.assignableRoles ?? []);
    if (me.ok) setCompatMode(me.compatMode === true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadError("");
        setActionError("");
        await loadTeam();
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            humanizeTeamError(
              err instanceof Error ? err.message : undefined,
              "No se pudo cargar el Equipo. Inténtalo de nuevo."
            )
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadTeam]);

  const activeMembers = useMemo(
    () => members.filter((member) => member.status === "active"),
    [members]
  );

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const bySearch = query
      ? activeMembers.filter(
          (m) =>
            m.displayName.toLowerCase().includes(query) || m.email.toLowerCase().includes(query)
        )
      : activeMembers;

    return [...bySearch].sort((a, b) => {
      const aName = (a.displayName || a.email).toLowerCase();
      const bName = (b.displayName || b.email).toLowerCase();
      return aName.localeCompare(bName, "es");
    });
  }, [activeMembers, searchQuery]);

  async function handleInvite(payload: {
    email: string;
    displayName: string;
    roleCode: string;
  }) {
    setActionError("");
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
      const message = humanizeTeamError(data.error, "No se pudo enviar la invitación.");
      setActionError(message);
      throw new Error(message);
    }
    await loadTeam();
  }

  async function handleRoleChange(membershipId: string, roleCode: string) {
    setRoleSavingId(membershipId);
    setActionError("");
    const res = await fetch(`/api/identity/members/${membershipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleCode }),
    });
    const data = await res.json();
    if (!data.ok) {
      setActionError(humanizeTeamError(data.error, "No se pudo cambiar el rol."));
      setRoleSavingId(null);
      return;
    }
    await loadTeam();
    setRoleSavingId(null);
    setOpenCardPanel(null);
  }

  async function handleMemberAction(membershipId: string, action: MemberAction) {
    const member = members.find((m) => m.membershipId === membershipId);
    const label = member?.displayName || member?.email || "esta persona";
    const ok = await confirm({
      title: `¿Quitar acceso a ${label}?`,
      description: `${label} ya no podrá entrar a este Espacio.\nSi participa en otros Espacios, seguirá teniendo acceso a ellos.`,
      confirmLabel: "Quitar acceso",
      cancelLabel: "Cancelar",
      destructive: true,
    });
    if (!ok) return;

    setMemberActionSaving({ membershipId, action });
    setActionError("");
    const res = await fetch(
      `/api/identity/members/${encodeURIComponent(membershipId)}?action=remove-access`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (!data.ok) {
      setActionError(humanizeTeamError(data.error, "No se pudo quitar el acceso."));
      setMemberActionSaving(null);
      return;
    }
    await loadTeam();
    setMemberActionSaving(null);
    setOpenCardPanel(null);
  }

  async function handleCancelInvitation(invitationId: string, email: string) {
    const ok = await confirm({
      title: "¿Cancelar invitación?",
      description: `La invitación enviada a ${email} dejará de funcionar de inmediato.`,
      confirmLabel: "Cancelar invitación",
      cancelLabel: "Volver",
      destructive: true,
    });
    if (!ok) return;

    setInvitationRevokingId(invitationId);
    setActionError("");
    const res = await fetch("/api/identity/invitations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitationId }),
    });
    const data = await res.json();
    if (!data.ok) {
      setActionError(humanizeTeamError(data.error, "No se pudo cancelar la invitación."));
      setInvitationRevokingId(null);
      return;
    }
    await loadTeam();
    setInvitationRevokingId(null);
  }

  if (loading) {
    return (
      <p className="text-sm text-muted" data-team-loading>
        Cargando Equipo…
      </p>
    );
  }

  const invitationsBlock = (
    <div className="users-cms-pending-card" data-team-invitations>
      <h3 className="text-sm font-semibold text-foreground">Invitaciones pendientes</h3>
      <p className="mt-0.5 text-xs text-muted">
        Personas invitadas que aún no se han unido al Equipo.
      </p>
      {invitations.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {invitations.map((inv) => (
            <li
              key={inv.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background-soft px-3 py-2.5"
              data-team-invitation
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{inv.displayName || inv.email}</p>
                <p className="truncate text-xs text-muted">{inv.email}</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {inv.roles.map((r) => r.label).join(", ") || "Sin rol"} · Invitación pendiente
                </p>
              </div>
              <button
                type="button"
                disabled={invitationRevokingId === inv.id}
                onClick={() => handleCancelInvitation(inv.id, inv.email)}
                className="shrink-0 rounded-lg border border-[var(--state-danger-border)] px-2.5 py-1 text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--state-danger-bg)] disabled:opacity-50"
              >
                {invitationRevokingId === inv.id ? "Cancelando…" : "Cancelar invitación"}
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
  );

  return (
    <div className="users-cms-page" data-team-page>
      {confirmDialog}

      <div className="users-cms-toolbar">
        <div className="users-cms-tabs" role="tablist" aria-label="Secciones de Equipo">
          {(
            [
              { id: "team" as const, label: "Equipo", badge: activeMembers.length },
              { id: "invite" as const, label: "Invitar", badge: invitations.length },
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
              data-team-invite-cta
            >
              <UserPlus className="mr-1.5 h-4 w-4" aria-hidden />
              Invitar persona
            </Button>
          ) : null}
        </div>
      </div>

      {compatMode ? (
        <div className="rounded-xl border border-[var(--state-warning-border)] bg-[var(--state-warning-bg)] px-4 py-3 text-sm text-[var(--color-warning)]">
          Este entorno permite acceder al panel sin iniciar sesión. Activa el modo seguro en producción.
        </div>
      ) : null}

      {loadError ? (
        <div
          className="rounded-xl border border-[var(--state-danger-border)] bg-[var(--state-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger)]"
          data-team-error
          role="alert"
        >
          <p>{loadError}</p>
          <button
            type="button"
            className="mt-2 text-xs font-medium underline underline-offset-2"
            onClick={() => {
              setLoadError("");
              setLoading(true);
              void loadTeam()
                .catch((err) => {
                  setLoadError(
                    humanizeTeamError(
                      err instanceof Error ? err.message : undefined,
                      "No se pudo cargar el Equipo. Inténtalo de nuevo."
                    )
                  );
                })
                .finally(() => setLoading(false));
            }}
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {actionError && activeTab === "team" ? (
        <div
          className="rounded-xl border border-[var(--state-danger-border)] bg-[var(--state-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger)]"
          data-team-action-error
          role="alert"
        >
          {actionError}
        </div>
      ) : null}

      {activeTab === "team" ? (
        <section className="space-y-4" role="tabpanel" data-team-list>
          {invitations.length > 0 ? invitationsBlock : null}

          <div className="users-cms-controls">
            <label className="users-cms-search">
              <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o correo…"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                aria-label="Buscar en el Equipo"
              />
            </label>
            <span className="text-xs text-muted sm:justify-self-end">
              {filteredMembers.length} persona{filteredMembers.length === 1 ? "" : "s"}
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
            <div
              className="rounded-xl border border-dashed border-border px-4 py-10 text-center"
              data-team-empty
            >
              {searchQuery.trim() ? (
                <>
                  <p className="text-sm font-medium text-foreground">
                    No hay coincidencias en el Equipo.
                  </p>
                  <p className="mt-1 text-sm text-muted">Prueba con otro nombre o correo.</p>
                  <button
                    type="button"
                    className="mt-3 text-sm font-medium text-primary hover:underline"
                    onClick={() => setSearchQuery("")}
                  >
                    Limpiar búsqueda
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground">
                    Sin colaboradores adicionales
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Cuando invites a alguien, aparecerá aquí con su rol.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-4"
                    onClick={() => setActiveTab("invite")}
                  >
                    <UserPlus className="mr-1.5 h-4 w-4" aria-hidden />
                    Invitar persona
                  </Button>
                </>
              )}
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === "invite" ? (
        <section className="users-cms-invite-layout" role="tabpanel" data-team-invite>
          <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
            <button
              type="button"
              onClick={() => setActiveTab("team")}
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Volver al Equipo
            </button>
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserPlus className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Invitar persona</h3>
                <p className="mt-0.5 text-xs text-muted">
                  Nombre, correo y rol. Recibirá un enlace para unirse a este Espacio.
                </p>
              </div>
            </div>
            <InviteUserWizard
              embedded
              onSubmit={handleInvite}
              error={actionError}
              assignableRoles={assignableRoles}
            />
          </div>

          {invitationsBlock}
        </section>
      ) : null}
    </div>
  );
}
