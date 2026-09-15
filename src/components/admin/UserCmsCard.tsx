"use client";

import { Badge } from "@/components/ui";
import { AdminUserAvatar } from "@/components/admin/AdminUserAvatar";
import { isProtectedMember } from "@/core/identity/roles/helpers";
import { cn } from "@/lib/utils";

interface UserRole {
  id: string;
  name: string;
  code?: string;
  label: string;
}

export interface AssignableRole {
  id: string;
  name: string;
  code: string;
  label: string;
}

export type MemberAction = "remove-access";

export type UserCmsCardPanel = "roles" | "actions";

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
  assignableRoles?: AssignableRole[];
  activePanel?: UserCmsCardPanel | null;
  onPanelToggle?: (panel: UserCmsCardPanel) => void;
  onRoleChange?: (membershipId: string, roleCode: string) => void;
  onMemberAction?: (membershipId: string, action: MemberAction) => void;
  saving?: boolean;
  actionSaving?: MemberAction | null;
}

function statusLabel(status: string): string | null {
  if (status === "active") return null;
  if (status === "archived") return "Sin acceso";
  if (status === "suspended") return "Sin acceso";
  return status;
}

export function UserCmsCard({
  member,
  assignableRoles = [],
  activePanel = null,
  onPanelToggle,
  onRoleChange,
  onMemberAction,
  saving,
  actionSaving,
}: UserCmsCardProps) {
  const showRoles = activePanel === "roles";
  const showActions = activePanel === "actions";
  const primaryRole = member.roles[0];
  const isProtected = isProtectedMember(member.roles);
  const label = member.displayName || member.email;
  const roleLabel = primaryRole?.label ?? "Colaborador";
  const canEditRole =
    !isProtected && member.status === "active" && onRoleChange && assignableRoles.length > 0;
  const canManage = !isProtected && onMemberAction && member.status === "active";
  const busy = Boolean(saving || actionSaving);
  const usefulStatus = statusLabel(member.status);

  const panelButtonClass = (panel: UserCmsCardPanel) =>
    cn(
      "rounded-lg border px-3 py-1.5 text-sm transition disabled:opacity-50",
      activePanel === panel
        ? "border-primary bg-primary/8 font-medium text-primary"
        : "border-border text-muted hover:bg-background-muted hover:text-foreground"
    );

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-background p-4 shadow-sm transition-shadow",
        member.status !== "active" &&
          "border-[var(--state-warning-border)] bg-[var(--state-warning-bg)]/25",
        activePanel && "ring-1 ring-primary/15"
      )}
      data-team-member
    >
      <div className="flex items-start gap-3">
        <AdminUserAvatar name={label} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h3 className="truncate font-semibold text-foreground">{label}</h3>
            <span className="text-sm font-medium text-foreground/80">{roleLabel}</span>
          </div>
          <p className="mt-0.5 truncate text-sm text-muted">{member.email}</p>
          {usefulStatus ? (
            <div className="mt-2">
              <Badge variant="warning">{usefulStatus}</Badge>
            </div>
          ) : null}
        </div>
      </div>

      {(canEditRole || canManage) && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
          {canEditRole ? (
            <button
              type="button"
              onClick={() => onPanelToggle?.("roles")}
              disabled={busy}
              className={panelButtonClass("roles")}
            >
              Cambiar rol
            </button>
          ) : null}
          {canManage ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onPanelToggle?.("actions")}
              className={panelButtonClass("actions")}
            >
              Gestionar
            </button>
          ) : null}
        </div>
      )}

      {isProtected && member.status === "active" ? (
        <p className="mt-3 text-xs text-muted">Dueño del Espacio — rol no modificable desde Equipo.</p>
      ) : null}

      {showActions && canManage ? (
        <div className="mt-3 rounded-lg border border-border/80 bg-background-soft p-3" data-team-remove>
          <button
            type="button"
            disabled={busy}
            onClick={() => onMemberAction(member.membershipId, "remove-access")}
            className="w-full rounded-lg border border-[var(--state-danger-border)] bg-background px-3 py-2 text-left text-sm text-[var(--color-danger)] hover:bg-[var(--state-danger-bg)] disabled:opacity-50"
          >
            {actionSaving === "remove-access" ? "Quitando acceso…" : "Quitar acceso"}
          </button>
        </div>
      ) : null}

      {showRoles && canEditRole ? (
        <div className="mt-3 rounded-lg border border-border/80 bg-background-soft p-3" data-team-roles>
          <div className="grid gap-2 sm:grid-cols-2">
            {assignableRoles.map((role) => (
              <button
                key={role.id}
                type="button"
                disabled={saving}
                onClick={() => onRoleChange(member.membershipId, role.code)}
                className={cn(
                  "rounded-lg border bg-background px-3 py-2 text-left text-sm transition",
                  primaryRole?.code === role.code
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                )}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
