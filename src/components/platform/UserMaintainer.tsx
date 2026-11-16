"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import {
  OWNER_PROFILE_IDS,
  groupMaintainedUsers,
  labelOwnerProfile,
  profileNeedsSpace,
  type MaintainedUserRow,
  type OwnerProfileId,
} from "@/lib/platform/user-profiles";

export function UserMaintainer({
  users,
  spaces,
  variant = "platform",
  initialScopeId,
  ecosystemOnly = false,
  onRefresh,
  onScopeChange,
}: {
  users: MaintainedUserRow[];
  spaces: { tenantId: string; name: string }[];
  variant?: "platform" | "desk";
  /** Cliente que ya está abierto. La lista arranca ahí, no en las cuentas del administrador. */
  initialScopeId?: string;
  /** Escritorio del superadministrador: solo cuentas de la plataforma. */
  ecosystemOnly?: boolean;
  onRefresh?: () => void;
  onScopeChange?: (scopeId: string, title: string) => void;
}) {
  const router = useRouter();
  const appliedInitial = useRef(false);
  const startingScope =
    initialScopeId && spaces.some((space) => space.tenantId === initialScopeId)
      ? initialScopeId
      : "ecosystem";
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<OwnerProfileId>(
    startingScope !== "ecosystem" && startingScope !== "unassigned"
      ? "institution_admin"
      : "platform_operator"
  );
  const [tenantId, setTenantId] = useState(
    startingScope === "ecosystem" ? spaces[0]?.tenantId ?? "" : startingScope
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{
    email: string;
    displayName: string;
    profile: string;
    password: string;
  } | null>(null);
  const [issued, setIssued] = useState<{
    email: string;
    displayName: string;
    password: string;
  } | null>(null);
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [scopeId, setScopeId] = useState(startingScope);

  const needsSpace = profileNeedsSpace(profile);
  const desk = variant === "desk";
  const groups = groupMaintainedUsers(users);
  const spaceOptions = [...spaces].sort((a, b) => a.name.localeCompare(b.name, "es"));
  const shownScope = ecosystemOnly ? "ecosystem" : scopeId;
  const visible = groups.find((group) => group.id === shownScope)?.users ?? [];
  const profileIds = OWNER_PROFILE_IDS.filter((id) => !ecosystemOnly || !profileNeedsSpace(id));
  const accountCount = visible.length === 1 ? "1 cuenta" : `${visible.length} cuentas`;

  function chooseScope(next: string) {
    setScopeId(next);
    if (next === "ecosystem" || next === "unassigned") {
      if (profileNeedsSpace(profile)) setProfile("platform_operator");
      return;
    }
    setTenantId(next);
    if (!profileNeedsSpace(profile)) setProfile("institution_admin");
  }

  useEffect(() => {
    if (appliedInitial.current || !initialScopeId) return;
    const known =
      spaces.some((space) => space.tenantId === initialScopeId) ||
      groupMaintainedUsers(users).some((group) => group.id === initialScopeId);
    if (!known) return;
    appliedInitial.current = true;
    if (scopeId === initialScopeId) return;
    setScopeId(initialScopeId);
    setTenantId(initialScopeId);
    setProfile((current) => (profileNeedsSpace(current) ? current : "institution_admin"));
  }, [initialScopeId, spaces, users, scopeId]);

  useEffect(() => {
    const title =
      scopeId === "ecosystem"
        ? "Cuentas del administrador"
        : scopeId === "unassigned"
          ? "Sin cliente"
          : spaceOptions.find((space) => space.tenantId === scopeId)?.name ||
            groups.find((group) => group.id === scopeId)?.title ||
            "";
    onScopeChange?.(scopeId, title);
  }, [scopeId, onScopeChange, spaceOptions, groups]);

  function chooseProfile(next: OwnerProfileId) {
    setProfile(next);
    setScopeId(profileNeedsSpace(next) ? tenantId || "ecosystem" : "ecosystem");
  }

  function chooseTenant(next: string) {
    setTenantId(next);
    if (profileNeedsSpace(profile)) setScopeId(next);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/platform/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          email,
          profile,
          tenantId: needsSpace ? tenantId : null,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        user?: { email: string; displayName: string; profile: string; password: string };
      } | null;
      if (!response.ok || !body?.ok || !body.user) {
        setError(body?.error || "No se pudo crear el usuario.");
        return;
      }
      setCreated(body.user);
      setIssued(null);
      setDisplayName("");
      setEmail("");
      if (onRefresh) onRefresh();
      else router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  }

  function askResend(user: MaintainedUserRow) {
    if (desk) {
      setPendingId(user.id);
      setError("");
      return;
    }
    const confirmed = window.confirm(
      `¿Reenviar acceso a ${user.displayName || user.email}? La contraseña anterior deja de servir. La nueva se muestra una sola vez.`
    );
    if (!confirmed) return;
    void onResend(user);
  }

  async function onResend(user: MaintainedUserRow) {
    setPendingId(null);
    setError("");
    setIssuingId(user.id);
    try {
      const response = await fetch("/api/platform/users/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const body = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        user?: { email: string; displayName: string; password: string };
      } | null;
      if (!response.ok || !body?.ok || !body.user) {
        setError(body?.error || "No se pudo reenviar el acceso.");
        return;
      }
      setIssued(body.user);
      setCreated(null);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIssuingId(null);
    }
  }

  const labelClass = desk ? undefined : "mt-3 block text-sm font-medium text-[var(--gray-800)]";
  const fieldClass = desk
    ? undefined
    : "mt-1 h-10 w-full rounded-lg border border-[var(--color-border-default)] px-3 text-sm";

  return (
    <div className={desk ? "desk-users" : "grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]"}>
      <form
        onSubmit={onSubmit}
        className={desk ? "desk-card" : "rounded-2xl border border-[var(--color-border-default)] bg-white p-5"}
      >
        <h2 className={desk ? undefined : "text-base font-semibold text-[var(--gray-900)]"}>Nuevo usuario</h2>
        <p className={desk ? "lead" : "mt-1 text-sm text-[var(--gray-500)]"}>
          El dueño crea la cuenta y el perfil. La contraseña se muestra una sola vez.
        </p>
        <label className={labelClass}>
          Nombre
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Correo
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Perfil
          <select
            value={profile}
            onChange={(event) => chooseProfile(event.target.value as OwnerProfileId)}
            className={fieldClass}
          >
            {profileIds.map((id) => (
              <option key={id} value={id}>
                {labelOwnerProfile(id)}
              </option>
            ))}
          </select>
        </label>
        {needsSpace ? (
          <label className={labelClass}>
            Espacio
            <select
              value={tenantId}
              onChange={(event) => chooseTenant(event.target.value)}
              required
              className={fieldClass}
            >
              {spaces.map((space) => (
                <option key={space.tenantId} value={space.tenantId}>
                  {space.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {error ? <p className={desk ? "form-error" : "mt-3 text-sm text-danger"}>{error}</p> : null}
        <button
          type="submit"
          className={
            desk
              ? "primary"
              : "mt-4 h-10 rounded-full bg-[var(--growth-os-primary)] px-4 text-sm font-semibold text-white disabled:opacity-60"
          }
          disabled={saving}
        >
          {saving ? "Creando…" : "Crear usuario"}
        </button>
        {created ? (
          <div className={desk ? "secret" : "mt-4 rounded-xl bg-[var(--color-background-default)] p-3 text-sm"}>
            <p className={desk ? "name" : "font-semibold text-[var(--gray-900)]"}>{created.displayName}</p>
            <p className={desk ? undefined : "text-[var(--gray-600)]"}>{created.email}</p>
            <p className={desk ? undefined : "text-[var(--gray-600)]"}>{created.profile}</p>
            <p className={desk ? "pass" : "mt-2 font-medium text-[var(--gray-900)]"}>
              Contraseña: {created.password}
            </p>
          </div>
        ) : null}
        {issued ? (
          <div className={desk ? "secret" : "mt-4 rounded-xl bg-[var(--color-background-default)] p-3 text-sm"}>
            <p className={desk ? "name" : "font-semibold text-[var(--gray-900)]"}>Acceso reenviado</p>
            <p className={desk ? undefined : "text-[var(--gray-600)]"}>{issued.displayName}</p>
            <p className={desk ? undefined : "text-[var(--gray-600)]"}>{issued.email}</p>
            <p className={desk ? undefined : "mt-2 text-[var(--gray-600)]"}>La contraseña anterior ya no sirve.</p>
            <p className={desk ? "pass" : "mt-1 font-medium text-[var(--gray-900)]"}>
              Contraseña: {issued.password}
            </p>
          </div>
        ) : null}
      </form>

      <section
        className={
          desk
            ? "desk-card roster"
            : "overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-white"
        }
      >
        <header className={desk ? undefined : "border-b border-[var(--color-border-default)] px-5 py-4"}>
          <h2 className={desk ? undefined : "text-base font-semibold text-[var(--gray-900)]"}>Usuarios</h2>
          {ecosystemOnly ? null : <label className={desk ? undefined : "mt-3 block text-sm font-medium text-[var(--gray-800)]"}>
            Cliente
            <select
              value={scopeId}
              onChange={(event) => chooseScope(event.target.value)}
              aria-label="Cliente"
              className={
                desk
                  ? undefined
                  : "mt-1 h-10 w-full rounded-lg border border-[var(--color-border-default)] px-3 text-sm"
              }
            >
              <option value="ecosystem">Cuentas del administrador</option>
              {spaceOptions.map((space) => (
                <option key={space.tenantId} value={space.tenantId}>
                  {space.name}
                </option>
              ))}
              {groups.some((group) => group.id === "unassigned") ? (
                <option value="unassigned">Sin cliente</option>
              ) : null}
            </select>
          </label>}
          <p className={desk ? undefined : "mt-2 text-sm text-[var(--gray-500)]"}>{accountCount}</p>
        </header>
        <div className={desk ? "groups" : "max-h-[70vh] overflow-auto"}>
          {visible.length === 0 ? (
            <p className={desk ? "lead" : "px-5 py-4 text-sm text-[var(--gray-500)]"}>
              {shownScope === "ecosystem"
                ? "El ecosistema no tiene cuentas."
                : "Este cliente no tiene cuentas."}
            </p>
          ) : (
            <ul className={desk ? undefined : "divide-y divide-[var(--color-border-default)]"}>
              {visible.map((user) => (
                <li key={`${scopeId}:${user.id}`} className={desk ? undefined : "px-5 py-3"}>
                  <div className={desk ? "person" : "flex items-start justify-between gap-3"}>
                    <div className="min-w-0">
                      <p className={desk ? "name" : "text-sm font-semibold text-[var(--gray-900)]"}>
                        {user.displayName}
                      </p>
                      <p className={desk ? undefined : "text-sm text-[var(--gray-600)]"}>{user.email}</p>
                      <p className={desk ? "profile" : "text-sm text-[var(--gray-500)]"}>{user.profile}</p>
                    </div>
                    {pendingId === user.id ? (
                      <div className="confirm">
                        <p>La contraseña anterior deja de servir.</p>
                        <button
                          type="button"
                          className="primary"
                          disabled={issuingId === user.id}
                          onClick={() => void onResend(user)}
                        >
                          {issuingId === user.id ? "Reenviando…" : "Confirmar"}
                        </button>
                        <button type="button" className="ghost" onClick={() => setPendingId(null)}>
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] text-accent hover:bg-accent/10 disabled:cursor-default disabled:opacity-45"
                        aria-label="Reenviar acceso"
                        title={issuingId === user.id ? "Reenviando…" : "Reenviar acceso"}
                        disabled={issuingId === user.id}
                        onClick={() => askResend(user)}
                      >
                        <Mail className="h-[15px] w-[15px]" aria-hidden />
                      </button>
                    )}
                  </div>
                  {issued?.email === user.email ? (
                    <p className={desk ? "pass" : "mt-2 text-sm font-medium text-[var(--gray-900)]"}>
                      Contraseña nueva: {issued.password}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
