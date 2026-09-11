/**
 * OT-GROWTH-MESSAGING-004 — proyección pura Conversación / Mensaje → vista UI.
 * Sin I/O. Sin IDs técnicos ni lenguaje de proveedor en lo que se muestra.
 */

import type {
  GrowthConversationChannel,
  GrowthMessageDirection,
  GrowthMessageStatus,
} from "@/core/growth/messaging";

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

export interface GrowthMensajesThreadView {
  id: string;
  personaId: string;
  personaName: string;
  channel: GrowthConversationChannel;
  channelLabel: string;
  oportunidadId?: string;
  messages: GrowthMensajeThreadItemView[];
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
