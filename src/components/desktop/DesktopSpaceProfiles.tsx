"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DesktopSwitchGroup, DesktopSwitchRow } from "@/components/desktop/DesktopSwitch";

type ProfileKind = "enterprise" | "custom" | "product";
type ProfileRow = {
  id: string;
  name: string;
  label: string;
  description?: string;
  system?: boolean;
  kind?: ProfileKind;
};
type CatalogModule = {
  id: string;
  label: string;
  permissions: Array<{ code: string; label: string; description: string }>;
};

function mapsDiffer(left: Record<string, boolean>, right: Record<string, boolean>): boolean {
  const codes = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const code of codes) {
    if ((left[code] === true) !== (right[code] === true)) return true;
  }
  return false;
}

export function DesktopSpaceProfiles({
  onDirtyChange,
}: {
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [profiles, setProfiles] = useState<ProfileRow[] | null>(null);
  const [modules, setModules] = useState<CatalogModule[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState<Record<string, boolean>>({});
  const [callerGrantable, setCallerGrantable] = useState<string[]>([]);
  const [grantable, setGrantable] = useState<string[]>([]);
  const [readOnly, setReadOnly] = useState(false);
  const [readOnlyReason, setReadOnlyReason] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProfiles = useCallback(async () => {
    const [rolesResponse, catalogResponse] = await Promise.all([
      fetch("/api/identity/roles").catch(() => null),
      fetch("/api/identity/permissions/catalog").catch(() => null),
    ]);
    const rolesBody = (await rolesResponse?.json().catch(() => null)) as {
      ok?: boolean;
      roles?: ProfileRow[];
      grantable?: string[];
      error?: string;
    } | null;
    const catalogBody = (await catalogResponse?.json().catch(() => null)) as {
      ok?: boolean;
      modules?: CatalogModule[];
    } | null;
    if (!rolesResponse?.ok || !rolesBody?.ok) {
      setError(rolesBody?.error || "No se pudieron cargar los perfiles.");
      setProfiles([]);
      return;
    }
    setError("");
    setProfiles((rolesBody.roles ?? []).filter((role) => role.kind !== "product"));
    setCallerGrantable(rolesBody.grantable ?? []);
    setModules(catalogBody?.modules ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        if (!cancelled) await loadProfiles();
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [loadProfiles]);

  const selected = profiles?.find((profile) => profile.id === selectedId) ?? null;
  const dirty = creating
    ? Boolean(name.trim() || description.trim() || Object.values(draft).some(Boolean))
    : mapsDiffer(savedMap, draft);

  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);

  const grantableSet = useMemo(() => new Set(grantable), [grantable]);

  async function openProfile(profile: ProfileRow) {
    if (dirty) {
      const leave = window.confirm("Hay cambios sin guardar. ¿Descartarlos?");
      if (!leave) return;
    }
    setCreating(false);
    setName("");
    setDescription("");
    setSelectedId(profile.id);
    setError("");
    setNotice("");
    setSaving(true);
    const response = await fetch(`/api/identity/roles/${encodeURIComponent(profile.id)}/permissions`).catch(
      () => null
    );
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      permissionMap?: Record<string, boolean>;
      grantable?: string[];
      readOnly?: boolean;
      readOnlyReason?: string;
    } | null;
    if (!response?.ok || !body?.ok) {
      setError(body?.error || "No se pudo abrir el perfil.");
      setSaving(false);
      return;
    }
    const map = body.permissionMap ?? {};
    setSavedMap(map);
    setDraft({ ...map });
    setGrantable(body.grantable ?? []);
    setReadOnly(body.readOnly === true);
    setReadOnlyReason(body.readOnlyReason ?? "");
    setSaving(false);
  }

  function startCreate() {
    if (dirty) {
      const leave = window.confirm("Hay cambios sin guardar. ¿Descartarlos?");
      if (!leave) return;
    }
    setSelectedId(null);
    setCreating(true);
    setName("");
    setDescription("");
    setSavedMap({});
    setDraft({});
    setReadOnly(false);
    setReadOnlyReason("");
    setGrantable(callerGrantable);
    setNotice("");
    setError("");
  }

  function toggle(code: string) {
    if (readOnly || saving || !grantableSet.has(code)) return;
    setDraft((current) => ({ ...current, [code]: current[code] !== true }));
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    if (creating) {
      const response = await fetch("/api/identity/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, permissionMap: draft }),
      }).catch(() => null);
      const body = (await response?.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        role?: { id: string };
      } | null;
      if (!response?.ok || !body?.ok || !body.role) {
        setError(body?.error || "No se pudo crear el perfil.");
        setSaving(false);
        return;
      }
      setSavedMap({ ...draft });
      setCreating(false);
      setName("");
      setDescription("");
      await loadProfiles();
      setSelectedId(body.role.id);
      setNotice("Perfil creado.");
      setSaving(false);
      return;
    }
    if (!selected) {
      setSaving(false);
      return;
    }
    const response = await fetch(`/api/identity/roles/${encodeURIComponent(selected.id)}/permissions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissionMap: draft }),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (!response?.ok || !body?.ok) {
      setError(body?.error || "No se pudo guardar el perfil.");
      setSaving(false);
      return;
    }
    setSavedMap({ ...draft });
    setNotice("Perfil guardado.");
    setSaving(false);
  }

  return (
    <div className="space-presence team-admin">
      <div className="space-presence-bar">
        <div>
          <h3>Perfiles</h3>
          <p>
            Plantillas de la empresa. Las llaves de aplicación se reparten en Equipo. Los roles
            internos de cada producto no se editan aquí.
          </p>
        </div>
        <button type="button" className="primary" onClick={startCreate}>
          Nuevo perfil
        </button>
      </div>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? <p className="form-ok">{notice}</p> : null}
      {profiles === null ? <p className="ajustes-wait">Cargando perfiles…</p> : null}

      {profiles ? (
        <div className={`team-desk${creating || selected ? " is-detail" : ""}`}>
          <div className="team-list-pane">
            {profiles.length === 0 ? (
              <p className="ajustes-wait">Todavía no hay perfiles de empresa en este Espacio.</p>
            ) : (
              <ul className="team-list">
                {profiles.map((profile) => (
                  <li key={profile.id}>
                    <button
                      type="button"
                      className={`team-row${selected?.id === profile.id ? " is-on" : ""}`}
                      onClick={() => void openProfile(profile)}
                    >
                      <span className="team-row-copy">
                        <strong>{profile.label || profile.name}</strong>
                        <span>{profile.description || "Perfil de la empresa"}</span>
                        <span className="team-pills">
                          <span className="team-pill">
                            {profile.kind === "custom" || profile.system === false
                              ? "Personalizado"
                              : "Del sistema"}
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="team-detail">
            {creating || selected ? (
              <form
                className="team-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void save();
                }}
              >
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    if (dirty && !window.confirm("Hay cambios sin guardar. ¿Descartarlos?")) return;
                    setCreating(false);
                    setSelectedId(null);
                    setDraft({});
                    setSavedMap({});
                    setName("");
                    setDescription("");
                  }}
                >
                  Volver a la lista
                </button>
                <h4>{creating ? "Nuevo perfil" : selected?.label || selected?.name}</h4>
                {creating ? (
                  <>
                    <label>
                      Nombre
                      <input value={name} onChange={(event) => setName(event.target.value)} required />
                    </label>
                    <label>
                      Descripción
                      <input
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                      />
                    </label>
                  </>
                ) : (
                  <p className="team-note">{selected?.description || "Perfil de la empresa."}</p>
                )}
                {readOnly ? (
                  <p className="form-error" role="status">
                    {readOnlyReason || "Este perfil está protegido."}
                  </p>
                ) : null}
                <div className="team-permissions">
                  {modules.map((module) => (
                    <DesktopSwitchGroup key={module.id} label={module.label}>
                      {module.permissions.map((permission) => {
                        const allowed = grantableSet.has(permission.code);
                        return (
                          <DesktopSwitchRow
                            key={permission.code}
                            title={permission.label}
                            detail={
                              !allowed
                                ? "Fuera de tu alcance"
                                : permission.description || undefined
                            }
                            checked={draft[permission.code] === true}
                            disabled={readOnly || saving || !allowed}
                            onChange={() => toggle(permission.code)}
                          />
                        );
                      })}
                    </DesktopSwitchGroup>
                  ))}
                </div>
                <div className="team-actions">
                  <button type="submit" className="primary" disabled={saving || readOnly || !dirty}>
                    Guardar
                  </button>
                </div>
                {dirty ? <p className="team-note">Hay cambios sin guardar en este perfil.</p> : null}
              </form>
            ) : (
              <p className="team-note">Elige un perfil para ver qué puede hacer.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
