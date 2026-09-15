/**
 * OT-GROWTH-CAMPAIGNS-003 — Campañas V1 (configuración + atribución inbound).
 */

export {
  GROWTH_CAMPAIGNS_COLLECTION,
  GROWTH_CAMPAIGN_STATUSES,
  GROWTH_CAMPAIGN_SOURCE_KINDS,
} from "./types";
export type {
  GrowthCampaign,
  GrowthCampaignAudience,
  GrowthCampaignAudienceFilter,
  GrowthCampaignMetrics,
  GrowthCampaignSource,
  GrowthCampaignSourceKind,
  GrowthCampaignStatus,
} from "./types";

export type { GrowthCampaignStore } from "./store";
export { createMemoryGrowthCampaignStore } from "./memory-store";
export { createMongoGrowthCampaignStore } from "./repository";
export { ensureGrowthCampaignIndexes } from "./indexes";

export {
  createGrowthCampaign,
  updateGrowthCampaign,
  activateGrowthCampaign,
  endGrowthCampaign,
  getGrowthCampaign,
  listGrowthCampaigns,
  isGrowthCampaignStatus,
} from "./service";
export type {
  CampaignActor,
  CampaignRefsPort,
  CampaignServiceError,
} from "./service";

export {
  evaluateCampaignAudienceFilter,
  evaluateCampaignAudienceFilters,
  filterOportunidadesByAudience,
} from "./audience";
export {
  deriveCampaignMetrics,
  filterOportunidadesByCampaign,
} from "./metrics";
export { resolveActiveFormCampaignTrackingKey } from "./resolve-active";
