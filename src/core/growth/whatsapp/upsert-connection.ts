/**
 * OT-GROWTH-MESSAGING-002 / OT-GROWTH-WHATSAPP-META-001 —
 * persistir conexión (secretos fuera del documento del Espacio).
 * Un phone_number_id solo puede pertenecer a un Espacio.
 */

import { ObjectId } from "mongodb";
import type { GrowthWhatsAppConnectionStore } from "./connection-store";
import { getMetaAppSecret, getMetaWebhookVerifyToken } from "./meta-platform";
import {
  GROWTH_WHATSAPP_CONNECTION_SOURCE_EMBEDDED,
  GROWTH_WHATSAPP_CONNECTION_SOURCE_LEGACY,
  type GrowthWhatsAppConnection,
  type GrowthWhatsAppConnectionSource,
} from "./types";

export interface UpsertGrowthWhatsAppConnectionInput {
  tenantId: string;
  phoneNumberId: string;
  wabaId?: string;
  businessId?: string;
  displayPhoneNumber?: string;
  verifyToken?: string;
  appSecret?: string;
  /** Token Cloud API para envío (MESSAGING-003). Opcional si ya existe. */
  accessToken?: string;
  connectionSource?: GrowthWhatsAppConnectionSource;
  enabled?: boolean;
  now?: string;
}

export type UpsertGrowthWhatsAppConnectionResult =
  | { ok: true; connection: GrowthWhatsAppConnection; created: boolean }
  | { ok: false; reason: "missing_tenant" }
  | { ok: false; reason: "missing_phone_number_id" }
  | { ok: false; reason: "missing_verify_token" }
  | { ok: false; reason: "missing_app_secret" }
  | { ok: false; reason: "phone_number_in_use" };

export async function upsertGrowthWhatsAppConnection(
  store: GrowthWhatsAppConnectionStore,
  input: UpsertGrowthWhatsAppConnectionInput
): Promise<UpsertGrowthWhatsAppConnectionResult> {
  const tenantId = input.tenantId?.trim();
  if (!tenantId) return { ok: false, reason: "missing_tenant" };

  const phoneNumberId = input.phoneNumberId?.trim();
  if (!phoneNumberId) return { ok: false, reason: "missing_phone_number_id" };

  const existing = await store.findByTenantId(tenantId);
  const now = input.now ?? new Date().toISOString();

  const platformVerify = getMetaWebhookVerifyToken();
  const platformSecret = getMetaAppSecret();
  const platformReady = Boolean(platformVerify && platformSecret);

  const inputVerify = input.verifyToken?.trim();
  const inputSecret = input.appSecret?.trim();
  const legacyVerify = inputVerify || existing?.verifyToken?.trim() || "";
  const legacySecret = inputSecret || existing?.appSecret?.trim() || "";

  // Con Meta de plataforma configurada, verify/appSecret viven en env (como ES).
  // No exigir duplicarlos por Espacio en el formulario técnico.
  if (!legacyVerify && !platformReady) {
    return { ok: false, reason: "missing_verify_token" };
  }
  if (!legacySecret && !platformReady) {
    return { ok: false, reason: "missing_app_secret" };
  }

  const owner = await store.findByPhoneNumberId(phoneNumberId);
  if (owner && owner.tenantId !== tenantId) {
    return { ok: false, reason: "phone_number_in_use" };
  }

  const accessToken =
    input.accessToken?.trim() || existing?.accessToken || undefined;

  const usesPlatformSecrets = platformReady && !legacyVerify && !legacySecret;
  const connectionSource =
    input.connectionSource ??
    existing?.connectionSource ??
    (usesPlatformSecrets
      ? GROWTH_WHATSAPP_CONNECTION_SOURCE_EMBEDDED
      : GROWTH_WHATSAPP_CONNECTION_SOURCE_LEGACY);

  const connection: GrowthWhatsAppConnection = {
    _id: existing?._id ?? new ObjectId().toString(),
    tenantId,
    phoneNumberId,
    // Firma/verify de plataforma: no duplicar secretos en el documento.
    verifyToken: usesPlatformSecrets ? "" : legacyVerify,
    appSecret: usesPlatformSecrets ? "" : legacySecret,
    enabled: input.enabled ?? existing?.enabled ?? true,
    connectionSource,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  if (accessToken) connection.accessToken = accessToken;

  const wabaId = input.wabaId?.trim() || existing?.wabaId;
  const businessId = input.businessId?.trim() || existing?.businessId;
  const displayPhoneNumber =
    input.displayPhoneNumber?.trim() || existing?.displayPhoneNumber;
  if (wabaId) connection.wabaId = wabaId;
  if (businessId) connection.businessId = businessId;
  if (displayPhoneNumber) connection.displayPhoneNumber = displayPhoneNumber;

  const saved = await store.upsert(connection);
  return { ok: true, connection: saved, created: !existing };
}
