/**
 * IDs físicos tenantizados para recursos con `_id` global en Mongo
 * (pages, menus, integraciones). El API sigue aceptando IDs lógicos
 * (`home`, `main`, `storage`); el almacenamiento usa `{tenantId}:{logicalId}`.
 */

export const RESOURCE_ID_SEP = ":" as const;

/** `_id` legado de platform_integrations antes de SAAS-004. */
export const LEGACY_STORAGE_INTEGRATION_ID = "storage" as const;

export function scopedResourceId(tenantId: string, logicalOrScopedId: string): string {
  const logical = logicalResourceId(tenantId, logicalOrScopedId);
  return `${tenantId}${RESOURCE_ID_SEP}${logical}`;
}

export function isScopedResourceId(tenantId: string, id: string): boolean {
  return id.startsWith(`${tenantId}${RESOURCE_ID_SEP}`);
}

/** Quita el prefijo del tenant si existe; si no, devuelve el id tal cual (legado). */
export function logicalResourceId(tenantId: string, id: string): string {
  const prefix = `${tenantId}${RESOURCE_ID_SEP}`;
  return id.startsWith(prefix) ? id.slice(prefix.length) : id;
}

/**
 * Candidatos de lookup: scoped primero, luego bare (compat SEM pre-migración).
 * Evita colisión entre tenants al escribir siempre scoped.
 */
export function resourceIdCandidates(tenantId: string, id: string): string[] {
  const logical = logicalResourceId(tenantId, id);
  const scoped = `${tenantId}${RESOURCE_ID_SEP}${logical}`;
  if (scoped === logical) return [scoped];
  return [scoped, logical];
}

export function storageIntegrationIdForTenant(tenantId: string): string {
  return `${LEGACY_STORAGE_INTEGRATION_ID}${RESOURCE_ID_SEP}${tenantId}`;
}

/** True si el id lógico (o scoped) es la home del portal. */
export function isHomePageId(tenantId: string, id: string): boolean {
  return logicalResourceId(tenantId, id) === "home";
}
