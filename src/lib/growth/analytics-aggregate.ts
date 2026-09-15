/**
 * OT-GROWTH-ANALYTICS-IMPLEMENT-003 — agregación pura Analítica V1.
 * Sin I/O. Contrato congelado CONTRACT-002 §15.
 */

import type { GrowthOrigin } from "@/core/growth/types";
import type { GrowthConversationChannel } from "@/core/growth/messaging";
import {
  growthOpportunityStatusLabel,
  growthOpportunityTypeLabel,
} from "./labels";
import { growthConversationChannelLabel } from "./mensajes-view";
import { isTimestampInPeriod, type AnalyticsPeriod } from "./analytics-period";

export type AnalyticsCountRow = { label: string; count: number };

export type AnalyticsV1Response = {
  period: AnalyticsPeriod;
  summary: {
    personasNuevas: number;
    oportunidadesGeneradas: number;
    enSeguimiento: number;
    ganadas: number;
    perdidas: number;
  };
  acquisition: {
    total: number;
    byOrigin: AnalyticsCountRow[];
  };
  sales: {
    generadas: number;
    byStatus: AnalyticsCountRow[];
    conversion: {
      rate: number | null;
      won: number;
      cohort: number;
      handedOff: number;
    };
    closures: {
      ganadas: number;
      perdidas: number;
      traspasadas: number;
    };
    losses: {
      byType: AnalyticsCountRow[];
      byOrigin: AnalyticsCountRow[];
      byCampaign: AnalyticsCountRow[];
    };
  };
  campaigns: Array<{
    id: string;
    name: string;
    personasCaptadas: number;
    oportunidades: number;
    enSeguimiento: number;
    ganadas: number;
    perdidas: number;
    conversionRate: number | null;
  }>;
  messages: {
    conversaciones: number;
    recibidos: number;
    enviados: number;
    personasQueEscribieron: number;
    byChannel: AnalyticsCountRow[];
    conversacionesSinRespuesta: number;
  };
};

export type AnalyticsPersonaInput = {
  _id: string;
  tenantId: string;
  status: string;
  createdAt: string;
  origin: GrowthOrigin;
};

export type AnalyticsOportunidadInput = {
  _id: string;
  tenantId: string;
  personaId: string;
  status: string;
  typeKey: string;
  openedAt: string;
  closedAt?: string;
  origin: GrowthOrigin;
};

export type AnalyticsCampaignInput = {
  _id: string;
  tenantId: string;
  name: string;
  trackingKey: string;
};

export type AnalyticsConversationInput = {
  _id: string;
  tenantId: string;
  personaId: string;
  channel: GrowthConversationChannel | string;
  createdAt: string;
};

export type AnalyticsMessageInput = {
  _id: string;
  tenantId: string;
  conversationId: string;
  direction: "inbound" | "outbound" | string;
  occurredAt: string;
  channel?: GrowthConversationChannel | string;
};

const COHORT_STATUS_ORDER = [
  "open",
  "active",
  "won",
  "lost",
  "handed_off",
] as const;

function bump(map: Map<string, number>, key: string, n = 1): void {
  map.set(key, (map.get(key) ?? 0) + n);
}

function sortedCountRows(map: Map<string, number>): AnalyticsCountRow[] {
  return [...map.entries()]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
    .map(([label, count]) => ({ label, count }));
}

/**
 * Agrupación humana de captación (CONTRACT-002 §5.2).
 * formNameById: resolución opcional de nombre de formulario.
 */
export function acquisitionOriginGroupLabel(
  origin: Pick<GrowthOrigin, "kind" | "channel" | "formId"> | null | undefined,
  formNameById?: Map<string, string>
): string {
  if (!origin) return "Sin origen claro";

  const channel = origin.channel?.trim().toLowerCase() ?? "";
  if (channel === "whatsapp") return "WhatsApp";

  if (origin.kind === "form") {
    const formId = origin.formId?.trim();
    if (formId && formNameById?.has(formId)) {
      const name = formNameById.get(formId)!.trim();
      if (name) return name;
    }
    return "Formulario";
  }

  if (origin.kind === "admission") return "Admisión";
  if (origin.kind === "manual") return "Registro manual";
  if (origin.kind === "event") return "Evento";

  if (
    channel === "portal-admision" ||
    channel === "portal" ||
    channel.includes("portal")
  ) {
    return "Sitio web / Portal";
  }

  return "Sin origen claro";
}

export function computeConversionRate(
  won: number,
  cohort: number
): number | null {
  if (cohort === 0) return null;
  return won / cohort;
}

/** % entero half-up para UI; null → "—". */
export function formatConversionPercent(rate: number | null): string {
  if (rate == null || !Number.isFinite(rate)) return "—";
  return `${Math.round(rate * 100)}%`;
}

