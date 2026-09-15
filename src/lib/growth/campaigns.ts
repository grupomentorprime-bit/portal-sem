/**
 * OT-GROWTH-CAMPAIGNS-003 — fachada server-only sobre Mongo.
 * Configuración + atribución inbound; no motor de envío masivo.
 */

import "server-only";

import {
  activateGrowthCampaign,
  createGrowthCampaign,
  createMongoGrowthCampaignStore,
  endGrowthCampaign,
  ensureGrowthCampaignIndexes,
  getGrowthCampaign,
  listGrowthCampaigns,
  resolveActiveFormCampaignTrackingKey,
  updateGrowthCampaign,
  type CampaignActor,
  type CampaignRefsPort,
} from "@/core/growth/campaigns";
import { createMongoGrowthAutomationStore } from "@/core/growth/automations";
import { getExperienceFormById } from "@/lib/experience/forms/repository";
import { getDatabase } from "@/lib/mongodb";

async function store() {
  const db = await getDatabase();
  await ensureGrowthCampaignIndexes(db);
  return createMongoGrowthCampaignStore(db);
}

export async function createCampaignRefsPort(): Promise<CampaignRefsPort> {
  const db = await getDatabase();
  const automations = createMongoGrowthAutomationStore(db);
  return {
    async formExists(tenantId, formId) {
      const form = await getExperienceFormById(tenantId, formId);
      return form != null;
    },
    async automationExists(tenantId, automationId) {
      const doc = await automations.findAutomationById(tenantId, automationId);
      return doc != null && doc.tenantId === tenantId;
    },
  };
}

export async function campaignsList(tenantId: string) {
  return listGrowthCampaigns(await store(), tenantId);
}

export async function campaignsGet(tenantId: string, campaignId: string) {
  return getGrowthCampaign(await store(), { tenantId, campaignId });
}

export async function campaignsCreate(input: {
  tenantId: string;
  name: string;
  objective: string;
  trackingKey: string;
  source: unknown;
  audience?: unknown;
  automationId?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  actor: CampaignActor;
}) {
  return createGrowthCampaign(await store(), {
    ...input,
    refs: await createCampaignRefsPort(),
  });
}

export async function campaignsUpdate(input: {
  tenantId: string;
  campaignId: string;
  name?: string;
  objective?: string;
  trackingKey?: string;
  source?: unknown;
  audience?: unknown;
  automationId?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  actor: CampaignActor;
}) {
  return updateGrowthCampaign(await store(), {
    ...input,
    refs: await createCampaignRefsPort(),
  });
}

export async function campaignsActivate(input: {
  tenantId: string;
  campaignId: string;
  actor: CampaignActor;
}) {
  return activateGrowthCampaign(await store(), {
    ...input,
    refs: await createCampaignRefsPort(),
  });
}

export async function campaignsEnd(input: {
  tenantId: string;
  campaignId: string;
  actor: CampaignActor;
}) {
  return endGrowthCampaign(await store(), input);
}

/** Bridge ingest: trackingKey de campaña active por formId del Espacio. */
export async function resolveFormCampaignTrackingKeyForIngest(
  tenantId: string,
  formId: string
): Promise<string | null> {
  try {
    return await resolveActiveFormCampaignTrackingKey(
      await store(),
      tenantId,
      formId
    );
  } catch (error) {
    console.error(
      "[Growth Campaigns] resolve active form campaign failed (ingest continues)",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}
