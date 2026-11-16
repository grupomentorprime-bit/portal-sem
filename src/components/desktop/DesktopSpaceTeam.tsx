"use client";

import { useCallback, useEffect, useState } from "react";
import { DesktopAvatar } from "@/components/desktop/DesktopAvatar";
import {
  MENTOR_APPS,
  mentorAppLabel,
  type MentorAppId,
} from "@/lib/desktop/catalog";
import { resolveDesktopAvatar } from "@/lib/desktop/avatar-catalog";
import { isValidEmail, isValidFullName } from "@/lib/validation/identity";

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

function humanizeTeamError(raw: unknown, fallback: string): string {
  if (typeof raw !== "string" || !raw.trim()) return fallback;
  return raw.trim();
}

export function DesktopSpaceTeam({
  contractedApps,
  onBack,
}: {
  contractedApps: readonly MentorAppId[];
  onBack?: () => void;
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

  const load = useCallback(async () => {
    const response = await fetch("/api/identity/team").catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      members?: TeamMember[];
      invitations?: TeamInvitation[];
      assignableRoles?: AssignableRole[];
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

  async function changeRole(member: TeamMember, roleCode: string) {
    if (!roleCode || busyAction) return;
    const currentCode = member.roles[0]?.code;
    if (currentCode === roleCode) return;
    setBusyAction(`role:${member.membershipId}`);
    setError("");
    setNotice("");
    const response = await fetch(
      `/api/identity/members/${encodeURIComponent(member.membershipId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleCode }),
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
    if (!role?.code) {
      setError("No hay un rol disponible para invitar.");
      valid = false;
    }
    if (!valid || !role?.code || busyAction) return;

    setBusyAction("invite");
    const response = await fetch("/api/identity/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail.trim(),
        displayName: inviteName.trim(),
        roleCode: role.code,
        authorizedApps: inviteApps,
      }),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
    } | null;
    if (!response?.ok || !body?.ok) {
      setError(humanizeTeamError(body?.error, "No se pudo enviar la invitación."));
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
    setNotice("Invitación enviada. La persona recibirá un correo para unirse.");
  }

  const selectedInviteRole =
    assignableRoles.find((role) => role.id === inviteRoleId) ?? assignableRoles[0];

  return (
    <div className="space-presence team-panel">
      <div className={`space-presence-bar${onBack ? "" : " is-readonly"}`}>
        {onBack ? (
          <button type="button" className="ghost" onClick={onBack}>
            Volver
          </button>
        ) : null}
        <div>
          <h3>Equipo</h3>
          <p>
            Incorpora personas, asigna roles y reparte las llaves de las aplicaciones del
            plan.
          </p>
        </div>
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
          {inviteOpen ? "Cerrar invitación" : "Invitar persona"}
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
            <div
              className="team-keys-apps"
              role="group"
              aria-label="Aplicaciones al invitar"
            >
              {plan.map((appId) => {
                const on = inviteApps.includes(appId);
                return (
                  <label key={appId} className={on ? "is-on" : undefined}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleInviteApp(appId)}
                    />
                    <span>{mentorAppLabel(appId)}</span>
                  </label>
                );
              })}
            </div>
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

      {invitations.length > 0 ? (
        <section className="team-section" aria-label="Invitaciones pendientes">
          <h4>Invitaciones pendientes</h4>
          <ul className="team-keys">
            {invitations.map((invitation) => (
              <li key={invitation.id}>
                <div className="team-keys-head">
                  <strong>{invitation.displayName || invitation.email}</strong>
                  <span>
                    {invitation.roles.map((role) => role.label).join(" · ") ||
                      invitation.status}
                  </span>
                </div>
                <p className="account-line">{invitation.email}</p>
                <div className="team-member-actions">
                  <button
                    type="button"
                    className="ghost"
                    disabled={busyAction === `resend-invite:${invitation.id}`}
                    onClick={() => void resendInvitation(invitation)}
                  >
                    Reenviar
                  </button>
                  <button
                    type="button"
                    className="ghost is-danger"
                    disabled={busyAction === `cancel-invite:${invitation.id}`}
                    onClick={() => void cancelInvitation(invitation)}
                  >
                    Cancelar
                  </button>
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

        {members && members.length > 0 ? (
          <ul className="team-keys">
            {members.map((member) => {
              const roleCode = member.roles[0]?.code ?? "";
              const canEditRole = assignableRoles.length > 0;
              return (
                <li key={member.membershipId}>
                  <div className="person">
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
                    <div className="account-copy">
                      <div className="team-keys-head">
                        <strong>{member.displayName || member.email}</strong>
                        <span>
                          {member.roles.map((role) => role.label).join(" · ") ||
                            member.status}
                        </span>
                      </div>
                      <p className="account-line">{member.email}</p>
                    </div>
                  </div>

                  {canEditRole ? (
                    <label className="team-role">
                      <span>Perfil</span>
                      <select
                        value={
                          assignableRoles.some((role) => role.code === roleCode)
                            ? roleCode
                            : roleCode || ""
                        }
                        disabled={busyAction === `role:${member.membershipId}`}
                        onChange={(event) =>
                          void changeRole(member, event.target.value)
                        }
                      >
                        {!assignableRoles.some((role) => role.code === roleCode) &&
                        roleCode ? (
                          <option value={roleCode}>
                            {member.roles[0]?.label || roleCode}
                          </option>
                        ) : null}
                        {assignableRoles.map((role) => (
                          <option key={role.id} value={role.code}>
                            {role.label || role.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  {plan.length === 0 ? (
                    <p className="ajustes-wait">
                      Sin aplicaciones contratadas: no hay llaves que repartir.
                    </p>
                  ) : (
                    <div
                      className="team-keys-apps"
                      role="group"
                      aria-label={`Apps de ${member.displayName || member.email}`}
                    >
                      {plan.map((appId) => {
                        const on = member.authorizedApps.includes(appId);
                        return (
                          <label key={appId} className={on ? "is-on" : undefined}>
                            <input
                              type="checkbox"
                              checked={on}
                              disabled={savingId === member.membershipId}
                              onChange={() => void toggleApp(member, appId)}
                            />
                            <span>{mentorAppLabel(appId)}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  <div className="team-member-actions">
                    <button
                      type="button"
                      className="ghost"
                      disabled={busyAction === `resend-member:${member.membershipId}`}
                      onClick={() => void resendAccess(member)}
                    >
                      Reenviar acceso
                    </button>
                    <button
                      type="button"
                      className="ghost is-danger"
                      disabled={busyAction === `remove:${member.membershipId}`}
                      onClick={() => void removeAccess(member)}
                    >
                      Quitar acceso
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
