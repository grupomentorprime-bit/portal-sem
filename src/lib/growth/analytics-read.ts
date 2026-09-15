/**
 * OT-GROWTH-ANALYTICS-IMPLEMENT-003 — read model Mongo tenant-scoped.
 * READ-ONLY sobre SSOT Growth. No escribe. No toca deriveCampaignMetrics.
 */

import "server-only";

import type { Filter } from "mongodb";
import {
  GROWTH_OPORTUNIDADES_COLLECTION,
  GROWTH_PERSONAS_COLLECTION,
  type GrowthOportunidad,
  type GrowthPersona,
} from "@/core/growth";
import {
  GROWTH_CAMPAIGNS_COLLECTION,
  type GrowthCampaign,
} from "@/core/growth/campaigns";
import {
  GROWTH_CONVERSACIONES_COLLECTION,
  GROWTH_MENSAJES_COLLECTION,
  type GrowthConversation,
  type GrowthMessage,
} from "@/core/growth/messaging";
import { getExperienceFormById } from "@/lib/experience/forms/repository";
import { getDatabase } from "@/lib/mongodb";
import {
  buildAnalyticsV1Response,
  type AnalyticsV1Response,
} from "./analytics-aggregate";
import {
  resolveAnalyticsPeriod,
  type ResolveAnalyticsPeriodInput,
} from "./analytics-period";

export type { AnalyticsV1Response } from "./analytics-aggregate";
export {
  formatConversionPercent,
  computeConversionRate,
  acquisitionOriginGroupLabel,
  buildAnalyticsV1Response,
  emptyAnalyticsV1Response,
} from "./analytics-aggregate";
export {
  resolveAnalyticsPeriod,
  isTimestampInPeriod,
  ANALYTICS_PERIOD_PRESETS,
  type AnalyticsPeriod,
  type AnalyticsPeriodPreset,
  type ResolveAnalyticsPeriodInput,
  type ResolveAnalyticsPeriodResult,
} from "./analytics-period";

export type GetAnalyticsV1Result =
  | { ok: true; data: AnalyticsV1Response }
  | { ok: false; error: string; status: 400 };

async function resolveFormNames(
  tenantId: string,
  formIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(formIds.map((id) => id.trim()).filter(Boolean))];
  await Promise.all(
    unique.map(async (formId) => {
      try {
        const form = await getExperienceFormById(tenantId, formId);
        const name = form?.name?.trim();
        if (name) map.set(formId, name);
      } catch {
        /* formulario irresoluble → label genérico */
      }
    })
  );
  return map;
}

/**
 * Agregado Analítica V1 para el Espacio `tenantId`.
 * No acepta tenant ajeno: el caller debe pasar el Espacio activo.
 */
export async function getAnalyticsV1(
  tenantId: string,
  periodInput: ResolveAnalyticsPeriodInput = {}
): Promise<GetAnalyticsV1Result> {
  const resolved = resolveAnalyticsPeriod(periodInput);
  if (!resolved.ok) {
    return { ok: false, error: resolved.error, status: 400 };
  }

  const { period } = resolved;
  const { start, end } = period;
  const db = await getDatabase();

  const personaFilter: Filter<GrowthPersona> = {
    tenantId,
    status: { $nin: ["merged", "archived"] },
    createdAt: { $gte: start, $lt: end },
  };

  const oportunidadFilter: Filter<GrowthOportunidad> = { tenantId };

  const messagePeriodFilter: Filter<GrowthMessage> = {
    tenantId,
    occurredAt: { $gte: start, $lt: end },
  };

  const [
    personas,
    oportunidades,
    campaigns,
    conversations,
    messagesPeriod,
    allMessages,
  ] = await Promise.all([
    db
      .collection<GrowthPersona>(GROWTH_PERSONAS_COLLECTION)
      .find(personaFilter)
      .toArray(),
    db
      .collection<GrowthOportunidad>(GROWTH_OPORTUNIDADES_COLLECTION)
      .find(oportunidadFilter)
      .toArray(),
    db
      .collection<GrowthCampaign>(GROWTH_CAMPAIGNS_COLLECTION)
      .find({ tenantId } as Filter<GrowthCampaign>)
      .toArray(),
    db
      .collection<GrowthConversation>(GROWTH_CONVERSACIONES_COLLECTION)
      .find({ tenantId } as Filter<GrowthConversation>)
      .toArray(),
    db
      .collection<GrowthMessage>(GROWTH_MENSAJES_COLLECTION)
      .find(messagePeriodFilter)
      .toArray(),
    db
      .collection<GrowthMessage>(GROWTH_MENSAJES_COLLECTION)
      .find({ tenantId } as Filter<GrowthMessage>)
      .project({
        _id: 1,
        tenantId: 1,
        conversationId: 1,
        direction: 1,
        occurredAt: 1,
        channel: 1,
      })
      .toArray(),
  ]);

  const formIds = personas
    .map((p) => p.origin?.formId)
    .filter((id): id is string => Boolean(id?.trim()));
  for (const o of oportunidades) {
    if (o.origin?.formId?.trim()) formIds.push(o.origin.formId);
  }
  const formNameById = await resolveFormNames(tenantId, formIds);

  const data = buildAnalyticsV1Response({
    tenantId,
    period,
    personas,
    oportunidades,
    campaigns,
    conversations,
    messages: messagesPeriod,
    allTenantMessages: allMessages as GrowthMessage[],
    formNameById,
  });

  return { ok: true, data };
}
