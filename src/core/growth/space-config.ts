/**
 * ADR-010 — growth_space_config: tipos de oportunidad por Espacio.
 * Si no existe documento → defaults de plataforma (inquiry / registration / conversion).
 */

import { ObjectId } from "mongodb";
import type { GrowthOpportunityStore } from "./opportunity-store";
import { GROWTH_DEFAULT_STALE_AFTER_DAYS, normalizeStaleAfterDays } from "./priority";
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
  if (existing) {
    return { ...existing, staleAfterDays: normalizeStaleAfterDays(existing.staleAfterDays) };
  }

  return {
    _id: new ObjectId().toString(),
    tenantId,
    opportunityTypes: platformDefaultOpportunityTypes(),
    staleAfterDays: GROWTH_DEFAULT_STALE_AFTER_DAYS,
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
    staleAfterDays: GROWTH_DEFAULT_STALE_AFTER_DAYS,
    createdAt: now,
    updatedAt: now,
  };
  return store.upsertSpaceConfig(created);
}

export async function setGrowthStaleAfterDays(
  store: GrowthOpportunityStore,
  tenantId: string,
  days: number,
  now = new Date().toISOString()
): Promise<{ ok: true; staleAfterDays: number } | { ok: false; reason: "invalid_days" }> {
  if (!Number.isInteger(days) || days < 1 || days > 90) {
    return { ok: false, reason: "invalid_days" };
  }
  const current = await ensureGrowthSpaceConfig(store, tenantId, now);
  const saved = await store.upsertSpaceConfig({
    ...current,
    staleAfterDays: days,
    updatedAt: now,
  });
  return { ok: true, staleAfterDays: saved.staleAfterDays ?? days };
}
