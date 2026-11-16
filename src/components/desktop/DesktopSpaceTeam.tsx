"use client";

import { useCallback, useEffect, useState } from "react";
import { DesktopAvatar } from "@/components/desktop/DesktopAvatar";
import {
  MENTOR_APPS,
  mentorAppLabel,
  type MentorAppId,
} from "@/lib/desktop/catalog";
import { resolveDesktopAvatar } from "@/lib/desktop/avatar-catalog";

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
  roles: Array<{ label: string }>;
};

export function DesktopSpaceTeam({
  contractedApps,
  onBack,
}: {
  contractedApps: readonly MentorAppId[];
  onBack?: () => void;
}) {
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [plan, setPlan] = useState<MentorAppId[]>([...contractedApps]);

  const load = useCallback(async () => {
    const response = await fetch("/api/identity/team").catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      members?: TeamMember[];
      contractedApps?: MentorAppId[];
      error?: string;
    } | null;
    if (!response?.ok || !body?.ok) {
      setError(body?.error || "No se pudo cargar el equipo.");
      setMembers([]);
      return;
    }
    setError("");
    setPlan(
      Array.isArray(body.contractedApps) ? body.contractedApps : [...contractedApps]
    );
    setMembers(body.members ?? []);
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
      setError(body?.error || "No se pudo guardar el acceso.");
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

  return (
    <div className="space-presence">
      <div className={`space-presence-bar${onBack ? "" : " is-readonly"}`}>
        {onBack ? (
          <button type="button" className="ghost" onClick={onBack}>
            Volver
          </button>
        ) : null}
        <div>
          <h3>Equipo</h3>
          <p>
            Autoriza quién abre cada aplicación del plan. El plan se define en Plataforma →
            Clientes.
          </p>
        </div>
      </div>

      {plan.length === 0 ? (
        <p className="ajustes-wait">
          Este Espacio no tiene aplicaciones contratadas. No hay llaves que repartir.
        </p>
      ) : null}

      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {members === null ? <p className="ajustes-wait">Cargando equipo…</p> : null}

      {members && members.length === 0 && !error ? (
        <p className="ajustes-wait">Todavía no hay personas en este Espacio.</p>
      ) : null}

      {members && members.length > 0 ? (
        <ul className="team-keys">
          {members.map((member) => (
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
                      {member.roles.map((role) => role.label).join(" · ") || member.status}
                    </span>
                  </div>
                  <p className="account-line">{member.email}</p>
                </div>
              </div>
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
            </li>
          ))}
        </ul>
      ) : null}

      <p className="ajustes-wait">
        Para invitar o cambiar el rol, abre{" "}
        <a href="/admin/settings/team">Equipo en Growth OS</a> si tienes acceso.
      </p>
    </div>
  );
}
