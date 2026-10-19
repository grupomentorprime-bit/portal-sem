/**
 * Conversion Engine fase 3 — lectura por Espacio de la analítica de conversión.
 * Solo lee. No materializa, no crea colecciones ni índices.
 */

import "server-only";

import type { Filter } from "mongodb";
import {
  GROWTH_ACTIVIDADES_COLLECTION,
  GROWTH_OPORTUNIDADES_COLLECTION,
  type GrowthActivity,
  type GrowthOportunidad,
} from "@/core/growth";
import {
  GROWTH_CAMPAIGNS_COLLECTION,
  type GrowthCampaign,
} from "@/core/growth/campaigns";
import { createMongoGrowthFunnelDirectory } from "@/core/growth/funnel-mongo";
import { stagesFromDefinition } from "@/core/growth/funnel-stages";
import { getExperienceFormById } from "@/lib/experience/forms/repository";
import { listMembershipsByTenant } from "@/lib/identity/memberships";
import { listUsersByIds } from "@/lib/identity/users";
import { getDatabase } from "@/lib/mongodb";
import {
  resolveAnalyticsPeriod,
  type ResolveAnalyticsPeriodInput,
} from "./analytics-period";
import {
  buildConversionAnalytics,
  type ConversionActivityInput,
  type ConversionAnalyticsResponse,
  type ConversionCampaignInput,
  type ConversionFunnelInput,
  type ConversionMemberInput,
  type ConversionOpportunityInput,
} from "./conversion-analytics";

export type GetConversionAnalyticsResult =
  | { ok: true; data: ConversionAnalyticsResponse }
  | { ok: false; error: string; status: 400 };

const CONVERSION_ACTIVITY_KINDS = [
  "opportunity_opened",
  "opportunity_transitioned",
  "opportunity_assigned",
] as const;

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

function toOpportunityInput(o: GrowthOportunidad): ConversionOpportunityInput {
  return {
    _id: o._id,
    tenantId: o.tenantId,
    status: o.status,
    openedAt: o.openedAt,
    closedAt: o.closedAt,
    origin: o.origin
      ? {
          kind: o.origin.kind,
          channel: o.origin.channel,
          formId: o.origin.formId,
          campaign: o.origin.campaign,
        }
      : null,
    funnelKey: o.funnelKey,
    ownerUserId: o.ownerUserId,
  };
}

function toActivityInput(a: GrowthActivity): ConversionActivityInput {
  return {
    _id: a._id,
    tenantId: a.tenantId,
    oportunidadId: a.oportunidadId,
    kind: a.kind,
    occurredAt: a.occurredAt,
    summary: a.summary,
    payload: a.payload,
  };
}

function toCampaignInput(c: GrowthCampaign): ConversionCampaignInput {
  return {
    tenantId: c.tenantId,
    _id: c._id,
    name: c.name,
    trackingKey: c.trackingKey,
  };
}

/**
 * Analítica de conversión del Espacio `tenantId`.
 * Recibe todas las oportunidades del Espacio y el historial de movimiento
 * completo: la permanencia y la atribución necesitan eventos anteriores al período.
 */
export async function getConversionAnalytics(
  tenantId: string,
  query: ResolveAnalyticsPeriodInput = {}
): Promise<GetConversionAnalyticsResult> {
  const resolved = resolveAnalyticsPeriod(query);
  if (!resolved.ok) {
    return { ok: false, error: resolved.error, status: 400 };
  }
  const { period } = resolved;
  const db = await getDatabase();

  const activityFilter: Filter<GrowthActivity> = {
    tenantId,
    kind: { $in: [...CONVERSION_ACTIVITY_KINDS] },
  };

  const directory = createMongoGrowthFunnelDirectory(db);

  const [opportunities, activities, funnelDocs, campaigns, memberships] =
    await Promise.all([
      db
        .collection<GrowthOportunidad>(GROWTH_OPORTUNIDADES_COLLECTION)
        .find({ tenantId } as Filter<GrowthOportunidad>)
        .toArray(),
      db
        .collection<GrowthActivity>(GROWTH_ACTIVIDADES_COLLECTION)
        .find(activityFilter)
        .toArray(),
      directory.listFunnels(tenantId),
      db
        .collection<GrowthCampaign>(GROWTH_CAMPAIGNS_COLLECTION)
        .find({ tenantId } as Filter<GrowthCampaign>)
        .toArray(),
      listMembershipsByTenant(tenantId),
    ]);

  const funnels: ConversionFunnelInput[] = await Promise.all(
    funnelDocs.map(async (funnel) => {
      const definition = await directory.getDefinition(
        tenantId,
        funnel.workflowDefinitionKey
      );
      return {
        tenantId,
        key: funnel.key,
        stages: stagesFromDefinition(definition).map((stage) => ({
          key: stage.key,
          label: stage.label,
        })),
      };
    })
  );

  const users = await listUsersByIds([
    ...new Set(memberships.map((membership) => membership.userId)),
  ]);
  const userById = new Map(users.map((user) => [user._id, user]));
  const members: ConversionMemberInput[] = memberships.map((membership) => {
    const user = userById.get(membership.userId);
    const label =
      user?.displayName?.trim() || user?.email?.trim() || membership.userId;
    return {
      userId: membership.userId,
      label,
      active: membership.status === "active",
    };
  });

  const formIds = opportunities
    .map((o) => o.origin?.formId)
    .filter((id): id is string => Boolean(id?.trim()));
  const formNameById = await resolveFormNames(tenantId, formIds);

  const data = buildConversionAnalytics({
    tenantId,
    period,
    readAt: new Date().toISOString(),
    opportunities: opportunities.map(toOpportunityInput),
    activities: activities.map(toActivityInput),
    funnels,
    campaigns: campaigns.map(toCampaignInput),
    members,
    formNameById,
  });

  return { ok: true, data };
}
