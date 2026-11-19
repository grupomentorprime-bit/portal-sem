"use client";

import { useCallback, useEffect, useState } from "react";
import { DeskAppBar } from "@/components/desktop/DeskAppBar";
import { DesktopAttentionSettings } from "@/components/desktop/DesktopAttentionSettings";
import { DesktopAvatar } from "@/components/desktop/DesktopAvatar";
import { DeskIcon, activityTone, productTone, type DeskIconName } from "@/components/desktop/DeskIcon";
import { resolveDesktopAvatar } from "@/lib/desktop/avatar-catalog";
import { NELZURI_BACKING, NELZURI_LOGO_ON_LIGHT } from "@/lib/desktop/nelzuri";
import {
  formatOwnerWhen,
  OWNER_LEGAL,
  OWNER_PLATFORM,
  OWNER_SECTIONS,
  ownerProducts,
  ownerSecurity,
  platformAddress,
  type OwnerActivityKind,
  type OwnerSectionId,
} from "@/lib/desktop/owner-settings";
import {
  groupMaintainedUsers,
  labelOwnerProfile,
  type MaintainedUserRow,
  type OwnerProfileId,
} from "@/lib/platform/user-profiles";

type DeskSnapshot = {
  baseDomain: string | null;
  activity: { id: string; at: string; actor: string; line: string; kind: OwnerActivityKind }[];
};

type DesktopAjustesSelf = {
  id: string;
  displayName: string;
  email: string;
  avatarPresetId?: string | null;
  avatarPhoto?: boolean;
  avatarPhotoUpdatedAt?: string | null;
};

const PLATFORM_PROFILES: { id: OwnerProfileId; text: string }[] = [
  { id: "platform_owner", text: "Crea clientes y cuentas." },
  { id: "platform_operator", text: "Crea cuentas." },
];

function ActionIcon({ kind }: { kind: "edit" | "pause" | "play" | "trash" | "send" }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    "aria-hidden": true as const,
  };
  if (kind === "edit") {
    return (
      <svg {...common}>
        <path d="M4 16.8V20h3.2L18.4 8.8 15.2 5.6 4 16.8z" strokeLinejoin="round" />
        <path d="M13.6 7.2l3.2 3.2" />
      </svg>
    );
  }
  if (kind === "pause") {
    return (
      <svg {...common}>
        <rect x="6" y="5" width="4" height="14" rx="1.2" />
        <rect x="14" y="5" width="4" height="14" rx="1.2" />
      </svg>
    );
  }
  if (kind === "play") {
    return (
      <svg {...common}>
        <path d="M8 6.5v11l9-5.5-9-5.5z" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === "send") {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 7 9-7" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M5 8h14" />
      <path d="M9 8V6h6v2" />
      <path d="M7 8l1 12h8l1-12" strokeLinejoin="round" />
    </svg>
  );
}

function PasswordReveal({
  title,
  detail,
  password,
  copied,
  onCopy,
}: {
  title?: string;
  detail?: string;
  password: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="secret">
      {title ? <p className="name">{title}</p> : null}
      {detail ? <p>{detail}</p> : null}
      <div className="pass-row">
        <p className="pass">{password}</p>
        <button type="button" className="resend" onClick={onCopy}>
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <p className="hint">Guárdala ahora. No se vuelve a mostrar.</p>
    </div>
  );
}

