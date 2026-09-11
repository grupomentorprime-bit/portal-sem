/**
 * OT-GROWTH-MESSAGING-002 — persistir conexión (secretos fuera del documento del Espacio).
 * Un phone_number_id solo puede pertenecer a un Espacio.
 */

import { ObjectId } from "mongodb";
import type { GrowthWhatsAppConnectionStore } from "./connection-store";
import type { GrowthWhatsAppConnection } from "./types";

export interface UpsertGrowthWhatsAppConnectionInput {
  tenantId: string;
  phoneNumberId: string;
  wabaId?: string;
  displayPhoneNumber?: string;
  verifyToken?: string;
  appSecret?: string;
  /** Token Cloud API para envío (MESSAGING-003). Opcional si ya existe. */
  accessToken?: string;
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

  const verifyToken = input.verifyToken?.trim() || existing?.verifyToken;
  const appSecret = input.appSecret?.trim() || existing?.appSecret;
  if (!verifyToken) return { ok: false, reason: "missing_verify_token" };
  if (!appSecret) return { ok: false, reason: "missing_app_secret" };

  const owner = await store.findByPhoneNumberId(phoneNumberId);
  if (owner && owner.tenantId !== tenantId) {
    return { ok: false, reason: "phone_number_in_use" };
  }

  const accessToken =
    input.accessToken?.trim() || existing?.accessToken || undefined;

  const connection: GrowthWhatsAppConnection = {
    _id: existing?._id ?? new ObjectId().toString(),
    tenantId,
    phoneNumberId,
    verifyToken,
    appSecret,
    enabled: input.enabled ?? existing?.enabled ?? true,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  if (accessToken) connection.accessToken = accessToken;

  const wabaId = input.wabaId?.trim() || existing?.wabaId;
  const displayPhoneNumber =
    input.displayPhoneNumber?.trim() || existing?.displayPhoneNumber;
  if (wabaId) connection.wabaId = wabaId;
  if (displayPhoneNumber) connection.displayPhoneNumber = displayPhoneNumber;

  const saved = await store.upsert(connection);
  return { ok: true, connection: saved, created: !existing };
}
