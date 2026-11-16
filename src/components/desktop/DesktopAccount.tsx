"use client";

import { useEffect, useState } from "react";
import { DesktopAvatar } from "@/components/desktop/DesktopAvatar";
import {
  ACCOUNT_SECTIONS,
  wallpaperChoices,
  type AccountSectionId,
} from "@/lib/desktop/account";
import {
  AVATAR_PRESETS,
  resolveDesktopAvatar,
} from "@/lib/desktop/avatar-catalog";
import {
  AVATAR_SIZE_HINT,
  avatarDimensionError,
  avatarFileError,
} from "@/lib/desktop/avatar-upload";
import {
  wallpaperSrc,
  type DesktopWallpaper,
  type WallpaperChoice,
} from "@/lib/desktop/catalog";
import { LOCALE_OPTIONS, TIMEZONE_OPTIONS } from "@/lib/admin/institutional";
import {
  WALLPAPER_SIZE_HINT,
  wallpaperDimensionError,
  wallpaperFileError,
  wallpaperLoadedText,
} from "@/lib/desktop/wallpaper-upload";
import { normalizeAccountPhone } from "@/lib/identity/account-phone";

type MePayload = {
  ok?: boolean;
  authenticated?: boolean;
  authMethod?: string;
  institutionName?: string;
  roleLabel?: string;
  user?: {
    id?: string;
    displayName?: string;
    email?: string;
    jobTitle?: string;
    phone?: string;
    timezone?: string;
    locale?: string;
    avatarPresetId?: string;
    avatarPhoto?: boolean;
    avatarPhotoUpdatedAt?: string;
  };
};

function measureImageFile(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      URL.revokeObjectURL(url);
      if (!width || !height) {
        reject(new Error("medidas"));
        return;
      }
      resolve({ width, height });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("imagen"));
    };
    image.src = url;
  });
}

function avatarVersionFromUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const url = new URL(raw, window.location.origin);
    return url.searchParams.get("v");
  } catch {
    return null;
  }
}

