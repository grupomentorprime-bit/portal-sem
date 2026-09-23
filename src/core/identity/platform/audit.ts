import type { IdentityAuditEntry } from "@/types/identity";

export const PLATFORM_AUDIT_SCOPE = "platform" as const;

export type PlatformAuditAction =
  | "platform.role.grant"
  | "platform.role.revoke"
  | "platform.access.denied"
  | "platform.space.create"
  | "platform.space.delete"
  | "platform.space.status"
  | "platform.space.access.grant";

export function isPlatformAuditEntry(
  entry: Pick<IdentityAuditEntry, "scope" | "tenantId">
): boolean {
  return entry.scope === PLATFORM_AUDIT_SCOPE;
}

/** Entradas globales no deben aparecer en la auditoría de un Espacio. */
export function tenantAuditFilter(tenantId: string): { tenantId: string } {
  return { tenantId };
}

export function platformAuditFilter(): { scope: typeof PLATFORM_AUDIT_SCOPE } {
  return { scope: PLATFORM_AUDIT_SCOPE };
}
