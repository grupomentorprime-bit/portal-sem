"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";
import { AdminUserAvatar } from "@/components/admin/AdminUserAvatar";
import { CMS_INVITE_ROLES } from "@/lib/admin/institutional";
import { formatRelativeTime } from "@/lib/admin/audit-labels";
import { cn } from "@/lib/utils";

interface UserRole {
  id: string;
  name: string;
  label: string;
}

export interface UserCmsCardData {
  membershipId: string;
  displayName: string;
  email: string;
  status: string;
  roles: UserRole[];
  roleIds: string[];
  lastLoginAt?: string;
}

interface UserCmsCardProps {
  member: UserCmsCardData;
  onRoleChange?: (membershipId: string, roleName: string) => void;
  saving?: boolean;
}

export function UserCmsCard({ member, onRoleChange, saving }: UserCmsCardProps) {
  const [showRoles, setShowRoles] = useState(false);
  const primaryRole = member.roles[0];
  const isDirector = member.roles.some((r) => r.name === "Tenant Owner");
  const label = member.displayName || member.email;

  return (
    <article className="rounded-xl border border-border bg-background p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <AdminUserAvatar name={label} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-foreground">{label}</h3>
          <p className="truncate text-sm text-muted">{member.email}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{primaryRole?.label ?? "Colaborador"}</Badge>
            <Badge variant={member.status === "active" ? "success" : "neutral"}>
              {member.status === "active" ? "Activo" : member.status}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted">
            Último acceso:{" "}
            {member.lastLoginAt ? formatRelativeTime(member.lastLoginAt) : "Sin registro"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
        {!isDirector && onRoleChange ? (
          <button
            type="button"
            onClick={() => setShowRoles((v) => !v)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-background-muted"
          >
            Editar rol
          </button>
        ) : null}
        <button
          type="button"
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted"
          onClick={() => setShowRoles((v) => !v)}
        >
          Permisos
        </button>
      </div>

      {showRoles && !isDirector && onRoleChange ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {CMS_INVITE_ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              disabled={saving}
              onClick={() => onRoleChange(member.membershipId, role.internalName)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-sm transition",
                primaryRole?.name === role.internalName
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              )}
            >
              {role.label}
            </button>
          ))}
        </div>
      ) : null}

      {showRoles && isDirector ? (
        <p className="mt-3 text-sm text-muted">
          El Director General conserva acceso completo al CMS.
        </p>
      ) : null}
    </article>
  );
}
