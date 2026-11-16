"use client";

import { Badge } from "@/components/ui";
import { AdminUserAvatar } from "@/components/admin/AdminUserAvatar";
import { isProtectedMember } from "@/core/identity/roles/helpers";
import { cn } from "@/lib/utils";
import { Mail, Pencil, UserMinus } from "lucide-react";

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

export type MemberAction = "remove-access" | "resend-access";

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
  layout?: "list" | "board";
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
  layout = "board",
}: UserCmsCardProps) {
  const showRoles = activePanel === "roles";
  const primaryRole = member.roles[0];
  const isProtected = isProtectedMember(member.roles);
  const label = member.displayName || member.email;
  const roleLabel = primaryRole?.label ?? "Colaborador";
  const canEditRole =
    !isProtected && member.status === "active" && onRoleChange && assignableRoles.length > 0;
  const canManage = !isProtected && onMemberAction && member.status === "active";
  const busy = Boolean(saving || actionSaving);
  const usefulStatus = statusLabel(member.status);

  const menu = (canEditRole || canManage) ? (
    <div className="users-cms-person-actions" aria-label={`Acciones de ${label}`}>
      {canManage ? (
        <button
          type="button"
          className="users-cms-icon-act users-cms-icon-act--send"
          aria-label="Reenviar acceso"
          title={actionSaving === "resend-access" ? "Enviando…" : "Reenviar acceso"}
          data-team-resend-access
          disabled={busy}
          onClick={() => onMemberAction(member.membershipId, "resend-access")}
        >
          <Mail aria-hidden />
        </button>
      ) : null}
      {canEditRole ? (
        <button
          type="button"
          className={cn("users-cms-icon-act users-cms-icon-act--edit", showRoles && "is-on")}
          aria-label="Cambiar rol"
          title="Cambiar rol"
          disabled={busy}
          onClick={() => onPanelToggle?.("roles")}
        >
          <Pencil aria-hidden />
        </button>
      ) : null}
      {canManage ? (
        <button
          type="button"
          className="users-cms-icon-act users-cms-icon-act--remove"
          aria-label="Quitar acceso"
          title="Quitar acceso"
          data-team-remove
          disabled={busy}
          onClick={() => onMemberAction(member.membershipId, "remove-access")}
        >
          <UserMinus aria-hidden />
        </button>
      ) : null}
    </div>
  ) : null;

  return (
    <article
      className={cn(
        "users-cms-person",
        layout === "list" ? "users-cms-person--list" : "users-cms-person--board",
        member.status !== "active" && "users-cms-person--inactive",
        activePanel && "users-cms-person--open"
      )}
      data-team-member
      data-team-layout={layout}
    >
      <div className="users-cms-person-main">
        <div className="users-cms-person-identity">
          <AdminUserAvatar name={label} size="md" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-foreground">{label}</h3>
            <p className="mt-0.5 truncate text-sm text-muted">{member.email}</p>
            {layout === "board" && isProtected ? (
              <span className="users-cms-role mt-2">Super administrador</span>
            ) : null}
            {usefulStatus ? (
              <div className="mt-2">
                <Badge variant="warning">{usefulStatus}</Badge>
              </div>
            ) : null}
          </div>
        </div>
        {layout === "list" ? (
          <div className="users-cms-roles">
            <span className="users-cms-role">{roleLabel}</span>
            {isProtected ? <span className="users-cms-role">Super administrador</span> : null}
          </div>
        ) : null}
        {menu}
      </div>

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
