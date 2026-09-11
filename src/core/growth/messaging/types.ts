/**
 * OT-GROWTH-MESSAGING-001 — modelo mínimo Conversación + Mensaje.
 * Una Persona puede tener varias conversaciones (canales); sin duplicar Persona/Oportunidad.
 */

export const GROWTH_CONVERSACIONES_COLLECTION = "growth_conversaciones" as const;
export const GROWTH_MENSAJES_COLLECTION = "growth_mensajes" as const;

/** Canales previstos; conectores reales = OTs posteriores. */
export const GROWTH_CONVERSATION_CHANNELS = [
  "whatsapp",
  "instagram",
  "facebook",
  "web_chat",
  "other",
] as const;

export type GrowthConversationChannel =
  (typeof GROWTH_CONVERSATION_CHANNELS)[number];

export type GrowthConversationStatus = "open" | "closed" | "archived";

export type GrowthMessageDirection = "inbound" | "outbound";

/** Estado mínimo; conectores ampliarán outbound sin cambiar el modelo. */
export type GrowthMessageStatus =
  | "received"
  | "queued"
  | "sent"
  | "delivered"
  | "failed";

/**
 * Hilo de mensajes de una Persona en un canal (dentro de un Espacio).
 * Solo guarda ids de Persona / Oportunidad — no snapshots.
 */
export interface GrowthConversation {
  _id: string;
  tenantId: string;
  personaId: string;
  channel: GrowthConversationChannel;
  status: GrowthConversationStatus;
  /** Oportunidad comercial opcional (FK). */
  oportunidadId?: string;
  /** Id de hilo en el proveedor externo cuando exista. */
  externalThreadId?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
}

/**
 * Mensaje append-mostly. Idempotencia por (tenantId, channel, externalMessageId).
 * Outbound: idempotencia de reintento por (tenantId, clientRequestId) cuando exista.
 * `channel` se denormaliza del hilo para el índice unique (sin cruzar colecciones).
 */
export interface GrowthMessage {
  _id: string;
  tenantId: string;
  conversationId: string;
  channel: GrowthConversationChannel;
  direction: GrowthMessageDirection;
  body: string;
  status: GrowthMessageStatus;
  /** Id del mensaje en el proveedor externo cuando exista. */
  externalMessageId?: string;
  /**
   * Clave de reintento del cliente (outbound). Mismo id → no duplica envío exitoso
   * ni crea un segundo mensaje si el anterior falló (se reutiliza el registro).
   */
  clientRequestId?: string;
  /** Código de fallo (proveedor / ventana). Sin secretos. */
  failureCode?: string;
  /** Detalle mínimo del fallo para informar al operador. */
  failureDetail?: string;
  occurredAt: string;
  createdAt: string;
  /** Id en core_events si se publicó un hecho de dominio del mensaje. */
  eventId?: string;
}

export function isGrowthConversationChannel(
  value: unknown
): value is GrowthConversationChannel {
  return (
    typeof value === "string" &&
    (GROWTH_CONVERSATION_CHANNELS as readonly string[]).includes(value)
  );
}
