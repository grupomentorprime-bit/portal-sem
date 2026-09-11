/**
 * ADR-010 — growth_space_config: tipos de oportunidad por Espacio.
 * Si no existe documento → defaults de plataforma (inquiry / registration / conversion).
 */

import { ObjectId } from "mongodb";
import type { GrowthOpportunityStore } from "./opportunity-store";
import {
  GROWTH_DEFAULT_OPPORTUNITY_TYPES,
  type GrowthSpaceConfig,
} from "./types";

export function platformDefaultOpportunityTypes() {
  return GROWTH_DEFAULT_OPPORTUNITY_TYPES.map((t) => ({ ...t }));
}

export async function resolveGrowthSpaceConfig(
  store: GrowthOpportunityStore,
  tenantId: string,
  now = new Date().toISOString()
): Promise<GrowthSpaceConfig> {
  const existing = await store.getSpaceConfig(tenantId);
  if (existing) return existing;

  return {
    _id: new ObjectId().toString(),
    tenantId,
    opportunityTypes: platformDefaultOpportunityTypes(),
    createdAt: now,
    updatedAt: now,
  };
}

export function isAllowedOpportunityTypeKey(
  config: GrowthSpaceConfig,
  typeKey: string
): boolean {
  return config.opportunityTypes.some((t) => t.key === typeKey);
}

/** Persiste defaults de plataforma si el Espacio aún no tiene config. */
export async function ensureGrowthSpaceConfig(
  store: GrowthOpportunityStore,
  tenantId: string,
  now = new Date().toISOString()
): Promise<GrowthSpaceConfig> {
  const existing = await store.getSpaceConfig(tenantId);
  if (existing) return existing;
  const created: GrowthSpaceConfig = {
    _id: new ObjectId().toString(),
    tenantId,
    opportunityTypes: platformDefaultOpportunityTypes(),
    createdAt: now,
    updatedAt: now,
  };
  return store.upsertSpaceConfig(created);
}
