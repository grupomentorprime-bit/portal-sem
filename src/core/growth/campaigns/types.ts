/**
 * OT-GROWTH-CAMPAIGNS-003 / CONTRACT-002 — entidad Campaña V1 (configuración).
 * No es motor de envío ni segundo CRM.
 */

import type {
  GrowthOpportunityStatus,
  GrowthOriginKind,
} from "@/core/growth/types";

export const GROWTH_CAMPAIGNS_COLLECTION = "growth_campaigns" as const;

export const GROWTH_CAMPAIGN_STATUSES = ["draft", "active", "ended"] as const;
export type GrowthCampaignStatus = (typeof GROWTH_CAMPAIGN_STATUSES)[number];

export const GROWTH_CAMPAIGN_SOURCE_KINDS = ["form", "none"] as const;
export type GrowthCampaignSourceKind =
  (typeof GROWTH_CAMPAIGN_SOURCE_KINDS)[number];

export type GrowthCampaignSource =
  | {
      kind: "form";
      formId: string;
      pageId?: string;
    }
  | {
      kind: "none";
      pageId?: string;
    };

/** Filtros de audiencia V1 (AND). Sin personaIds persistidos. */
export type GrowthCampaignAudienceFilter =
  | { field: "typeKey"; op: "eq"; value: string }
  | { field: "status"; op: "eq"; value: GrowthOpportunityStatus }
  | { field: "origin.kind"; op: "eq"; value: GrowthOriginKind }
  | { field: "origin.channel"; op: "eq"; value: string }
  | { field: "origin.formId"; op: "eq"; value: string }
  | { field: "origin.campaign"; op: "eq"; value: string };

export type GrowthCampaignAudience = {
  filters: GrowthCampaignAudienceFilter[];
};

export type GrowthCampaign = {
  _id: string;
  tenantId: string;
  name: string;
  status: GrowthCampaignStatus;
  objective: string;
  trackingKey: string;
  source: GrowthCampaignSource;
  audience?: GrowthCampaignAudience;
  automationId?: string;
  startAt?: string;
  endAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type GrowthCampaignMetrics = {
  personasCaptadas: number;
  oportunidadesGeneradas: number;
  enSeguimiento: number;
  ganadas: number;
  perdidas: number;
};
