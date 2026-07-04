/**
 * OT-IAM-002 — Contexto de Scopes (fase futura).
 * Preparado para restricciones por programa, convocatoria, generación, etc.
 */
export interface PermissionScopeContext {
  programIds?: string[];
  convocationIds?: string[];
  generationCodes?: string[];
  formIds?: string[];
  siteIds?: string[];
  academicPeriodIds?: string[];
  organizationIds?: string[];
}

export function applyScopeRestrictions<T extends { effective: Record<string, boolean> }>(
  result: T,
  _scope: PermissionScopeContext | null
): T {
  return result;
}
