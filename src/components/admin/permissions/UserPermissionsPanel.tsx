"use client";

import { PermissionMatrixEditor } from "@/components/admin/permissions/PermissionMatrixEditor";
import { cn } from "@/lib/utils";

interface UserPermissionsPanelProps {
  membershipId: string;
  displayName: string;
  onClose?: () => void;
}

export function UserPermissionsPanel({
  membershipId,
  displayName,
  onClose,
}: UserPermissionsPanelProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-background-muted/20 p-4", onClose ? "" : "mt-4")}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold">Permisos personalizados</h4>
          <p className="text-sm text-muted">{displayName}</p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted hover:text-foreground"
          >
            Cerrar
          </button>
        ) : null}
      </div>
      <PermissionMatrixEditor membershipId={membershipId} mode="user" />
    </div>
  );
}
