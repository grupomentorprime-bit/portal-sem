/**
 * Resolución fail-safe para live ingest: campaña active por formId del Espacio.
 */

import type { GrowthCampaignStore } from "./store";

/**
 * Devuelve trackingKey si hay campaña active con source.form = formId.
 * Si no hay, null — el ingest continúa sin campaign.
 */
export async function resolveActiveFormCampaignTrackingKey(
  store: GrowthCampaignStore,
  tenantId: string,
  formId: string
): Promise<string | null> {
  if (!tenantId.trim() || !formId.trim()) return null;
  const campaign = await store.findActiveByFormId(tenantId, formId);
  if (!campaign || campaign.status !== "active") return null;
  if (campaign.source.kind !== "form") return null;
  return campaign.trackingKey;
}