export function DesktopAjustes({
  self,
  onClose,
}: {
  self: DesktopAjustesSelf;
  onClose: () => void;
}) {
  const [users, setUsers] = useState<MaintainedUserRow[] | null>(null);
  const [error, setError] = useState("");
  const [section, setSection] = useState<OwnerSectionId>("cuentas");
  const [enlarged, setEnlarged] = useState(false);
  const [desk, setDesk] = useState<DeskSnapshot | null>(null);
  const [deskError, setDeskError] = useState("");
  const [creating, setCreating] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<OwnerProfileId>("platform_operator");
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editProfile, setEditProfile] = useState<OwnerProfileId>("platform_operator");
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    kind: "suspend" | "activate" | "delete";
  } | null>(null);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/platform/users").catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      users?: MaintainedUserRow[];
    } | null;
    if (!response?.ok || !body?.ok || !body.users) {
      setError(body?.error || "No se pudieron cargar las cuentas.");
      return;
    }
    setError("");
    setUsers(body.users);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        const response = await fetch("/api/platform/owner-desk").catch(() => null);
        const body = (await response?.json().catch(() => null)) as {
          ok?: boolean;
          error?: string;
          baseDomain?: string | null;
          activity?: DeskSnapshot["activity"];
        } | null;
        if (!response?.ok || !body?.ok || !body.activity) {
          setDeskError(body?.error || "No se pudieron cargar los ajustes de la plataforma.");
          return;
        }
        setDeskError("");
        setDesk({
          baseDomain: body.baseDomain ?? null,
          activity: body.activity.map((row) => ({
            ...row,
            kind: row.kind ?? "other",
          })),
        });
      })();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const accounts =
    groupMaintainedUsers(users ?? []).find((group) => group.id === "ecosystem")?.users ?? [];
  const selfEmail = self.email.trim().toLowerCase();
  const me = accounts.find((user) => user.email.trim().toLowerCase() === selfEmail) ?? null;
  const accountCount = accounts.length === 1 ? "1 cuenta" : `${accounts.length} cuentas`;
  const activeOwners = accounts.filter(
    (user) => user.platformRole === "platform_owner" && user.status === "active"
  ).length;

  function soleOwner(user: MaintainedUserRow) {
    if (user.platformRole !== "platform_owner") return false;
    return activeOwners === 0 || (user.status === "active" && activeOwners <= 1);
  }

  function canCut(user: MaintainedUserRow, mine: boolean) {
    return !mine && !user.reserved && !soleOwner(user);
  }

  function openCreate() {
    setCreating(true);
    setCreated(null);
    setError("");
    setCopiedId(null);
  }

  function closeCreate() {
    setCreating(false);
    setDisplayName("");
    setEmail("");
    setProfile("platform_operator");
    setError("");
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
          tenantId: null,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        user?: { email: string; displayName: string; profile: string; password: string };
      } | null;
      if (!response.ok || !body?.ok || !body.user) {
        setError(body?.error || "No se pudo crear la cuenta.");
        return;
      }
      setCreated(body.user);
      setIssued(null);
      setCopiedId(null);
      setDisplayName("");
      setEmail("");
      setProfile("platform_operator");
      setCreating(false);
      void load();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
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
        setError(body?.error || "No se pudo crear la contraseña.");
        return;
      }
      setIssued(body.user);
      setCreated(null);
      setCopiedId(null);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIssuingId(null);
    }
  }

  function startEdit(user: MaintainedUserRow) {
    setEditingId(user.id);
    setEditName(user.displayName);
    setEditProfile(user.platformRole === "platform_owner" ? "platform_owner" : "platform_operator");
    setPendingAction(null);
    setError("");
  }

  async function saveEdit(userId: string) {
    setError("");
    setActing(true);
    try {
      const response = await fetch("/api/platform/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, displayName: editName, profile: editProfile }),
      });
      const body = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !body?.ok) {
        setError(body?.error || "No se pudo guardar la cuenta.");
        return;
      }
      setEditingId(null);
      void load();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setActing(false);
    }
  }

  async function runAction(user: MaintainedUserRow, kind: "suspend" | "activate" | "delete") {
    setError("");
    setActing(true);
    try {
      const response = await fetch(
        kind === "delete" ? "/api/platform/users/remove" : "/api/platform/users/status",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            kind === "delete"
              ? { userId: user.id }
              : { userId: user.id, status: kind === "suspend" ? "suspended" : "active" }
          ),
        }
      );
      const body = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !body?.ok) {
        setError(body?.error || "No se pudo cambiar la cuenta.");
        return;
      }
      setPendingAction(null);
      void load();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setActing(false);
    }
  }

  async function copyPassword(id: string, password: string) {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedId(id);
    } catch {
      setCopiedId(null);
    }
  }

  function accessControl(user: MaintainedUserRow, label: string, icon = false) {
    if (pendingId === user.id) {
      return (
        <div className="confirm">
          <p>La contraseña anterior deja de servir.</p>
          <button
            type="button"
            className="primary"
            disabled={issuingId === user.id}
            onClick={() => void onResend(user)}
          >
            {issuingId === user.id ? "Creando…" : "Confirmar"}
          </button>
          <button type="button" className="ghost" onClick={() => setPendingId(null)}>
            Cancelar
          </button>
        </div>
      );
    }
    return (
      <button
        type="button"
        className={icon ? "icon-act act-send" : "resend"}
        aria-label={label}
        title={label}
        disabled={issuingId === user.id}
        onClick={() => {
          setPendingId(user.id);
          setError("");
        }}
      >
        {icon ? <ActionIcon kind="send" /> : issuingId === user.id ? "Creando…" : label}
      </button>
    );
  }

  const subtitle = OWNER_SECTIONS.find((item) => item.id === section)?.subtitle ?? "";
  const accountsSection = section === "cuentas" || section === "cuenta";

  return (
    <div className="ajustes-back" onClick={onClose}>
      <div
        className={`ajustes-window is-owner is-app-capsule${enlarged ? " is-enlarged" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ajustes-title"
        onClick={(event) => event.stopPropagation()}
      >
        <DeskAppBar title="Ajustes" titleId="ajustes-title" mark="gear" enlarged={enlarged} onEnlarge={setEnlarged} onClose={onClose}>
          {OWNER_SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`plat-side${section === item.id ? " is-on" : ""}`}
              aria-pressed={section === item.id}
              onClick={() => setSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </DeskAppBar>
        <div className="owner-body">
        <p className="app-lead">{subtitle}</p>
        {accountsSection ? (
          users ? (
          section === "cuentas" ? (
            <div className="desk-users owner-pane">
              {creating ? (
                <form className="desk-card" onSubmit={onSubmit}>
                  <h2>Nueva cuenta</h2>
                  <p className="lead">La contraseña se muestra una sola vez.</p>
                  <label>
                    Nombre
                    <input
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      required
                      autoComplete="name"
                    />
                  </label>
                  <label>
                    Correo
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      autoComplete="off"
                    />
                  </label>
                  <p className="field-label">Perfil</p>
                  <div className="profile-choices" role="radiogroup" aria-label="Perfil">
                    {PLATFORM_PROFILES.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        role="radio"
                        aria-checked={profile === item.id}
                        className={profile === item.id ? "is-on" : undefined}
                        onClick={() => setProfile(item.id)}
                      >
                        <strong>{labelOwnerProfile(item.id)}</strong>
                        <span>{item.text}</span>
                      </button>
                    ))}
                  </div>
                  {error ? <p className="form-error">{error}</p> : null}
                  <div className="form-actions">
                    <button type="submit" className="primary" disabled={saving}>
                      {saving ? "Creando…" : "Crear cuenta"}
                    </button>
                    <button type="button" className="ghost" onClick={closeCreate}>
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : null}
              <section className="desk-card roster">
                <div className="roster-bar">
                  <p>{accountCount}</p>
                  {creating ? null : (
                    <button type="button" className="primary" onClick={openCreate}>
                      Nueva cuenta
                    </button>
                  )}
                </div>
                {created ? (
                  <PasswordReveal
                    title={created.displayName}
                    detail={`${created.email} · ${created.profile}`}
                    password={created.password}
                    copied={copiedId === "created"}
                    onCopy={() => void copyPassword("created", created.password)}
                  />
                ) : null}
                {!creating && error ? <p className="form-error">{error}</p> : null}
                <div className="groups">
                  {accounts.length === 0 ? (
                    <p className="lead">Todavía no hay cuentas de la plataforma.</p>
                  ) : (
                    <ul>
                      {accounts.map((user) => {
                        const mine = user.email.trim().toLowerCase() === selfEmail;
                        const suspended = user.status === "suspended";
                        const cut = canCut(user, mine);
                        const editing = editingId === user.id;
                        const asking = pendingAction?.id === user.id ? pendingAction.kind : null;
                        return (
                          <li key={user.id}>
                            {editing ? (
                              <form
                                className="edit-account"
                                onSubmit={(event) => {
                                  event.preventDefault();
                                  void saveEdit(user.id);
                                }}
                              >
                                <label>
                                  Nombre
                                  <input
                                    value={editName}
                                    onChange={(event) => setEditName(event.target.value)}
                                    required
                                  />
                                </label>
                                <p className="field-label">Perfil</p>
                                <div className="profile-choices" role="radiogroup" aria-label="Perfil">
                                  {PLATFORM_PROFILES.map((item) => {
                                    const locked = item.id === "platform_operator" && soleOwner(user);
                                    return (
                                      <button
                                        key={item.id}
                                        type="button"
                                        role="radio"
                                        aria-checked={editProfile === item.id}
                                        className={editProfile === item.id ? "is-on" : undefined}
                                        disabled={locked}
                                        onClick={() => setEditProfile(item.id)}
                                      >
                                        <strong>{labelOwnerProfile(item.id)}</strong>
                                        <span>
                                          {locked ? "Tiene que quedar un dueño activo." : item.text}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                                <div className="form-actions">
                                  <button type="submit" className="primary" disabled={acting}>
                                    {acting ? "Guardando…" : "Guardar"}
                                  </button>
                                  <button
                                    type="button"
                                    className="ghost"
                                    onClick={() => setEditingId(null)}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div className="person">
                                <DesktopAvatar
                                  view={resolveDesktopAvatar({
                                    displayName: user.displayName,
                                    email: user.email,
                                    avatarPresetId: user.avatarPresetId,
                                    avatarPhoto: user.avatarPhoto,
                                    avatarPhotoUpdatedAt: user.avatarPhotoUpdatedAt ?? undefined,
                                    userId: user.id,
                                  })}
                                />
                                <div className="account-copy">
                                  <p className="name">
                                    {user.displayName}
                                    {mine ? <span className="you">Tú</span> : null}
                                    {suspended ? <span className="suspended">Suspendida</span> : null}
                                  </p>
                                  <p className="account-line">
                                    {user.email} · {user.profile}
                                  </p>
                                </div>
                                <div className="row-actions">
                                  {suspended ? null : accessControl(user, "Reenviar acceso", true)}
                                  <button
                                    type="button"
                                    className="icon-act act-edit"
                                    aria-label="Editar"
                                    title="Editar"
                                    onClick={() => startEdit(user)}
                                  >
                                    <ActionIcon kind="edit" />
                                  </button>
                                  {cut && !suspended ? (
                                    <button
                                      type="button"
                                      className="icon-act act-pause"
                                      aria-label="Suspender"
                                      title="Suspender"
                                      onClick={() => setPendingAction({ id: user.id, kind: "suspend" })}
                                    >
                                      <ActionIcon kind="pause" />
                                    </button>
                                  ) : null}
                                  {cut && suspended ? (
                                    <button
                                      type="button"
                                      className="icon-act act-play"
                                      aria-label="Activar"
                                      title="Activar"
                                      onClick={() => setPendingAction({ id: user.id, kind: "activate" })}
                                    >
                                      <ActionIcon kind="play" />
                                    </button>
                                  ) : null}
                                  {cut ? (
                                    <button
                                      type="button"
                                      className="icon-act act-trash"
                                      aria-label="Eliminar"
                                      title="Eliminar"
                                      onClick={() => setPendingAction({ id: user.id, kind: "delete" })}
                                    >
                                      <ActionIcon kind="trash" />
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            )}
                            {editing || !asking ? null : (
                              <div className="confirm ask">
                                <p>
                                  {asking === "delete"
                                    ? "Se borra la cuenta. No se puede deshacer."
                                    : asking === "suspend"
                                      ? "No puede entrar hasta que la actives."
                                      : "Vuelve a poder entrar."}
                                </p>
                                <button
                                  type="button"
                                  className="primary"
                                  disabled={acting}
                                  onClick={() => void runAction(user, asking)}
                                >
                                  {acting ? "Guardando…" : "Confirmar"}
                                </button>
                                <button
                                  type="button"
                                  className="ghost"
                                  onClick={() => setPendingAction(null)}
                                >
                                  Cancelar
                                </button>
                              </div>
                            )}
                            {issued?.email === user.email ? (
                              <PasswordReveal
                                password={issued.password}
                                copied={copiedId === user.id}
                                onCopy={() => void copyPassword(user.id, issued.password)}
                              />
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>
            </div>
          ) : (
            <div className="desk-users owner-pane">
              <section className="desk-card self-card">
                <div className="person">
                  <DesktopAvatar
                    view={resolveDesktopAvatar({
                      displayName: me?.displayName || self.displayName,
                      email: me?.email || self.email,
                      avatarPresetId: me?.avatarPresetId ?? self.avatarPresetId,
                      avatarPhoto: me?.avatarPhoto ?? self.avatarPhoto,
                      avatarPhotoUpdatedAt:
                        me?.avatarPhotoUpdatedAt ?? self.avatarPhotoUpdatedAt ?? undefined,
                      userId: me?.id || self.id,
                    })}
                  />
                  <div className="account-copy">
                    <p className="name">{me?.displayName || self.displayName}</p>
                    <p className="account-line">{me?.email || self.email}</p>
                    {me ? <p className="profile">{me.profile}</p> : null}
                  </div>
                </div>
                {me ? (
                  <div className="self-actions">{accessControl(me, "Nueva contraseña")}</div>
                ) : (
                  <p className="lead">Esta sesión no está entre las cuentas de la plataforma.</p>
                )}
                {error ? <p className="form-error">{error}</p> : null}
                {me && issued?.email === me.email ? (
                  <PasswordReveal
                    password={issued.password}
                    copied={copiedId === me.id}
                    onCopy={() => void copyPassword(me.id, issued.password)}
                  />
                ) : null}
              </section>
            </div>
          )
        ) : error ? (
          <p className="form-error">{error}</p>
        ) : (
          <p className="ajustes-wait">Cargando cuentas…</p>
        )
        ) : (
          <OwnerDesk
            section={section}
            activeOwners={users ? activeOwners : null}
            desk={desk}
            deskError={deskError}
          />
        )}
        </div>
      </div>
    </div>
  );
}

function GlyphRow({
  tone,
  icon,
  title,
  text,
  href,
}: {
  tone: string;
  icon: DeskIconName;
  title: string;
  text: string;
  href?: string;
}) {
  const body = (
    <>
      <span className={`mini-glyph ${tone}`} aria-hidden="true">
        <DeskIcon name={icon} />
      </span>
      <span className="setting-copy">
        <strong>{title}</strong>
        <span>{text}</span>
      </span>
    </>
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {body}
      </a>
    );
  }
  return <div className="setting-row">{body}</div>;
}

function activityIcon(kind: OwnerActivityKind): DeskIconName {
  if (kind === "products") return "productos";
  if (kind === "security") return "seguridad";
  return kind;
}

function OwnerDesk({
  section,
  activeOwners,
  desk,
  deskError,
}: {
  section: OwnerSectionId;
  activeOwners: number | null;
  desk: DeskSnapshot | null;
  deskError: string;
}) {
  if (section === "atencion") return <DesktopAttentionSettings />;

  if (section === "plataforma") {
    return (
      <div className="desk-users owner-pane">
        <section className="desk-card">
          <div className="brand-row">
            <img
              className="brand-wordmark-light"
              src={NELZURI_LOGO_ON_LIGHT}
              alt={OWNER_PLATFORM.name}
            />
            <p className="account-line">{NELZURI_BACKING}</p>
          </div>
          <p className="brand-note">La marca de cada cliente se cambia en ese cliente.</p>
          <p className="brand-mail">
            <a href={`mailto:${OWNER_PLATFORM.support}`}>{OWNER_PLATFORM.support}</a>
          </p>
        </section>
      </div>
    );
  }

  if (section === "direccion") {
    if (!desk && !deskError) return <p className="ajustes-wait">Cargando dirección…</p>;
    const address = platformAddress(desk?.baseDomain);
    return (
      <div className="desk-users owner-pane">
        {deskError ? <p className="form-error">{deskError}</p> : null}
        {desk ? (
          <ul className="setting-list">
            <li>
              <GlyphRow tone="tone-cyan" icon="direccion" title={address.host} text={address.detail} />
            </li>
          </ul>
        ) : null}
      </div>
    );
  }

  if (section === "productos") {
    return (
      <ul className="setting-list">
        {ownerProducts().map((item) => (
          <li key={item.id}>
            <GlyphRow tone={productTone(item.id)} icon={item.id} title={item.label} text={item.text} />
          </li>
        ))}
      </ul>
    );
  }

  if (section === "seguridad") {
    return (
      <ul className="setting-list">
        {ownerSecurity(activeOwners).map((item) => (
          <li key={item.label}>
            <GlyphRow
              tone="tone-ink"
              icon={item.label === "Sesión" ? "status" : "seguridad"}
              title={item.label}
              text={item.text}
            />
          </li>
        ))}
      </ul>
    );
  }

  if (section === "legales") {
    return (
      <ul className="setting-list">
        {OWNER_LEGAL.map((item) => (
          <li key={item.href}>
            <GlyphRow tone="tone-violet" icon="legales" title={item.label} text={item.text} href={item.href} />
          </li>
        ))}
      </ul>
    );
  }

  if (!desk && !deskError) return <p className="ajustes-wait">Cargando actividad…</p>;
  return (
    <div className="desk-users owner-pane">
      {deskError ? <p className="form-error">{deskError}</p> : null}
      {desk && desk.activity.length === 0 ? (
        <p className="lead">Todavía no hay movimientos de la plataforma.</p>
      ) : null}
      {desk && desk.activity.length > 0 ? (
        <ul className="setting-list">
          {desk.activity.map((row) => (
            <li key={row.id}>
              <GlyphRow
                tone={activityTone(row.kind)}
                icon={activityIcon(row.kind)}
                title={row.line}
                text={`${row.actor}${formatOwnerWhen(row.at) ? ` · ${formatOwnerWhen(row.at)}` : ""}`}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
