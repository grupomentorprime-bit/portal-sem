/**
 * Puerto de persistencia Campañas (inyectable para tests).
 */

import type { GrowthCampaign } from "./types";

export interface GrowthCampaignStore {
  insert(doc: GrowthCampaign): Promise<GrowthCampaign>;
  replace(doc: GrowthCampaign): Promise<GrowthCampaign>;
  findById(tenantId: string, campaignId: string): Promise<GrowthCampaign | null>;
  findByTrackingKey(
    tenantId: string,
    trackingKey: string
  ): Promise<GrowthCampaign | null>;
  /**
   * Campaña active del Espacio con source.kind=form y formId dado.
   * Atribución ingest: nunca global por trackingKey.
   */
  findActiveByFormId(
    tenantId: string,
    formId: string
  ): Promise<GrowthCampaign | null>;
  list(tenantId: string): Promise<GrowthCampaign[]>;
}
