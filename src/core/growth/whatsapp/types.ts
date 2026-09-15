/**
 * OT-GROWTH-MESSAGING-002 — conexión WhatsApp Cloud API por Espacio.
 * Secretos fuera del documento del Espacio (growth_space_config / tenants / site_config).
 */

export const GROWTH_WHATSAPP_CONNECTIONS_COLLECTION =
  "growth_whatsapp_connections" as const;

export const GROWTH_WHATSAPP_CHANNEL = "whatsapp" as const;

export const GROWTH_WHATSAPP_SOURCE_COLLECTION = "whatsapp_cloud" as const;

/**
 * Tipo de Oportunidad comercial para inbound WhatsApp (default de plataforma).
 * Misma clave que Formulario contact / information_request — sin hardcode por cliente.
 */
export const GROWTH_WHATSAPP_OPPORTUNITY_TYPE_KEY = "inquiry" as const;

/** Conexión de un número/cuenta Cloud API a un Espacio. Secretos solo en servidor. */
export interface GrowthWhatsAppConnection {
  _id: string;
  tenantId: string;
  /** phone_number_id de Cloud API — clave de resolución de Espacio. */
  phoneNumberId: string;
  /** WhatsApp Business Account ID (entry.id). */
  wabaId?: string;
  /** Número visible (no es secreto). */
  displayPhoneNumber?: string;
  verifyToken: string;
  appSecret: string;
  /**
   * Token de acceso Cloud API (envío). Obligatorio para responder;
   * el webhook inbound solo usa appSecret / verifyToken.
   */
  accessToken?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Vista sin secretos — nunca exponer tokens al cliente. */
export interface GrowthWhatsAppConnectionPublic {
  tenantId: string;
  phoneNumberId: string;
  wabaId?: string;
  displayPhoneNumber?: string;
  enabled: boolean;
  hasVerifyToken: boolean;
  hasAppSecret: boolean;
  hasAccessToken: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toPublicWhatsAppConnection(
  connection: GrowthWhatsAppConnection
): GrowthWhatsAppConnectionPublic {
  return {
    tenantId: connection.tenantId,
    phoneNumberId: connection.phoneNumberId,
    ...(connection.wabaId ? { wabaId: connection.wabaId } : {}),
    ...(connection.displayPhoneNumber
      ? { displayPhoneNumber: connection.displayPhoneNumber }
      : {}),
    enabled: connection.enabled,
    hasVerifyToken: Boolean(connection.verifyToken?.trim()),
    hasAppSecret: Boolean(connection.appSecret?.trim()),
    hasAccessToken: Boolean(connection.accessToken?.trim()),
    createdAt: connection.createdAt,
    updatedAt: connection.updatedAt,
  };
}

/** Mensaje de usuario extraído del webhook oficial (sin statuses). */
export interface WhatsAppInboundExtracted {
  wabaId?: string;
  phoneNumberId: string;
  displayPhoneNumber?: string;
  from: string;
  profileName?: string;
  messageId: string;
  timestamp: string;
  type: string;
  body: string;
}
