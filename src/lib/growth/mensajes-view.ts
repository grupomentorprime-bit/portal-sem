/**
 * OT-GROWTH-MESSAGING-004 / E2E-FIX-003 — proyección pura Conversación / Mensaje → vista UI.
 * Sin I/O. Sin IDs técnicos ni lenguaje de proveedor en lo que se muestra.
 */

import type {
  GrowthConversationChannel,
  GrowthMessageDirection,
  GrowthMessageStatus,
} from "@/core/growth/messaging";
import type { GrowthOportunidad } from "@/core/growth/types";
import {
  GROWTH_NO_NEXT_ACTION_LABEL,
  growthOpportunityStatusLabel,
  growthOpportunityTypeLabel,
} from "./labels";

const CHANNEL_LABELS: Record<GrowthConversationChannel, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  web_chat: "Chat web",
  other: "Otro canal",
};

export interface GrowthMensajesListItemView {
  id: string;
  personaId: string;
  personaName: string;
  /** Clave de canal del modelo; la UI muestra icono + etiqueta humana. */
  channel: GrowthConversationChannel;
  channelLabel: string;
  lastMessagePreview: string;
  timeLabel: string;
  /** Solo si el modelo lo soporta; V1 no inventa no leídos. */
  unread?: boolean;
}

export interface GrowthMensajeThreadItemView {
  id: string;
  direction: GrowthMessageDirection;
  body: string;
  timeLabel: string;
  /** Fallo de envío humano; sin códigos de proveedor. */
  sendFailed?: boolean;
}

/** Contexto comercial mínimo (SSOT Oportunidad); sin controles de Ventas. */
export interface GrowthMensajesThreadOpportunityView {
  typeLabel: string;
  statusLabel: string;
  /** Clave de estado solo para tono visual; la UI muestra statusLabel. */
  status: string;
  /** Summary humano o «No hay nada pendiente por ahora.» */
  nextActionLabel: string;
}

export interface GrowthMensajesThreadView {
  id: string;
  personaId: string;
  personaName: string;
  channel: GrowthConversationChannel;
  channelLabel: string;
  oportunidadId?: string;
  /** Presente solo si el vínculo resolvió una Oportunidad del Espacio. */
  opportunity?: GrowthMensajesThreadOpportunityView;
  messages: GrowthMensajeThreadItemView[];
}

/**
 * Proyecta la Oportunidad vinculada a etiquetas humanas (mismas que Ventas).
 */
export function toMensajesThreadOpportunityView(
  oportunidad: Pick<GrowthOportunidad, "typeKey" | "status" | "nextAction" | "subjectLabel">
): GrowthMensajesThreadOpportunityView {
  const typeLabel = growthOpportunityTypeLabel(oportunidad.typeKey);
  const subject = oportunidad.subjectLabel?.trim();
  return {
    typeLabel: subject ? `${typeLabel} · ${subject}` : typeLabel,
    statusLabel: growthOpportunityStatusLabel(oportunidad.status),
    status: oportunidad.status,
    nextActionLabel:
      oportunidad.nextAction?.summary?.trim() || GROWTH_NO_NEXT_ACTION_LABEL,
  };
}

export function growthConversationChannelLabel(
  channel: GrowthConversationChannel | string
): string {
  return (
    CHANNEL_LABELS[channel as GrowthConversationChannel] ?? "Otro canal"
  );
}

/** «Hoy, 10:32» o «6 sep, 16:20» — mismo criterio que historial de automatizaciones. */
export function formatMensajeWhen(
  iso: string,
  now: Date = new Date()
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const time = d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return `Hoy, ${time}`;
  const dayMonth = d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
  return `${dayMonth}, ${time}`;
}

export function truncateMessagePreview(body: string, max = 80): string {
  const text = body.replace(/\s+/g, " ").trim();
  if (!text) return "Sin mensajes";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function isOutboundSendFailed(status: GrowthMessageStatus): boolean {
  return status === "failed";
}
