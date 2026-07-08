"use client";

import { useCallback, useEffect, useState } from "react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import {
  AdminModuleCenter,
  AdminModuleHero,
  AdminModuleSectionHeader,
} from "@/components/admin/AdminModuleCenter";
import { PermissionMatrixEditor } from "@/components/admin/permissions/PermissionMatrixEditor";
import { getInstitutionalRoleLabel } from "@/lib/admin/institutional";
import { ADMIN_PANEL_META } from "@/lib/admin/module-panels";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleOption {
  id: string;
  code?: string;
  name: string;
  label: string;
}

export function RolesPermissionsClient() {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/identity/roles");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "No se pudieron cargar los roles.");
      const options: RoleOption[] = (data.roles ?? []).map(
        (r: { id: string; code?: string; name: string; label?: string }) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          label: r.label ?? getInstitutionalRoleLabel(r.code ?? r.name),
        })
      );
      setRoles(options);
      setSelectedRoleId((current) => current || options[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar roles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useDeferredEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  if (loading) return <p className="text-sm text-muted">Cargando roles…</p>;

  return (
    <AdminModuleCenter>
      <AdminModuleHero {...ADMIN_PANEL_META.roles} />

      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}

      <section className="space-y-4">
        <AdminModuleSectionHeader
          icon={Shield}
          title="Editor de roles"
          description="Los cambios aplican a nuevos usuarios y a quienes restablezcan permisos."
        />

        <div className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRoleId(role.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition",
                selectedRoleId === role.id
                  ? "bg-primary text-text-inverse"
                  : "bg-background text-muted hover:bg-background-muted"
              )}
            >
              {role.label}
            </button>
          ))}
        </div>

        {selectedRole ? (
          <PermissionMatrixEditor key={selectedRole.id} roleId={selectedRole.id} mode="role" />
        ) : null}
      </section>
    </AdminModuleCenter>
  );
}
