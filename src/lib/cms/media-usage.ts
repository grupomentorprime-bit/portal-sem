/**
 * @deprecated Usar src/core/media/usage — mantiene compatibilidad con imports existentes.
 */
export { findMediaByUrl } from "@/core/media/lookup";
export { rebuildUsageIndex } from "@/core/media/usage";
export { mediaHasUsage } from "./media-usage-helpers";

export async function syncBrandingMediaUsage(tenant: string): Promise<void> {
  const { rebuildUsageIndex } = await import("@/core/media/usage");
  await rebuildUsageIndex(tenant);
}
