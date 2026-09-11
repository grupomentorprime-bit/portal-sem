/**
 * ADR-010 §4.3 — ingestKey = `{sourceCollection}:{sourceId}:{kind}`
 * Unique sparse futuro en growth_actividades (tenantId + ingestKey).
 */

export function buildGrowthIngestKey(
  sourceCollection: string,
  sourceId: string,
  kind: string
): string {
  return `${sourceCollection}:${sourceId}:${kind}`;
}
