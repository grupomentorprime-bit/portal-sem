/**
 * Lectura UI / métricas / audiencia Campañas V1.
 * Presentación humana (nombres de formulario) — sin cambiar contratos.
 */

import "server-only";

import type { Filter } from "mongodb";
import {
  GROWTH_OPORTUNIDADES_COLLECTION,
  type GrowthOportunidad,
} from "@/core/growth";
import {
  deriveCampaignMetrics,
  filterOportunidadesByAudience,
  type GrowthCampaign,
  type GrowthCampaignAudienceFilter,
  type GrowthCampaignMetrics,
} from "@/core/growth/campaigns";
import { getExperienceFormById } from "@/lib/experience/forms/repository";
import { getDatabase } from "@/lib/mongodb";
import { campaignsGet, campaignsList } from "./campaigns";
import {
  campaignAudienceSummary,
  campaignSourceDetailCopy,
  campaignSourceLabel,
  campaignStatusLabel,
} from "./campaigns-labels";

export type CampaignListItemView = {
  id: string;
  name: string;
  status: GrowthCampaign["status"];
  statusLabel: string;
  objective: string;
  sourceLabel: string;
  startAt?: string;
  href: string;
  metrics: GrowthCampaignMetrics;
};

export type CampaignListSummary = {
  activeCount: number;
  personasCaptadas: number;
  oportunidades: number;
  ganadas: number;
};

export type CampaignDetailView = {
  campaign: GrowthCampaign;
  statusLabel: string;
  sourceLabel: string;
  sourceDetail: string;
  metrics: GrowthCampaignMetrics;
  audiencePersonaIds: string[];
  audienceIntro: string | null;
  audienceLabels: string[];
  actividadHref: string;
};

async function listOportunidadesByCampaign(
  tenantId: string,
  trackingKey: string
): Promise<GrowthOportunidad[]> {
  const db = await getDatabase();
  return db
    .collection<GrowthOportunidad>(GROWTH_OPORTUNIDADES_COLLECTION)
    .find({
      tenantId,
      "origin.campaign": trackingKey,
    } as Filter<GrowthOportunidad>)
    .toArray();
}

export async function getCampaignMetrics(
  tenantId: string,
  trackingKey: string
): Promise<GrowthCampaignMetrics> {
  const ops = await listOportunidadesByCampaign(tenantId, trackingKey);
  return deriveCampaignMetrics(ops);
}

export async function evaluateCampaignAudience(
  tenantId: string,
  filters: GrowthCampaignAudienceFilter[]
): Promise<GrowthOportunidad[]> {
  const db = await getDatabase();
  const all = await db
    .collection<GrowthOportunidad>(GROWTH_OPORTUNIDADES_COLLECTION)
    .find({ tenantId } as Filter<GrowthOportunidad>)
    .toArray();
  return filterOportunidadesByAudience(all, filters);
}

async function resolveFormName(
  tenantId: string,
  formId: string
): Promise<string | null> {
  try {
    const form = await getExperienceFormById(tenantId, formId);
    return form?.name?.trim() || null;
  } catch {
    return null;
  }
}

export async function listCampaignViews(
  tenantId: string
): Promise<CampaignListItemView[]> {
  const items = await campaignsList(tenantId);
  const views: CampaignListItemView[] = [];
  for (const c of items) {
    const metrics = await getCampaignMetrics(tenantId, c.trackingKey);
    const formName =
      c.source.kind === "form"
        ? await resolveFormName(tenantId, c.source.formId)
        : null;
    views.push({
      id: c._id,
      name: c.name,
      status: c.status,
      statusLabel: campaignStatusLabel(c.status),
      objective: c.objective,
      sourceLabel: campaignSourceLabel(c.source, formName),
      ...(c.startAt ? { startAt: c.startAt } : {}),
      href: `/admin/campanas/${c._id}`,
      metrics,
    });
  }
  return views;
}

export function summarizeCampaignList(
  items: CampaignListItemView[]
): CampaignListSummary {
  return {
    activeCount: items.filter((i) => i.status === "active").length,
    personasCaptadas: items.reduce(
      (sum, i) => sum + i.metrics.personasCaptadas,
      0
    ),
    oportunidades: items.reduce(
      (sum, i) => sum + i.metrics.oportunidadesGeneradas,
      0
    ),
    ganadas: items.reduce((sum, i) => sum + i.metrics.ganadas, 0),
  };
}

export async function getCampaignDetailView(
  tenantId: string,
  campaignId: string
): Promise<CampaignDetailView | null> {
  const campaign = await campaignsGet(tenantId, campaignId);
  if (!campaign) return null;
  const metrics = await getCampaignMetrics(tenantId, campaign.trackingKey);
  const audienceFilters = campaign.audience?.filters ?? [];
  const audienceOps =
    audienceFilters.length > 0
      ? await evaluateCampaignAudience(tenantId, audienceFilters)
      : await listOportunidadesByCampaign(tenantId, campaign.trackingKey);
  const audiencePersonaIds = [
    ...new Set(audienceOps.map((o) => o.personaId)),
  ];

  const formName =
    campaign.source.kind === "form"
      ? await resolveFormName(tenantId, campaign.source.formId)
      : null;

  const formNameById: Record<string, string> = {};
  if (formName && campaign.source.kind === "form") {
    formNameById[campaign.source.formId] = formName;
  }
  for (const filter of audienceFilters) {
    if (filter.field === "origin.formId" && !formNameById[filter.value]) {
      const name = await resolveFormName(tenantId, filter.value);
      if (name) formNameById[filter.value] = name;
    }
  }

  const campaignNameByTrackingKey: Record<string, string> = {
    [campaign.trackingKey]: campaign.name,
  };
  const allCampaigns = await campaignsList(tenantId);
  for (const c of allCampaigns) {
    campaignNameByTrackingKey[c.trackingKey] = c.name;
  }

  const audience = campaignAudienceSummary(audienceFilters, {
    formNameById,
    campaignNameByTrackingKey,
  });

  return {
    campaign,
    statusLabel: campaignStatusLabel(campaign.status),
    sourceLabel: campaignSourceLabel(campaign.source, formName),
    sourceDetail: campaignSourceDetailCopy(campaign.source, formName),
    metrics,
    audiencePersonaIds,
    audienceIntro: audience.intro,
    audienceLabels: audience.labels,
    actividadHref: "/admin/actividad",
  };
}
