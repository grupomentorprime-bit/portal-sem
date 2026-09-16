/**
 * OT-GROWTH-MESSAGING-002 / OT-GROWTH-WHATSAPP-META-001 —
 * conexión WhatsApp Cloud API por Espacio.
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

/** Origen de la conexión: flujo oficial Meta vs formulario técnico temporal. */
export const GROWTH_WHATSAPP_CONNECTION_SOURCE_LEGACY = "legacy_manual" as const;
export const GROWTH_WHATSAPP_CONNECTION_SOURCE_EMBEDDED =
  "embedded_signup" as const;

export type GrowthWhatsAppConnectionSource =
  | typeof GROWTH_WHATSAPP_CONNECTION_SOURCE_LEGACY
  | typeof GROWTH_WHATSAPP_CONNECTION_SOURCE_EMBEDDED;

/** Conexión de un número/cuenta Cloud API a un Espacio. Secretos solo en servidor. */
export interface GrowthWhatsAppConnection {
  _id: string;
  tenantId: string;
  /** phone_number_id de Cloud API — clave de resolución de Espacio. */
  phoneNumberId: string;
  /** WhatsApp Business Account ID (entry.id). */
  wabaId?: string;
  /** Business Portfolio ID del cliente (Embedded Signup). */
  businessId?: string;
  /** Número visible (no es secreto). */
  displayPhoneNumber?: string;
  verifyToken: string;
  appSecret: string;
  /**
   * Token de acceso Cloud API (envío). Obligatorio para responder;
   * el webhook inbound usa secret de plataforma (ES) o appSecret por conexión (legacy).
   */
  accessToken?: string;
  /** Cómo se conectó el canal. Ausente = legacy_manual. */
  connectionSource?: GrowthWhatsAppConnectionSource;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Vista sin secretos — nunca exponer tokens al cliente. */
export interface GrowthWhatsAppConnectionPublic {
  tenantId: string;
  phoneNumberId: string;
  wabaId?: string;
  businessId?: string;
  displayPhoneNumber?: string;
  enabled: boolean;
  connectionSource: GrowthWhatsAppConnectionSource;
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
    ...(connection.businessId ? { businessId: connection.businessId } : {}),
    ...(connection.displayPhoneNumber
      ? { displayPhoneNumber: connection.displayPhoneNumber }
      : {}),
    enabled: connection.enabled,
    connectionSource:
      connection.connectionSource ?? GROWTH_WHATSAPP_CONNECTION_SOURCE_LEGACY,
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
