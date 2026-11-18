"use client";

import { useCallback, useEffect, useState } from "react";
import { DesktopAvatar } from "@/components/desktop/DesktopAvatar";
import { DesktopSwitchGroup, DesktopSwitchRow } from "@/components/desktop/DesktopSwitch";
import {
  MENTOR_APPS,
  mentorAppBlurb,
  mentorAppLabel,
  type MentorAppId,
} from "@/lib/desktop/catalog";
import { resolveDesktopAvatar } from "@/lib/desktop/avatar-catalog";
import { isValidEmail, isValidFullName } from "@/lib/validation/identity";
import { inviteCreateFeedback } from "@/lib/desktop/invite-delivery";
import {
  canResendInvitation,
  filterTeamDirectory,
  filterTeamInvitations,
  invitationStatusLabel,
  membershipStatusLabel,
  profileOptions,
  sameAppSet,
} from "@/lib/desktop/team-directory";

type AssignableRole = {
  id: string;
  name: string;
  code: string;
  label: string;
};

type TeamRole = {
  id: string;
  name: string;
  code?: string;
  label: string;
};

type TeamMember = {
  membershipId: string;
  userId: string;
  displayName: string;
  email: string;
  avatarPresetId?: string | null;
  avatarPhoto?: boolean;
  avatarPhotoUpdatedAt?: string | null;
  status: string;
  authorizedApps: MentorAppId[];
  roles: TeamRole[];
};

type TeamInvitation = {
  id: string;
  email: string;
  displayName: string;
  status: string;
  expiresAt: string;
  roles: TeamRole[];
};

