/**
 * Asegura embudos del Espacio en producción antes de captar o leer Ventas.
 */

import "server-only";

import { ensureGrowthFunnelsForTenant, growthFunnelInitialKeys } from "@/core/growth/funnels";
import type { GrowthFunnel } from "@/core/growth/funnel-types";
import { getDatabase } from "@/lib/mongodb";
import { openGrowthFunnelDirectory } from "@/core/growth/funnel-mongo";

export async function ensureLiveGrowthFunnels(tenantId: string): Promise<GrowthFunnel> {
  const db = await getDatabase();
  const directory = await openGrowthFunnelDirectory(db);
  return ensureGrowthFunnelsForTenant(directory, tenantId);
}

export async function liveGrowthFunnelInitialKeys(
  tenantId: string
): Promise<Record<string, string>> {
  const db = await getDatabase();
  const directory = await openGrowthFunnelDirectory(db);
  await ensureGrowthFunnelsForTenant(directory, tenantId);
  return growthFunnelInitialKeys(directory, tenantId);
}
