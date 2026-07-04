"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PermissionRow {
  code: string;
  label: string;
  description: string;
  roleAllowed?: boolean;
  allowed: boolean;
  origin?: "role" | "override" | "denied";
}

interface PermissionModule {
  id: string;
  label: string;
  permissions: Array<{ code: string; label: string; description: string }>;
}

interface PermissionMatrixEditorProps {
  membershipId?: string;
  roleId?: string;
  mode: "user" | "role";
  onSaved?: () => void;
}

export function PermissionMatrixEditor({
  membershipId,
  roleId,
  mode,
  onSaved,
}: PermissionMatrixEditorProps) {
  const [modules, setModules] = useState<PermissionModule[]>([]);
  const [rows, setRows] = useState<PermissionRow[]>([]);
  const [draft, setDraft] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasOverrides, setHasOverrides] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const catalogRes = await fetch("/api/identity/permissions/catalog");
      const catalog = await catalogRes.json();
      if (!catalog.ok) throw new Error(catalog.error ?? "No se pudo cargar el catálogo.");

      setModules(catalog.modules ?? []);

      if (mode === "user" && membershipId) {
        const res = await fetch(`/api/identity/members/${membershipId}/permissions`);
        const data = await res.json();
        if (!data.ok) throw new Error(data.error ?? "No se pudieron cargar permisos.");

        const resolvedRows: PermissionRow[] = (data.resolved ?? []).map(
          (item: {
            code: string;
            allowed: boolean;
            origin: "role" | "override" | "denied";
            roleAllowed: boolean;
          }) => {
            const def = catalog.modules
              .flatMap((m: PermissionModule) => m.permissions)
              .find((p: { code: string }) => p.code === item.code);
            return {
              code: item.code,
              label: def?.label ?? item.code,
              description: def?.description ?? "",
              allowed: item.allowed,
              roleAllowed: item.roleAllowed,
              origin: item.origin,
            };
          }
        );
        setRows(resolvedRows);
        setHasOverrides(data.hasOverrides === true);
        const initialDraft: Record<string, boolean> = {};
        for (const row of resolvedRows) initialDraft[row.code] = row.allowed;
        setDraft(initialDraft);
      }

      if (mode === "role" && roleId) {
        const res = await fetch(`/api/identity/roles/${roleId}/permissions`);
        const data = await res.json();
        if (!data.ok) throw new Error(data.error ?? "No se pudieron cargar permisos del rol.");

        const map = data.permissionMap ?? {};
        setRows([]);
        setDraft({ ...map });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar permisos.");
    } finally {
      setLoading(false);
    }
  }, [membershipId, roleId, mode]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      if (mode === "user" && membershipId) {
        const overrides: Record<string, boolean> = {};
        for (const row of rows) {
          const roleDefault = row.roleAllowed === true;
          if (draft[row.code] !== roleDefault) overrides[row.code] = draft[row.code] === true;
        }
        const res = await fetch(`/api/identity/members/${membershipId}/permissions`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ overrides }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error ?? "No se pudieron guardar los permisos.");
      }

      if (mode === "role" && roleId) {
        const res = await fetch(`/api/identity/roles/${roleId}/permissions`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissionMap: draft }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error ?? "No se pudo actualizar el rol.");
      }

      await load();
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!membershipId || mode !== "user") return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/identity/members/${membershipId}/permissions`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "No se pudo restablecer.");
      await load();
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al restablecer.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted">Cargando permisos…</p>;

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b bg-background-muted/40 text-muted">
              <th className="px-4 py-2 font-medium">Permiso</th>
              {mode === "user" ? (
                <>
                  <th className="px-4 py-2 text-center font-medium">Rol</th>
                  <th className="px-4 py-2 text-center font-medium">Personalizado</th>
                </>
              ) : null}
              <th className="px-4 py-2 text-center font-medium">Activo</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((mod) => (
              <Fragment key={mod.id}>
                <tr className="bg-background-soft">
                  <td colSpan={mode === "user" ? 4 : 2} className="px-4 py-2 font-semibold">
                    {mod.label}
                  </td>
                </tr>
                {mod.permissions.map((perm) => {
                  const row = rows.find((r) => r.code === perm.code);
                  const checked = draft[perm.code] === true;
                  const isOverride = row?.origin === "override";
                  return (
                    <tr key={perm.code} className="border-b border-border/60">
                      <td className="px-4 py-2">
                        <div className="font-medium">{perm.label}</div>
                        <div className="text-xs text-muted">{perm.description}</div>
                      </td>
                      {mode === "user" ? (
                        <>
                          <td className="px-4 py-2 text-center">
                            {row?.roleAllowed ? "✅" : "—"}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {isOverride ? (checked ? "✅" : "❌") : "—"}
                          </td>
                        </>
                      ) : null}
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setDraft((prev) => ({ ...prev, [perm.code]: e.target.checked }))
                          }
                          className={cn("h-4 w-4 rounded border-border")}
                        />
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando…" : "Guardar permisos"}
        </Button>
        {mode === "user" && hasOverrides ? (
          <Button type="button" variant="ghost" onClick={handleReset} disabled={saving}>
            Restablecer permisos del rol
          </Button>
        ) : null}
      </div>
    </div>
  );
}
