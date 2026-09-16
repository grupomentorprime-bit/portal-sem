/**
 * OT-GROWTH-MESSAGING-005 / OT-GROWTH-WHATSAPP-META-001 —
 * estado humano del canal WhatsApp (sin IDs/secretos).
 */

import {
  GROWTH_WHATSAPP_CONNECTION_SOURCE_EMBEDDED,
  type GrowthWhatsAppConnectionPublic,
} from "./types";

export type WhatsAppChannelStatus =
  | "not_connected"
  | "incomplete"
  | "paused"
  | "connected";

export const WHATSAPP_CHANNEL_STATUS_LABEL: Record<
  WhatsAppChannelStatus,
  string
> = {
  not_connected: "No conectado",
  incomplete: "Incompleto",
  paused: "Pausado",
  connected: "Conectado",
};

/** Vista segura para Ajustes → Canales (nunca tokens ni IDs técnicos). */
export interface WhatsAppChannelAdminView {
  status: WhatsAppChannelStatus;
  statusLabel: string;
  displayPhoneNumber: string | null;
  receivesMessages: boolean;
  canReplyFromMensajes: boolean;
  updatedAt: string | null;
  /** Hay conexión persistida (para Administrar / Pausar). */
  configured: boolean;
  /** Conectado vía Embedded Signup (flujo guiado). */
  viaEmbeddedSignup: boolean;
}

function isEmbeddedSignup(
  connection: GrowthWhatsAppConnectionPublic
): boolean {
  return connection.connectionSource === GROWTH_WHATSAPP_CONNECTION_SOURCE_EMBEDDED;
}

function hasReceiveBasics(
  connection: GrowthWhatsAppConnectionPublic
): boolean {
  if (!connection.phoneNumberId?.trim()) return false;
  // Embedded Signup: firma/verify viven en la Meta App de plataforma.
  if (isEmbeddedSignup(connection)) return true;
  return connection.hasVerifyToken && connection.hasAppSecret;
}

function isFullyConfigured(
  connection: GrowthWhatsAppConnectionPublic
): boolean {
  return hasReceiveBasics(connection) && connection.hasAccessToken;
}

export function deriveWhatsAppChannelStatus(
  connection: GrowthWhatsAppConnectionPublic | null
): WhatsAppChannelStatus {
  if (!connection) return "not_connected";
  if (!isFullyConfigured(connection)) return "incomplete";
  if (!connection.enabled) return "paused";
  return "connected";
}

export function toWhatsAppChannelAdminView(
  connection: GrowthWhatsAppConnectionPublic | null
): WhatsAppChannelAdminView {
  const status = deriveWhatsAppChannelStatus(connection);
  const enabled = Boolean(connection?.enabled);
  const receiveOk = connection ? hasReceiveBasics(connection) : false;
  const replyOk = receiveOk && Boolean(connection?.hasAccessToken);

  return {
    status,
    statusLabel: WHATSAPP_CHANNEL_STATUS_LABEL[status],
    displayPhoneNumber: connection?.displayPhoneNumber?.trim() || null,
    receivesMessages: enabled && receiveOk,
    canReplyFromMensajes: enabled && replyOk,
    updatedAt: connection?.updatedAt ?? null,
    configured: Boolean(connection),
    viaEmbeddedSignup: connection ? isEmbeddedSignup(connection) : false,
  };
}