function MemberDetail({
  member,
  plan,
  assignableRoles,
  busyAction,
  savingId,
  self,
  onBack,
  onRole,
  onToggleApp,
  onResend,
  onRemove,
  onSuspend,
  onRestore,
}: {
  member: TeamMember;
  plan: readonly MentorAppId[];
  assignableRoles: AssignableRole[];
  busyAction: string | null;
  savingId: string | null;
  self: boolean;
  onBack: () => void;
  onRole: (roleId: string) => void;
  onToggleApp: (appId: MentorAppId) => void;
  onResend: () => void;
  onRemove: () => void;
  onSuspend: () => void;
  onRestore: () => void;
}) {
  const currentRoleId = member.roles[0]?.id ?? "";
  const known = assignableRoles.some((role) => role.id === currentRoleId);
  const accessOn = member.status === "active";
  const accessBusy =
    busyAction === `suspend:${member.membershipId}` ||
    busyAction === `restore:${member.membershipId}`;
  return (
    <div className="team-form">
      <button type="button" className="ghost team-back" onClick={onBack}>
        Volver a la lista
      </button>
      <div className="team-person">
        <DesktopAvatar
          view={resolveDesktopAvatar({
            displayName: member.displayName,
            email: member.email,
            avatarPresetId: member.avatarPresetId,
            avatarPhoto: member.avatarPhoto,
            avatarPhotoUpdatedAt: member.avatarPhotoUpdatedAt ?? undefined,
            userId: member.userId,
          })}
        />
        <div className="team-person-copy">
          <strong>{member.displayName || member.email}</strong>
          <span>{member.email}</span>
        </div>
      </div>
      <p className="team-pills">
        <span className={`team-pill${member.status === "active" ? "" : " is-warn"}`}>
          {membershipStatusLabel(member.status)}
        </span>
      </p>
      {assignableRoles.length > 0 ? (
        <label className="team-role">
          <span>Perfil</span>
          <select
            aria-label="Perfil de la persona"
            value={known ? currentRoleId : currentRoleId}
            disabled={busyAction === `role:${member.membershipId}`}
            onChange={(event) => onRole(event.target.value)}
          >
            {!known && currentRoleId ? (
              <option value={currentRoleId}>{member.roles[0]?.label || "Perfil actual"}</option>
            ) : null}
            {assignableRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.label || role.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <DesktopSwitchGroup
        label="Acceso"
        note={
          self
            ? "Tu acceso no se apaga desde aquí."
            : "Si lo apagas, la persona deja de entrar a este Espacio."
        }
      >
        <DesktopSwitchRow
          title="Puede entrar"
          detail={membershipStatusLabel(member.status)}
          checked={accessOn}
          disabled={self || accessBusy}
          onChange={(next) => {
            if (next) onRestore();
            else onSuspend();
          }}
        />
      </DesktopSwitchGroup>
      {plan.length === 0 ? (
        <p className="ajustes-wait">Sin aplicaciones contratadas: no hay llaves que repartir.</p>
      ) : (
        <DesktopSwitchGroup
          label="Aplicaciones"
          note="Llaves que esta persona puede abrir."
        >
          {plan.map((appId) => (
            <DesktopSwitchRow
              key={appId}
              mark={appId}
              title={mentorAppLabel(appId)}
              detail={mentorAppBlurb(appId)}
              checked={member.authorizedApps.includes(appId)}
              disabled={savingId === member.membershipId}
              onChange={() => onToggleApp(appId)}
            />
          ))}
        </DesktopSwitchGroup>
      )}
      <div className="team-member-actions">
        <button
          type="button"
          className="ghost"
          disabled={busyAction === `resend-member:${member.membershipId}`}
          onClick={onResend}
        >
          Reenviar acceso
        </button>
        {!self ? (
          <button
            type="button"
            className="ghost is-danger"
            disabled={busyAction === `remove:${member.membershipId}`}
            onClick={onRemove}
          >
            Quitar acceso
          </button>
        ) : null}
      </div>
    </div>
  );
}

function humanizeTeamError(raw: unknown, fallback: string): string {
  if (typeof raw !== "string" || !raw.trim()) return fallback;
  return raw.trim();
}

export function DesktopSpaceTeam({
  contractedApps,
  onBack,
  onDirtyChange,
}: {
  contractedApps: readonly MentorAppId[];
  onBack?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [assignableRoles, setAssignableRoles] = useState<AssignableRole[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [plan, setPlan] = useState<MentorAppId[]>([...contractedApps]);

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [inviteApps, setInviteApps] = useState<MentorAppId[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [appFilter, setAppFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [callerMembershipId, setCallerMembershipId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/identity/team").catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      members?: TeamMember[];
      invitations?: TeamInvitation[];
      assignableRoles?: AssignableRole[];
      callerMembershipId?: string | null;
      contractedApps?: MentorAppId[];
      error?: string;
    } | null;
    if (!response?.ok || !body?.ok) {
      setError(body?.error || "No se pudo cargar el equipo.");
      setMembers([]);
      setInvitations([]);
      return;
    }
    setError("");
    const nextPlan = Array.isArray(body.contractedApps)
      ? body.contractedApps
      : [...contractedApps];
    setPlan(nextPlan);
    setMembers(body.members ?? []);
    setInvitations(body.invitations ?? []);
    const roles = body.assignableRoles ?? [];
    setAssignableRoles(roles);
    setCallerMembershipId(body.callerMembershipId ?? null);
    setInviteRoleId((current) => current || roles[0]?.id || "");
    setInviteApps((current) =>
      current.length > 0 ? current.filter((id) => nextPlan.includes(id)) : [...nextPlan]
    );
  }, [contractedApps]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        if (cancelled) return;
        await load();
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [load]);

  async function toggleApp(member: TeamMember, appId: MentorAppId) {
    if (!plan.includes(appId) || savingId) return;
    const next = member.authorizedApps.includes(appId)
      ? member.authorizedApps.filter((id) => id !== appId)
      : MENTOR_APPS.filter(
          (id) => member.authorizedApps.includes(id) || id === appId
        );
    setSavingId(member.membershipId);
    setError("");
    setNotice("");
    const response = await fetch(
      `/api/identity/members/${encodeURIComponent(member.membershipId)}/apps`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorizedApps: next }),
      }
    ).catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      membership?: { authorizedApps?: MentorAppId[] };
    } | null;
    if (!response?.ok || !body?.ok) {
      setError(humanizeTeamError(body?.error, "No se pudo guardar el acceso."));
      setSavingId(null);
      return;
    }
    setMembers((current) =>
      (current ?? []).map((row) =>
        row.membershipId === member.membershipId
          ? {
              ...row,
              authorizedApps: body.membership?.authorizedApps ?? next,
            }
          : row
      )
    );
    setSavingId(null);
  }

  async function changeRole(member: TeamMember, roleId: string) {
    const role = assignableRoles.find((item) => item.id === roleId);
    if (!role || busyAction) return;
    if (member.roles[0]?.id === role.id) return;
    setBusyAction(`role:${member.membershipId}`);
    setError("");
    setNotice("");
    const response = await fetch(
      `/api/identity/members/${encodeURIComponent(member.membershipId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(role.code ? { roleCode: role.code } : { roleId: role.id }),
      }
    ).catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
    } | null;
    if (!response?.ok || !body?.ok) {
      setError(humanizeTeamError(body?.error, "No se pudo cambiar el rol."));
      setBusyAction(null);
      return;
    }
    await load();
    setBusyAction(null);
    setNotice("Rol actualizado.");
  }

  async function removeAccess(member: TeamMember) {
    const label = member.displayName || member.email;
    const ok = window.confirm(
      `¿Quitar acceso a ${label}?\nYa no podrá entrar a este Espacio.`
    );
    if (!ok || busyAction) return;
    setBusyAction(`remove:${member.membershipId}`);
    setError("");
    setNotice("");
    const response = await fetch(
      `/api/identity/members/${encodeURIComponent(member.membershipId)}?action=remove-access`,
      { method: "DELETE" }
    ).catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
    } | null;
    if (!response?.ok || !body?.ok) {
      setError(humanizeTeamError(body?.error, "No se pudo quitar el acceso."));
      setBusyAction(null);
      return;
    }
    await load();
    setBusyAction(null);
    setNotice(`Se quitó el acceso de ${label}.`);
    if (selectedId === member.membershipId) setSelectedId(null);
  }

  async function changeMembership(member: TeamMember, action: "suspend" | "restore") {
    const label = member.displayName || member.email;
    const verb = action === "suspend" ? "suspender" : "reactivar";
    const ok = window.confirm(`¿Confirmas ${verb} a ${label} en este Espacio?`);
    if (!ok || busyAction) return;
    setBusyAction(`${action}:${member.membershipId}`);
    setError("");
    setNotice("");
    const actionQuery = action === "suspend" ? "?action=suspend" : "?action=restore";
    const response = await fetch(
      `/api/identity/members/${encodeURIComponent(member.membershipId)}${actionQuery}`,
      { method: "DELETE" }
    ).catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
    } | null;
    if (!response?.ok || !body?.ok) {
      setError(humanizeTeamError(body?.error, "No se pudo actualizar la membresía."));
      setBusyAction(null);
      return;
    }
    await load();
    setBusyAction(null);
    setNotice(action === "suspend" ? `Se suspendió a ${label}.` : `Se reactivó a ${label}.`);
  }

  async function resendAccess(member: TeamMember) {
    const label = member.displayName || member.email;
    const ok = window.confirm(
      `¿Reenviar acceso a ${label}?\nEnviaremos un correo a ${member.email}.`
    );
    if (!ok || busyAction) return;
    setBusyAction(`resend-member:${member.membershipId}`);
    setError("");
    setNotice("");
    const response = await fetch(
      `/api/identity/members/${encodeURIComponent(member.membershipId)}/resend-access`,
      { method: "POST" }
    ).catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      message?: string;
    } | null;
    if (!response?.ok || !body?.ok) {
      setError(humanizeTeamError(body?.error, "No se pudo reenviar el acceso."));
      setBusyAction(null);
      return;
    }
    setBusyAction(null);
    setNotice(body.message || `Enviamos el correo de acceso a ${member.email}.`);
  }

  async function cancelInvitation(invitation: TeamInvitation) {
    const ok = window.confirm(
      `¿Cancelar la invitación a ${invitation.email}? Dejará de funcionar de inmediato.`
    );
    if (!ok || busyAction) return;
    setBusyAction(`cancel-invite:${invitation.id}`);
    setError("");
    setNotice("");
    const response = await fetch("/api/identity/invitations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitationId: invitation.id }),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
    } | null;
    if (!response?.ok || !body?.ok) {
      setError(humanizeTeamError(body?.error, "No se pudo cancelar la invitación."));
      setBusyAction(null);
      return;
    }
    await load();
    setBusyAction(null);
    setNotice(`Invitación a ${invitation.email} cancelada.`);
  }

  async function resendInvitation(invitation: TeamInvitation) {
    const ok = window.confirm(
      `¿Reenviar la invitación a ${invitation.email}? El enlace anterior dejará de funcionar.`
    );
    if (!ok || busyAction) return;
    setBusyAction(`resend-invite:${invitation.id}`);
    setError("");
    setNotice("");
    const response = await fetch("/api/identity/invitations/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitationId: invitation.id }),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      message?: string;
    } | null;
    if (!response?.ok || !body?.ok) {
      setError(humanizeTeamError(body?.error, "No se pudo reenviar la invitación."));
      setBusyAction(null);
      return;
    }
    await load();
    setBusyAction(null);
    setNotice(body.message || `Reenviamos la invitación a ${invitation.email}.`);
  }

  function toggleInviteApp(appId: MentorAppId) {
    if (!plan.includes(appId)) return;
    setInviteApps((current) =>
      current.includes(appId)
        ? current.filter((id) => id !== appId)
        : MENTOR_APPS.filter((id) => current.includes(id) || id === appId)
    );
  }

  async function sendInvite() {
    setNameError("");
    setEmailError("");
    setError("");
    setNotice("");

    let valid = true;
    if (!inviteName.trim()) {
      setNameError("El nombre es obligatorio.");
      valid = false;
    } else if (!isValidFullName(inviteName)) {
      setNameError("Ingresa nombre y apellido.");
      valid = false;
    }
    if (!inviteEmail.trim()) {
      setEmailError("El correo es obligatorio.");
      valid = false;
    } else if (!isValidEmail(inviteEmail)) {
      setEmailError("Ingresa un correo válido.");
      valid = false;
    }
    const role =
      assignableRoles.find((item) => item.id === inviteRoleId) ?? assignableRoles[0];
    if (!role?.id) {
      setError("No hay un rol disponible para invitar.");
      valid = false;
    }
    if (!valid || !role?.id || busyAction) return;

    setBusyAction("invite");
    const response = await fetch("/api/identity/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail.trim(),
        displayName: inviteName.trim(),
        roleId: role.id,
        roleCode: role.code,
        authorizedApps: inviteApps,
      }),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      emailSent?: boolean;
      deliveryError?: string;
      error?: string;
    } | null;
    const feedback = inviteCreateFeedback({
      ok: Boolean(response?.ok && body?.ok),
      emailSent: body?.emailSent === true,
      deliveryError: body?.deliveryError,
      error: body?.error ?? (response ? undefined : "No se pudo crear la invitación."),
    });
    if (feedback.status === "not_created") {
      setError(humanizeTeamError(feedback.message, "No se pudo crear la invitación."));
      setBusyAction(null);
      return;
    }
    setInviteName("");
    setInviteEmail("");
    setInviteRoleId(assignableRoles[0]?.id || "");
    setInviteApps([...plan]);
    setInviteOpen(false);
    await load();
    setBusyAction(null);
    setNotice(feedback.message);
  }

  const selectedInviteRole =
    assignableRoles.find((role) => role.id === inviteRoleId) ?? assignableRoles[0];
  const people = filterTeamDirectory(members ?? [], {
    query,
    status: statusFilter,
    roleId: roleFilter,
    appId: appFilter,
  });
  const visibleInvites = invitations.filter(
    (invitation) => filterTeamInvitations([invitation], query).length > 0
  );
  const profiles = profileOptions(members ?? []);
  const selected = members?.find((member) => member.membershipId === selectedId) ?? null;
  const inviteDirty =
    inviteOpen &&
    Boolean(inviteName.trim() || inviteEmail.trim() || !sameAppSet(inviteApps, plan));

  useEffect(() => {
    onDirtyChange?.(inviteDirty);
    return () => onDirtyChange?.(false);
  }, [inviteDirty, onDirtyChange]);

  return (
    <div className="space-presence team-panel">
      {onBack ? (
        <div className="space-presence-bar">
          <button type="button" className="ghost" onClick={onBack}>
            Volver
          </button>
        </div>
      ) : null}

      <div className="team-toolbar">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre o correo"
          aria-label="Buscar personas"
        />
        <select
          aria-label="Filtrar por estado"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">Estado</option>
          <option value="active">Activos</option>
          <option value="suspended">Suspendidos</option>
          <option value="archived">Archivados</option>
          <option value="invited">Invitados</option>
        </select>
        <select
          aria-label="Filtrar por perfil"
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
        >
          <option value="all">Perfil</option>
          {profiles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por aplicación"
          value={appFilter}
          onChange={(event) => setAppFilter(event.target.value)}
        >
          <option value="all">App</option>
          {plan.map((appId) => (
            <option key={appId} value={appId}>
              {mentorAppLabel(appId)}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="primary"
          onClick={() => {
            setInviteOpen((open) => !open);
            setError("");
            setNotice("");
          }}
          disabled={assignableRoles.length === 0}
        >
          {inviteOpen ? "Cerrar" : "Agregar persona"}
        </button>
      </div>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="form-ok" role="status">
          {notice}
        </p>
      ) : null}

      {inviteOpen ? (
        <section className="team-invite" aria-label="Invitar persona">
          <div className="team-invite-grid">
            <label>
              <span>Nombre completo</span>
              <input
                type="text"
                value={inviteName}
                onChange={(event) => setInviteName(event.target.value)}
                autoComplete="name"
              />
              {nameError ? (
                <em className="form-error" role="alert">
                  {nameError}
                </em>
              ) : null}
            </label>
            <label>
              <span>Correo</span>
              <input
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                autoComplete="email"
              />
              {emailError ? (
                <em className="form-error" role="alert">
                  {emailError}
                </em>
              ) : null}
            </label>
            <label>
              <span>Perfil / rol</span>
              <select
                value={selectedInviteRole?.id ?? ""}
                onChange={(event) => setInviteRoleId(event.target.value)}
                disabled={assignableRoles.length === 0}
              >
                {assignableRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.label || role.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {plan.length > 0 ? (
            <DesktopSwitchGroup label="Aplicaciones" note="Llaves que recibirá al aceptar.">
              {plan.map((appId) => (
                <DesktopSwitchRow
                  key={appId}
                  mark={appId}
                  title={mentorAppLabel(appId)}
                  detail={mentorAppBlurb(appId)}
                  checked={inviteApps.includes(appId)}
                  onChange={() => toggleInviteApp(appId)}
                />
              ))}
            </DesktopSwitchGroup>
          ) : (
            <p className="ajustes-wait">
              Este Espacio no tiene aplicaciones contratadas. La persona entrará sin
              llaves de app.
            </p>
          )}

          <div className="team-invite-actions">
            <button
              type="button"
              className="primary"
              onClick={() => void sendInvite()}
              disabled={busyAction === "invite" || assignableRoles.length === 0}
            >
              {busyAction === "invite" ? "Enviando…" : "Enviar invitación"}
            </button>
          </div>
        </section>
      ) : null}

      {visibleInvites.length > 0 ? (
        <section className="team-section" aria-label="Invitaciones pendientes">
          <h4>Invitaciones pendientes</h4>
          <ul className="team-keys">
            {visibleInvites.map((invitation) => (
              <li key={invitation.id}>
                <div className="team-keys-head">
                  <strong>{invitation.displayName || invitation.email}</strong>
                  <span>
                    {invitation.roles.map((role) => role.label).join(" · ") ||
                      invitationStatusLabel(invitation.status)}
                  </span>
                </div>
                <p className="account-line">{invitation.email}</p>
                <div className="team-member-actions">
                  {canResendInvitation(invitation.status) ? (
                    <button
                      type="button"
                      className="ghost"
                      disabled={busyAction === `resend-invite:${invitation.id}`}
                      onClick={() => void resendInvitation(invitation)}
                    >
                      Reenviar
                    </button>
                  ) : (
                    <span className="team-pill is-warn">{invitationStatusLabel(invitation.status)}</span>
                  )}
                  {invitation.status === "pending" ? (
                    <button
                      type="button"
                      className="ghost is-danger"
                      disabled={busyAction === `cancel-invite:${invitation.id}`}
                      onClick={() => void cancelInvitation(invitation)}
                    >
                      Cancelar
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="team-section" aria-label="Personas del Espacio">
        <h4>Personas</h4>
        {members === null ? <p className="ajustes-wait">Cargando equipo…</p> : null}
        {members && members.length === 0 && !error ? (
          <p className="ajustes-wait">Todavía no hay personas en este Espacio.</p>
        ) : null}
        {members && members.length > 0 && people.length === 0 ? (
          <p className="ajustes-wait">No hay personas con ese criterio.</p>
        ) : null}

        {members && people.length > 0 ? (
          <div className={`team-desk${selected ? " is-detail" : ""}`}>
            <ul className="team-list team-list-pane">
              {people.map((member) => (
                <li key={member.membershipId}>
                  <button
                    type="button"
                    className={`team-row${selected?.membershipId === member.membershipId ? " is-on" : ""}`}
                    onClick={() => setSelectedId(member.membershipId)}
                  >
                    <DesktopAvatar
                      view={resolveDesktopAvatar({
                        displayName: member.displayName,
                        email: member.email,
                        avatarPresetId: member.avatarPresetId,
                        avatarPhoto: member.avatarPhoto,
                        avatarPhotoUpdatedAt: member.avatarPhotoUpdatedAt ?? undefined,
                        userId: member.userId,
                      })}
                    />
                    <span className="team-row-copy">
                      <strong>{member.displayName || member.email}</strong>
                      <span>{member.email}</span>
                      <span className="team-pills">
                        <span className="team-pill">
                          {member.roles.map((role) => role.label).join(" · ") || "Sin perfil"}
                        </span>
                        <span className={`team-pill${member.status === "active" ? "" : " is-warn"}`}>
                          {membershipStatusLabel(member.status)}
                        </span>
                        {member.authorizedApps.map((appId) => (
                          <span key={appId} className="team-pill">
                            {mentorAppLabel(appId)}
                          </span>
                        ))}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="team-detail">
              {selected ? (
                <MemberDetail
                  member={selected}
                  plan={plan}
                  assignableRoles={assignableRoles}
                  busyAction={busyAction}
                  savingId={savingId}
                  self={selected.membershipId === callerMembershipId}
                  onBack={() => setSelectedId(null)}
                  onRole={(roleId) => void changeRole(selected, roleId)}
                  onToggleApp={(appId) => void toggleApp(selected, appId)}
                  onResend={() => void resendAccess(selected)}
                  onRemove={() => void removeAccess(selected)}
                  onSuspend={() => void changeMembership(selected, "suspend")}
                  onRestore={() => void changeMembership(selected, "restore")}
                />
              ) : (
                <p className="team-note">Elige una persona para ver su ficha.</p>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