export function DesktopAccount({
  wallpaper,
  customUrl,
  onWallpaper,
  onUseCustom,
  onUploadWallpaper,
  onClearCustom,
  onProfileSaved,
  onAvatarChanged,
  onClose,
}: {
  wallpaper: WallpaperChoice;
  customUrl: string | null;
  onWallpaper: (next: DesktopWallpaper) => Promise<void> | void;
  onUseCustom: () => Promise<void> | void;
  onUploadWallpaper: (file: File) => Promise<{
    width: number;
    height: number;
    savedWidth: number;
    savedHeight: number;
  }>;
  onClearCustom: () => Promise<void> | void;
  onProfileSaved?: (user: { displayName: string }) => void;
  onAvatarChanged?: (next: {
    avatarPresetId: string | null;
    avatarPhoto: boolean;
    avatarPhotoUpdatedAt: string | null;
  }) => void;
  onClose: () => void;
}) {
  const [section, setSection] = useState<AccountSectionId>("perfil");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("America/Santiago");
  const [locale, setLocale] = useState("es-CL");
  const [institutionName, setInstitutionName] = useState("");
  const [roleLabel, setRoleLabel] = useState("");
  const [authMethod, setAuthMethod] = useState<"institutional" | "local">("local");
  const [profileStatus, setProfileStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [profileAlert, setProfileAlert] = useState("");
  const [avatarPresetId, setAvatarPresetId] = useState<string | null>(null);
  const [avatarPhoto, setAvatarPhoto] = useState(false);
  const [avatarPhotoUpdatedAt, setAvatarPhotoUpdatedAt] = useState<string | null>(null);
  const [avatarStatus, setAvatarStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [avatarAlert, setAvatarAlert] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [prefsStatus, setPrefsStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [prefsAlert, setPrefsAlert] = useState("");
  const [wallStatus, setWallStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [wallAlert, setWallAlert] = useState("");
  const [wallError, setWallError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [securityStatus, setSecurityStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [securityError, setSecurityError] = useState("");
  const [securityAlert, setSecurityAlert] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await fetch("/api/identity/me").catch(() => null);
      const data = (await response?.json().catch(() => null)) as MePayload | null;
      if (cancelled) return;
      if (!response?.ok || !data?.ok || !data.authenticated || !data.user) {
        setError("No se pudo cargar tu cuenta.");
        setLoading(false);
        return;
      }
      setUserId(data.user.id ?? "");
      setDisplayName(data.user.displayName ?? "");
      setJobTitle(data.user.jobTitle ?? "");
      setEmail(data.user.email ?? "");
      {
        const rawPhone = data.user.phone ?? "";
        const parsedPhone = normalizeAccountPhone(rawPhone);
        setPhone(parsedPhone.ok ? parsedPhone.phone : rawPhone);
      }
      setTimezone(data.user.timezone ?? "America/Santiago");
      setLocale(data.user.locale ?? "es-CL");
      setInstitutionName(data.institutionName ?? "");
      setRoleLabel(data.roleLabel ?? "");
      setAuthMethod(data.authMethod === "institutional" ? "institutional" : "local");
      setAvatarPresetId(typeof data.user.avatarPresetId === "string" ? data.user.avatarPresetId : null);
      setAvatarPhoto(data.user.avatarPhoto === true);
      setAvatarPhotoUpdatedAt(
        typeof data.user.avatarPhotoUpdatedAt === "string" ? data.user.avatarPhotoUpdatedAt : null
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const avatarView = resolveDesktopAvatar({
    displayName,
    email,
    avatarPhoto,
    avatarPhotoUpdatedAt: avatarPhotoUpdatedAt ?? undefined,
    avatarPresetId,
    userId,
  });

  function updateAvatarState(next: {
    avatarPresetId: string | null;
    avatarPhoto: boolean;
    avatarPhotoUpdatedAt: string | null;
  }) {
    setAvatarPresetId(next.avatarPresetId);
    setAvatarPhoto(next.avatarPhoto);
    setAvatarPhotoUpdatedAt(next.avatarPhotoUpdatedAt);
    onAvatarChanged?.(next);
  }

  function markAvatarSaved(
    next: Parameters<typeof updateAvatarState>[0],
    alert: string
  ) {
    updateAvatarState(next);
    setAvatarStatus("saved");
    setAvatarAlert(alert);
    window.setTimeout(() => setAvatarStatus("idle"), 2500);
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setProfileAlert("");
    const parsedPhone = normalizeAccountPhone(phone);
    if (!parsedPhone.ok) {
      setProfileStatus("error");
      setError(parsedPhone.error);
      return;
    }
    setPhone(parsedPhone.phone);
    setProfileStatus("saving");
    setError("");
    const response = await fetch("/api/identity/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, jobTitle, phone: parsedPhone.phone }),
    }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      user?: { displayName?: string; phone?: string };
    } | null;
    if (!response?.ok || !data?.ok) {
      setProfileStatus("error");
      setError(data?.error || "No se pudo guardar el perfil.");
      return;
    }
    const nextName = data.user?.displayName?.trim() || displayName.trim();
    setDisplayName(nextName);
    if (typeof data.user?.phone === "string") setPhone(data.user.phone);
    onProfileSaved?.({ displayName: nextName });
    setProfileStatus("saved");
    setProfileAlert("Perfil guardado.");
    window.setTimeout(() => setProfileStatus("idle"), 2500);
  }

  async function savePrefs(event: React.FormEvent) {
    event.preventDefault();
    setPrefsAlert("");
    setPrefsStatus("saving");
    setError("");
    const response = await fetch("/api/identity/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone, locale }),
    }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (!response?.ok || !data?.ok) {
      setPrefsStatus("error");
      setError(data?.error || "No se pudieron guardar las preferencias.");
      return;
    }
    setPrefsStatus("saved");
    setPrefsAlert("Preferencias guardadas.");
    window.setTimeout(() => setPrefsStatus("idle"), 2500);
  }

  async function pickWallpaper(next: DesktopWallpaper) {
    if (next === wallpaper || wallStatus === "saving") return;
    setWallAlert("");
    setWallError("");
    setWallStatus("saving");
    try {
      await onWallpaper(next);
      setWallStatus("saved");
      setWallAlert("Fondo guardado.");
      window.setTimeout(() => setWallStatus("idle"), 2500);
    } catch {
      setWallStatus("error");
      setWallError("No se pudo guardar el fondo.");
    }
  }

  async function pickCustom() {
    if (!customUrl || wallpaper === "custom" || wallStatus === "saving") return;
    setWallAlert("");
    setWallError("");
    setWallStatus("saving");
    try {
      await onUseCustom();
      setWallStatus("saved");
      setWallAlert("Fondo guardado.");
      window.setTimeout(() => setWallStatus("idle"), 2500);
    } catch {
      setWallStatus("error");
      setWallError("No se pudo guardar el fondo.");
    }
  }

  async function onWallpaperFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || wallStatus === "saving") return;
    setWallError("");
    setWallAlert("");
    const rejected = wallpaperFileError(file);
    if (rejected) {
      setWallStatus("error");
      setWallError(rejected);
      return;
    }
    let measured: { width: number; height: number };
    try {
      measured = await measureImageFile(file);
    } catch {
      setWallStatus("error");
      setWallError(`No se pudo leer la imagen. ${WALLPAPER_SIZE_HINT}`);
      return;
    }
    const tooSmall = wallpaperDimensionError(measured.width, measured.height);
    if (tooSmall) {
      setWallStatus("error");
      setWallError(tooSmall);
      return;
    }
    setWallAlert(wallpaperLoadedText(measured));
    setWallStatus("saving");
    try {
      const saved = await onUploadWallpaper(file);
      setWallAlert(
        wallpaperLoadedText({
          width: saved.width,
          height: saved.height,
          savedWidth: saved.savedWidth,
          savedHeight: saved.savedHeight,
        })
      );
      setWallStatus("saved");
      window.setTimeout(() => setWallStatus("idle"), 4000);
    } catch (error) {
      setWallStatus("error");
      setWallError(error instanceof Error ? error.message : "No se pudo guardar el fondo.");
    }
  }

  async function removeCustom() {
    if (!customUrl || wallStatus === "saving") return;
    setWallError("");
    setWallStatus("saving");
    try {
      await onClearCustom();
      setWallAlert("");
      setWallStatus("idle");
    } catch {
      setWallStatus("error");
      setWallError("No se pudo quitar el fondo.");
    }
  }

  async function pickPreset(nextPresetId: string) {
    if (avatarStatus === "saving" || avatarPresetId === nextPresetId) return;
    setAvatarAlert("");
    setAvatarError("");
    setAvatarStatus("saving");
    const response = await fetch("/api/desktop/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ presetId: nextPresetId }),
    }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      presetId?: string;
      error?: string;
    } | null;
    if (!response?.ok || !data?.ok || typeof data.presetId !== "string") {
      setAvatarStatus("error");
      setAvatarError(data?.error || "No se pudo guardar el avatar.");
      return;
    }
    markAvatarSaved(
      {
        avatarPresetId: data.presetId,
        avatarPhoto,
        avatarPhotoUpdatedAt,
      },
      "Avatar guardado."
    );
  }

  async function onAvatarFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || avatarStatus === "saving") return;
    setAvatarError("");
    setAvatarAlert("");
    const rejected = avatarFileError(file);
    if (rejected) {
      setAvatarStatus("error");
      setAvatarError(rejected);
      return;
    }

    let measured: { width: number; height: number };
    try {
      measured = await measureImageFile(file);
    } catch {
      setAvatarStatus("error");
      setAvatarError(`No se pudo leer la imagen. ${AVATAR_SIZE_HINT}`);
      return;
    }

    const tooSmall = avatarDimensionError(measured.width, measured.height);
    if (tooSmall) {
      setAvatarStatus("error");
      setAvatarError(tooSmall);
      return;
    }

    setAvatarStatus("saving");
    const form = new FormData();
    form.set("file", file);
    const response = await fetch("/api/desktop/avatar", {
      method: "POST",
      body: form,
    }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      url?: string;
    } | null;
    if (!response?.ok || !data?.ok) {
      setAvatarStatus("error");
      setAvatarError(data?.error || "No se pudo guardar el avatar.");
      return;
    }

    markAvatarSaved(
      {
        avatarPresetId,
        avatarPhoto: true,
        avatarPhotoUpdatedAt: avatarVersionFromUrl(data?.url),
      },
      "Foto guardada."
    );
  }

  async function removePhoto() {
    if (!avatarPhoto || avatarStatus === "saving") return;
    setAvatarAlert("");
    setAvatarError("");
    setAvatarStatus("saving");
    const response = await fetch("/api/desktop/avatar", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clear: "photo" }),
    }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (!response?.ok || !data?.ok) {
      setAvatarStatus("error");
      setAvatarError(data?.error || "No se pudo quitar la foto.");
      return;
    }
    markAvatarSaved(
      {
        avatarPresetId,
        avatarPhoto: false,
        avatarPhotoUpdatedAt: null,
      },
      "Foto quitada."
    );
  }

  async function clearAvatarToInitials() {
    if (!avatarPhoto && !avatarPresetId) return;
    if (avatarStatus === "saving") return;
    setAvatarAlert("");
    setAvatarError("");
    setAvatarStatus("saving");
    const response = await fetch("/api/desktop/avatar", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clear: "all" }),
    }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (!response?.ok || !data?.ok) {
      setAvatarStatus("error");
      setAvatarError(data?.error || "No se pudo volver a las iniciales.");
      return;
    }
    markAvatarSaved(
      {
        avatarPresetId: null,
        avatarPhoto: false,
        avatarPhotoUpdatedAt: null,
      },
      "Avatar guardado."
    );
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setSecurityStatus("saving");
    setSecurityError("");
    setSecurityAlert("");
    const response = await fetch("/api/identity/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (!response?.ok || !data?.ok) {
      setSecurityStatus("error");
      setSecurityError(data?.error || "No se pudo actualizar la contraseña.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setSecurityStatus("saved");
    setSecurityAlert("Contraseña actualizada.");
    window.setTimeout(() => setSecurityStatus("idle"), 2500);
  }

  const subtitle = ACCOUNT_SECTIONS.find((item) => item.id === section)?.subtitle ?? "";

  return (
    <div className="ajustes-back" onClick={onClose}>
      <div
        className="ajustes-window is-account"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="ajustes-head">
          <div className="ajustes-brand">
            <DesktopAvatar view={avatarView} className="account-hero-avatar" />
            <div>
              <p className="kicker">NELZURI</p>
              <h2 id="account-title">Mi cuenta</h2>
              <p>{subtitle}</p>
            </div>
          </div>
          <button type="button" className="ghost" onClick={onClose}>
            Cerrar
          </button>
        </header>

        <nav className="ajustes-nav" aria-label="Secciones de la cuenta">
          {ACCOUNT_SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={section === item.id ? "is-on" : undefined}
              aria-pressed={section === item.id}
              onClick={() => setSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="account-body">
          {loading ? <p className="ajustes-wait">Cargando tu cuenta…</p> : null}
          {!loading && error && profileStatus !== "error" && section === "perfil" ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}

          {!loading && section === "perfil" ? (
            <form className="desk-card account-pane" onSubmit={saveProfile}>
              <p className="account-meta">
                {[roleLabel, institutionName].filter(Boolean).join(" · ") || "Tu perfil personal"}
              </p>
              <section className="avatar-panel" aria-labelledby="account-avatar-title">
                <div className="avatar-preview">
                  <DesktopAvatar view={avatarView} className="account-avatar-preview" />
                  <div>
                    <p id="account-avatar-title" className="field-label">
                      Avatar del escritorio
                    </p>
                    <p className="account-note">{AVATAR_SIZE_HINT}</p>
                  </div>
                </div>
                <div className="form-actions">
                  <label className="file-btn">
                    {avatarStatus === "saving"
                      ? "Guardando…"
                      : avatarPhoto
                        ? "Cambiar foto"
                        : "Subir foto"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                      onChange={(event) => void onAvatarFile(event)}
                      disabled={avatarStatus === "saving"}
                    />
                  </label>
                  {avatarPhoto ? (
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => void removePhoto()}
                      disabled={avatarStatus === "saving"}
                    >
                      Quitar foto
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="text-btn"
                      onClick={() => void clearAvatarToInitials()}
                    disabled={avatarStatus === "saving" || (!avatarPhoto && !avatarPresetId)}
                  >
                    Usar iniciales
                  </button>
                </div>
                <div className="avatar-choices" role="radiogroup" aria-label="Preset de avatar">
                  {AVATAR_PRESETS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-label={item.label}
                      aria-checked={avatarPresetId === item.id}
                      className={avatarPresetId === item.id ? "is-on" : undefined}
                      onClick={() => void pickPreset(item.id)}
                      disabled={avatarStatus === "saving"}
                      title={item.label}
                    >
                      <DesktopAvatar
                        view={resolveDesktopAvatar({
                          displayName,
                          email,
                          avatarPresetId: item.id,
                        })}
                      />
                    </button>
                  ))}
                </div>
                {avatarError ? (
                  <p className="form-error" role="alert">
                    {avatarError}
                  </p>
                ) : null}
                {avatarAlert ? (
                  <p className="form-ok" role="status">
                    {avatarAlert}
                  </p>
                ) : null}
              </section>
              <label>
                Nombre completo
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                  autoComplete="name"
                />
              </label>
              <label>
                Cargo
                <input
                  value={jobTitle}
                  onChange={(event) => setJobTitle(event.target.value)}
                  placeholder="Ej. Administradora del Espacio"
                  autoComplete="organization-title"
                />
              </label>
              <label>
                Correo
                <input value={email} disabled autoComplete="email" />
              </label>
              <label>
                Teléfono
                <input
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setProfileAlert("");
                    setError("");
                    setProfileStatus((status) => (status === "saving" ? status : "idle"));
                  }}
                  onBlur={() => {
                    const parsedPhone = normalizeAccountPhone(phone);
                    if (!parsedPhone.ok || parsedPhone.phone === phone) return;
                    setPhone(parsedPhone.phone);
                  }}
                  placeholder="+56 9 1234 5678"
                  autoComplete="tel"
                  inputMode="tel"
                />
              </label>
              {profileStatus === "error" && error ? (
                <p className="form-error" role="alert">
                  {error}
                </p>
              ) : null}
              {profileAlert ? (
                <p className="form-ok" role="status">
                  {profileAlert}
                </p>
              ) : null}
              <div className="form-actions">
                <button type="submit" className="primary" disabled={profileStatus === "saving"}>
                  {profileStatus === "saving"
                    ? "Guardando…"
                    : profileStatus === "saved"
                      ? "Guardado"
                      : "Guardar perfil"}
                </button>
              </div>
            </form>
          ) : null}

          {!loading && section === "preferencias" ? (
            <div className="account-stack">
              <form className="desk-card account-pane" onSubmit={savePrefs}>
                <label>
                  Idioma
                  <select value={locale} onChange={(event) => setLocale(event.target.value)}>
                    {LOCALE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Zona horaria
                  <select value={timezone} onChange={(event) => setTimezone(event.target.value)}>
                    {TIMEZONE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                {prefsStatus === "error" && error ? (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                ) : null}
                {prefsAlert ? (
                  <p className="form-ok" role="status">
                    {prefsAlert}
                  </p>
                ) : null}
                <div className="form-actions">
                  <button type="submit" className="primary" disabled={prefsStatus === "saving"}>
                    {prefsStatus === "saving"
                      ? "Guardando…"
                      : prefsStatus === "saved"
                        ? "Guardado"
                        : "Guardar preferencias"}
                  </button>
                </div>
              </form>

              <section className="desk-card account-pane">
                <p className="field-label">Fondo del escritorio</p>
                <p className="lead">Se guarda en tu cuenta y acompaña el cambio de empresa.</p>
                <p className="account-note">{WALLPAPER_SIZE_HINT}</p>
                <div className="wall-choices" role="radiogroup" aria-label="Fondo del escritorio">
                  {wallpaperChoices().map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={wallpaper === item.id}
                      className={wallpaper === item.id ? "is-on" : undefined}
                      disabled={wallStatus === "saving"}
                      onClick={() => void pickWallpaper(item.id)}
                      style={{ backgroundImage: `url("${wallpaperSrc(item.id)}")` }}
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}
                  {customUrl ? (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={wallpaper === "custom"}
                      className={wallpaper === "custom" ? "is-on" : undefined}
                      disabled={wallStatus === "saving"}
                      onClick={() => void pickCustom()}
                      style={{ backgroundImage: `url("${customUrl}")` }}
                    >
                      <span>Mío</span>
                    </button>
                  ) : null}
                </div>
                <div className="form-actions">
                  <label className="file-btn">
                    {wallStatus === "saving"
                      ? "Guardando…"
                      : customUrl
                        ? "Cambiar mi fondo"
                        : "Agregar mi fondo"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                      onChange={(event) => void onWallpaperFile(event)}
                      disabled={wallStatus === "saving"}
                    />
                  </label>
                  {customUrl ? (
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => void removeCustom()}
                      disabled={wallStatus === "saving"}
                    >
                      Quitar
                    </button>
                  ) : null}
                </div>
                {wallError ? (
                  <p className="form-error" role="alert">
                    {wallError}
                  </p>
                ) : null}
                {wallAlert ? (
                  <p className="form-ok" role="status">
                    {wallAlert}
                  </p>
                ) : null}
              </section>
            </div>
          ) : null}

          {!loading && section === "seguridad" ? (
            <div className="desk-card account-pane">
              {authMethod === "institutional" ? (
                <>
                  <h3>Autenticación institucional</h3>
                  <p className="lead">
                    Tu contraseña se administra en el portal institucional de identidad. Aquí no se
                    cambia.
                  </p>
                </>
              ) : (
                <form onSubmit={savePassword}>
                  <h3>Contraseña</h3>
                  <p className="lead">Actualiza la contraseña de tu cuenta.</p>
                  <label>
                    Contraseña actual
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </label>
                  <label>
                    Contraseña nueva
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      minLength={8}
                      required
                      autoComplete="new-password"
                    />
                  </label>
                  {securityError ? (
                    <p className="form-error" role="alert">
                      {securityError}
                    </p>
                  ) : null}
                  {securityAlert ? (
                    <p className="form-ok" role="status">
                      {securityAlert}
                    </p>
                  ) : null}
                  <div className="form-actions">
                    <button type="submit" className="primary" disabled={securityStatus === "saving"}>
                      {securityStatus === "saving"
                        ? "Actualizando…"
                        : securityStatus === "saved"
                          ? "Actualizada"
                          : "Cambiar contraseña"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
