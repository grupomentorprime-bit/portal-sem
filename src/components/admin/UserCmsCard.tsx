"use client";

import Link from "next/link";
import { History, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui";
import { AdminUserAvatar } from "@/components/admin/AdminUserAvatar";
import { formatRelativeTime } from "@/lib/admin/audit-labels";
import { ROLE_CODES } from "@/core/identity/roles/codes";
import { isProtectedMember, rolesIncludeCode } from "@/core/identity/roles/helpers";
import type { UserMemberDrawerMode } from "@/components/admin/UserMemberDrawer";
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

export type MemberAction = "suspend" | "block" | "archive" | "restore" | "remove";

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
  onOpenDrawer?: (mode: UserMemberDrawerMode) => void;
  onRoleChange?: (membershipId: string, roleCode: string) => void;
  onMemberAction?: (membershipId: string, action: MemberAction) => void;
  saving?: boolean;
  actionSaving?: MemberAction | null;
}

export function UserCmsCard({
  member,
  assignableRoles = [],
  activePanel = null,
  onPanelToggle,
  onOpenDrawer,
  onRoleChange,
  onMemberAction,
  saving,
  actionSaving,
}: UserCmsCardProps) {
  const showRoles = activePanel === "roles";
  const showActions = activePanel === "actions";
  const primaryRole = member.roles[0];
  const isProtected = isProtectedMember(member.roles);
  const isStudentAffairs = rolesIncludeCode(member.roles, ROLE_CODES.STUDENT_AFFAIRS);
  const label = member.displayName || member.email;
  const canEditRole = !isProtected && member.status === "active" && onRoleChange && assignableRoles.length > 0;
  const canManage = !isProtected && onMemberAction;
  const isArchived = member.status === "archived";
  const busy = Boolean(saving || actionSaving);

  const statusLabel =
    member.status === "active"
      ? "Activo"
      : member.status === "archived"
        ? "Archivado"
        : member.status === "suspended"
          ? "Suspendido"
          : member.status;
  const statusVariant =
    member.status === "active" ? "success" : member.status === "archived" ? "warning" : "neutral";

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
        isArchived && "border-[var(--state-warning-border)] bg-[var(--state-warning-bg)]/25",
        activePanel && "ring-1 ring-primary/15"
      )}
    >
      <div className="flex items-start gap-3">
        <AdminUserAvatar name={label} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-foreground">{label}</h3>
          <p className="truncate text-sm text-muted">{member.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="neutral">{primaryRole?.label ?? "Colaborador"}</Badge>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
          <p className="mt-1.5 text-[11px] text-muted">
            Último acceso:{" "}
            {member.lastLoginAt ? formatRelativeTime(member.lastLoginAt) : "Sin registro"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
        {canEditRole ? (
          <button
            type="button"
            onClick={() => onPanelToggle?.("roles")}
            disabled={busy}
            className={panelButtonClass("roles")}
          >
            Editar rol
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => onOpenDrawer?.("permissions")}
          className={panelButtonClass("roles")}
        >
          Permisos
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onOpenDrawer?.("audit")}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition hover:bg-background-muted hover:text-foreground disabled:opacity-50"
        >
          <History className="h-3.5 w-3.5" aria-hidden />
          Historial
        </button>
        {canManage ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onPanelToggle?.("actions")}
            className={panelButtonClass("actions")}
          >
            Acciones
          </button>
        ) : null}
      </div>

      {showActions && canManage ? (
        <div className="mt-3 rounded-lg border border-border/80 bg-background-soft p-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {isArchived ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onMemberAction(member.membershipId, "restore")}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-left text-sm hover:bg-background-muted disabled:opacity-50"
                >
                  {actionSaving === "restore" ? "Restaurando…" : "Restaurar"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onMemberAction(member.membershipId, "remove")}
                  className="rounded-lg border border-[var(--state-danger-border)] bg-background px-3 py-2 text-left text-sm text-[var(--color-danger)] hover:bg-[var(--state-danger-bg)] disabled:opacity-50 sm:col-span-2"
                >
                  {actionSaving === "remove" ? "Eliminando…" : "Eliminar definitivamente"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onMemberAction(member.membershipId, "suspend")}
                  className="rounded-lg border border-[var(--state-warning-border)] bg-background px-3 py-2 text-left text-sm text-[var(--color-warning)] hover:bg-[var(--state-warning-bg)] disabled:opacity-50"
                >
                  {actionSaving === "suspend" ? "Suspendiendo…" : "Suspender"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onMemberAction(member.membershipId, "block")}
                  className="rounded-lg border border-[var(--state-danger-border)] bg-background px-3 py-2 text-left text-sm text-[var(--color-danger)] hover:bg-[var(--state-danger-bg)] disabled:opacity-50"
                >
                  {actionSaving === "block" ? "Bloqueando…" : "Bloquear"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onMemberAction(member.membershipId, "archive")}
                  className="rounded-lg border border-[var(--state-danger-border)] bg-background px-3 py-2 text-left text-sm text-[var(--color-danger)] hover:bg-[var(--state-danger-bg)] disabled:opacity-50"
                >
                  {actionSaving === "archive" ? "Archivando…" : "Eliminar"}
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}

      {isStudentAffairs ? (
        <Link
          href="/admin/portal/asuntos-estudiantiles/equipo"
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          <Settings2 className="h-3 w-3" aria-hidden />
          Asignar formularios y generaciones
        </Link>
      ) : null}

      {showRoles && canEditRole ? (
        <div className="mt-3 rounded-lg border border-border/80 bg-background-soft p-3">
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

      {showRoles && isProtected ? (
        <p className="mt-3 text-sm text-muted">
          Este usuario tiene acceso reservado de Super Admin.
        </p>
      ) : null}
    </article>
  );
}