export function countUnansweredConversations(
  messages: AnalyticsMessageInput[],
  tenantId: string
): number {
  const lastByConversation = new Map<
    string,
    { occurredAt: string; direction: string }
  >();

  for (const m of messages) {
    if (m.tenantId !== tenantId) continue;
    const prev = lastByConversation.get(m.conversationId);
    if (!prev || m.occurredAt > prev.occurredAt) {
      lastByConversation.set(m.conversationId, {
        occurredAt: m.occurredAt,
        direction: m.direction,
      });
    }
  }

  let count = 0;
  for (const last of lastByConversation.values()) {
    if (last.direction === "inbound") count += 1;
  }
  return count;
}

export function buildAnalyticsV1Response(input: {
  tenantId: string;
  period: AnalyticsPeriod;
  personas: AnalyticsPersonaInput[];
  oportunidades: AnalyticsOportunidadInput[];
  campaigns: AnalyticsCampaignInput[];
  conversations: AnalyticsConversationInput[];
  messages: AnalyticsMessageInput[];
  /** Todos los mensajes del tenant (snapshot sin respuesta). */
  allTenantMessages: AnalyticsMessageInput[];
  formNameById?: Map<string, string>;
}): AnalyticsV1Response {
  const {
    tenantId,
    period,
    personas,
    oportunidades,
    campaigns,
    conversations,
    messages,
    allTenantMessages,
    formNameById,
  } = input;
  const { start, end } = period;

  const personasPeriod = personas.filter(
    (p) =>
      p.tenantId === tenantId &&
      p.status !== "merged" &&
      p.status !== "archived" &&
      isTimestampInPeriod(p.createdAt, start, end)
  );

  const acquisitionByOrigin = new Map<string, number>();
  for (const p of personasPeriod) {
    bump(
      acquisitionByOrigin,
      acquisitionOriginGroupLabel(p.origin, formNameById)
    );
  }

  const cohort = oportunidades.filter(
    (o) =>
      o.tenantId === tenantId &&
      o.status !== "archived" &&
      isTimestampInPeriod(o.openedAt, start, end)
  );

  const enSeguimientoSnapshot = oportunidades.filter(
    (o) => o.tenantId === tenantId && o.status === "active"
  ).length;

  const closuresWon = oportunidades.filter(
    (o) =>
      o.tenantId === tenantId &&
      o.status === "won" &&
      isTimestampInPeriod(o.closedAt, start, end)
  ).length;
  const closuresLost = oportunidades.filter(
    (o) =>
      o.tenantId === tenantId &&
      o.status === "lost" &&
      isTimestampInPeriod(o.closedAt, start, end)
  ).length;
  const closuresHandedOff = oportunidades.filter(
    (o) =>
      o.tenantId === tenantId &&
      o.status === "handed_off" &&
      isTimestampInPeriod(o.closedAt, start, end)
  ).length;

  const byStatusMap = new Map<string, number>();
  for (const status of COHORT_STATUS_ORDER) {
    byStatusMap.set(growthOpportunityStatusLabel(status), 0);
  }
  let conversionWon = 0;
  let conversionHandedOff = 0;
  for (const o of cohort) {
    const label = growthOpportunityStatusLabel(o.status);
    bump(byStatusMap, label);
    if (o.status === "won") conversionWon += 1;
    if (o.status === "handed_off") conversionHandedOff += 1;
  }

  const lostInPeriod = oportunidades.filter(
    (o) =>
      o.tenantId === tenantId &&
      o.status === "lost" &&
      isTimestampInPeriod(o.closedAt, start, end)
  );

  const campaignByTracking = new Map(
    campaigns
      .filter((c) => c.tenantId === tenantId)
      .map((c) => [c.trackingKey, c] as const)
  );

  const lossesByType = new Map<string, number>();
  const lossesByOrigin = new Map<string, number>();
  const lossesByCampaign = new Map<string, number>();
  for (const o of lostInPeriod) {
    bump(lossesByType, growthOpportunityTypeLabel(o.typeKey));
    bump(
      lossesByOrigin,
      acquisitionOriginGroupLabel(o.origin, formNameById)
    );
    const tracking = o.origin.campaign?.trim();
    if (!tracking) {
      bump(lossesByCampaign, "Sin campaña");
    } else {
      const campaign = campaignByTracking.get(tracking);
      bump(lossesByCampaign, campaign?.name?.trim() || "Sin campaña");
    }
  }

  const campaignMetrics = new Map<
    string,
    {
      id: string;
      name: string;
      personaIds: Set<string>;
      oportunidades: number;
      enSeguimiento: number;
      ganadas: number;
      perdidas: number;
    }
  >();

  for (const o of cohort) {
    const tracking = o.origin.campaign?.trim();
    if (!tracking) continue;
    const campaign = campaignByTracking.get(tracking);
    if (!campaign) continue;
    let row = campaignMetrics.get(tracking);
    if (!row) {
      row = {
        id: campaign._id,
        name: campaign.name,
        personaIds: new Set(),
        oportunidades: 0,
        enSeguimiento: 0,
        ganadas: 0,
        perdidas: 0,
      };
      campaignMetrics.set(tracking, row);
    }
    row.personaIds.add(o.personaId);
    row.oportunidades += 1;
    if (o.status === "active") row.enSeguimiento += 1;
    if (o.status === "won") row.ganadas += 1;
    if (o.status === "lost") row.perdidas += 1;
  }

  const campaignRows = [...campaignMetrics.values()]
    .map((row) => ({
      id: row.id,
      name: row.name,
      personasCaptadas: row.personaIds.size,
      oportunidades: row.oportunidades,
      enSeguimiento: row.enSeguimiento,
      ganadas: row.ganadas,
      perdidas: row.perdidas,
      conversionRate: computeConversionRate(row.ganadas, row.oportunidades),
    }))
    .sort(
      (a, b) =>
        b.oportunidades - a.oportunidades ||
        a.name.localeCompare(b.name, "es")
    );

  const conversationsPeriod = conversations.filter(
    (c) =>
      c.tenantId === tenantId &&
      isTimestampInPeriod(c.createdAt, start, end)
  );

  const messagesPeriod = messages.filter(
    (m) =>
      m.tenantId === tenantId &&
      isTimestampInPeriod(m.occurredAt, start, end)
  );

  const recibidos = messagesPeriod.filter((m) => m.direction === "inbound")
    .length;
  const enviados = messagesPeriod.filter((m) => m.direction === "outbound")
    .length;

  const conversationById = new Map(
    conversations
      .filter((c) => c.tenantId === tenantId)
      .map((c) => [c._id, c] as const)
  );

  const personasQueEscribieron = new Set<string>();
  for (const m of messagesPeriod) {
    if (m.direction !== "inbound") continue;
    const conv = conversationById.get(m.conversationId);
    if (conv && conv.tenantId === tenantId) {
      personasQueEscribieron.add(conv.personaId);
    }
  }

  const byChannel = new Map<string, number>();
  for (const c of conversationsPeriod) {
    bump(byChannel, growthConversationChannelLabel(c.channel));
  }

  const byStatusRows =
    cohort.length === 0
      ? []
      : COHORT_STATUS_ORDER.map((status) => ({
          statusLabel: growthOpportunityStatusLabel(status),
          count: byStatusMap.get(growthOpportunityStatusLabel(status)) ?? 0,
        }))
          .filter((r) => r.count > 0)
          .map((r) => ({ label: r.statusLabel, count: r.count }));

  return {
    period,
    summary: {
      personasNuevas: personasPeriod.length,
      oportunidadesGeneradas: cohort.length,
      enSeguimiento: enSeguimientoSnapshot,
      ganadas: closuresWon,
      perdidas: closuresLost,
    },
    acquisition: {
      total: personasPeriod.length,
      byOrigin: sortedCountRows(acquisitionByOrigin),
    },
    sales: {
      generadas: cohort.length,
      byStatus: byStatusRows,
      conversion: {
        rate: computeConversionRate(conversionWon, cohort.length),
        won: conversionWon,
        cohort: cohort.length,
        handedOff: conversionHandedOff,
      },
      closures: {
        ganadas: closuresWon,
        perdidas: closuresLost,
        traspasadas: closuresHandedOff,
      },
      losses: {
        byType: sortedCountRows(lossesByType),
        byOrigin: sortedCountRows(lossesByOrigin),
        byCampaign: sortedCountRows(lossesByCampaign),
      },
    },
    campaigns: campaignRows,
    messages: {
      conversaciones: conversationsPeriod.length,
      recibidos,
      enviados,
      personasQueEscribieron: personasQueEscribieron.size,
      byChannel: sortedCountRows(byChannel),
      conversacionesSinRespuesta: countUnansweredConversations(
        allTenantMessages,
        tenantId
      ),
    },
  };
}

/** Respuesta vacía válida (espacio sin datos). */
export function emptyAnalyticsV1Response(
  period: AnalyticsPeriod
): AnalyticsV1Response {
  return {
    period,
    summary: {
      personasNuevas: 0,
      oportunidadesGeneradas: 0,
      enSeguimiento: 0,
      ganadas: 0,
      perdidas: 0,
    },
    acquisition: { total: 0, byOrigin: [] },
    sales: {
      generadas: 0,
      byStatus: [],
      conversion: { rate: null, won: 0, cohort: 0, handedOff: 0 },
      closures: { ganadas: 0, perdidas: 0, traspasadas: 0 },
      losses: { byType: [], byOrigin: [], byCampaign: [] },
    },
    campaigns: [],
    messages: {
      conversaciones: 0,
      recibidos: 0,
      enviados: 0,
      personasQueEscribieron: 0,
      byChannel: [],
      conversacionesSinRespuesta: 0,
    },
  };
}
