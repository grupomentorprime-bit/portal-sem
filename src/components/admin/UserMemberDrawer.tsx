"use client";

import { useCallback, useEffect, useState } from "react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import { AuditTimeline, type AuditTimelineEntry } from "@/components/admin/AuditTimeline";
import { Drawer } from "@/components/admin/kit/drawers/Drawer";
import { LoadingState } from "@/components/admin/kit";
import { UserPermissionsPanel } from "@/components/admin/permissions/UserPermissionsPanel";

export type UserMemberDrawerMode = "permissions" | "audit";

export interface UserMemberDrawerTarget {
  membershipId: string;
  displayName: string;
  isProtected: boolean;
}

interface UserMemberDrawerProps {
  target: UserMemberDrawerTarget | null;
  mode: UserMemberDrawerMode | null;
  onClose: () => void;
}

export function UserMemberDrawer({ target, mode, onClose }: UserMemberDrawerProps) {
  const [auditEntries, setAuditEntries] = useState<AuditTimelineEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const loadAudit = useCallback(async (membershipId: string) => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const res = await fetch(`/api/identity/members/${encodeURIComponent(membershipId)}/audit`);
      const data = await res.json();
      if (!data.ok) {
        setAuditError(data.error ?? "No se pudo cargar el historial.");
        setAuditEntries([]);
        return;
      }
      setAuditEntries(data.entries ?? []);
    } catch {
      setAuditError("Error de red al cargar el historial.");
      setAuditEntries([]);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useDeferredEffect(() => {
    if (!target || mode !== "audit") {
      setAuditEntries([]);
      setAuditError(null);
      return;
    }
    void loadAudit(target.membershipId);
  }, [target, mode, loadAudit]);

  const open = Boolean(target && mode);
  if (!open || !target || !mode) return null;

  const title =
    mode === "permissions"
      ? `Permisos · ${target.displayName}`
      : `Historial · ${target.displayName}`;

  return (
    <Drawer open={open} onClose={onClose} title={title} className="max-w-md">
      <div className="flex-1 overflow-y-auto p-4">
        {mode === "permissions" ? (
          target.isProtected ? (
            <p className="text-sm text-muted">
              Este usuario tiene acceso reservado de Super Admin y no puede modificarse desde aquí.
            </p>
          ) : (
            <UserPermissionsPanel
              membershipId={target.membershipId}
              displayName={target.displayName}
              onClose={onClose}
            />
          )
        ) : null}

        {mode === "audit" ? (
          <>
            {auditLoading ? <LoadingState variant="table" rows={4} /> : null}
            {auditError ? (
              <p className="rounded-lg border border-[var(--state-danger-border)] bg-[var(--state-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
                {auditError}
              </p>
            ) : null}
            {!auditLoading && !auditError ? (
              <AuditTimeline entries={auditEntries} compact />
            ) : null}
          </>
        ) : null}
      </div>
    </Drawer>
  );
}
