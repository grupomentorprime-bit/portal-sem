import type { IdentityMembership } from "@/types/identity";

/**
 * Elige el Espacio activo entre membresías válidas.
 * Preferencia: preferred si sigue disponible → primer membresía (joinedAt ASC).
 */
export function pickActiveTenantId(
  memberships: ReadonlyArray<Pick<IdentityMembership, "tenantId" | "joinedAt">>,
  preferredTenantId?: string | null
): string | null {
  if (memberships.length === 0) return null;

  const ids = new Set(memberships.map((m) => m.tenantId));
  const preferred = preferredTenantId?.trim() ?? "";
  if (preferred && ids.has(preferred)) return preferred;

  const sorted = [...memberships].sort((a, b) =>
    a.joinedAt.localeCompare(b.joinedAt)
  );
  return sorted[0]?.tenantId ?? null;
}
