/**
 * OT-GROWTH-MESSAGING-005 — comprobar conexión WhatsApp guardada (sin exponer Meta).
 */

import type { GrowthWhatsAppConnectionStore } from "./connection-store";
import type { WhatsAppCloudApiPort } from "./cloud-api";
import { createHttpWhatsAppCloudApi } from "./cloud-api";
import { getMetaAppSecret } from "./meta-platform";
import { GROWTH_WHATSAPP_CONNECTION_SOURCE_EMBEDDED } from "./types";

export type TestGrowthWhatsAppConnectionResult =
  | { ok: true }
  | { ok: false; reason: "missing_tenant" }
  | { ok: false; reason: "not_configured" }
  | { ok: false; reason: "incomplete" }
  | { ok: false; reason: "provider_rejected" };

export async function testGrowthWhatsAppConnection(
  store: GrowthWhatsAppConnectionStore,
  input: { tenantId: string },
  cloudApi: WhatsAppCloudApiPort = createHttpWhatsAppCloudApi()
): Promise<TestGrowthWhatsAppConnectionResult> {
  const tenantId = input.tenantId?.trim();
  if (!tenantId) return { ok: false, reason: "missing_tenant" };

  const connection = await store.findByTenantId(tenantId);
  if (!connection) return { ok: false, reason: "not_configured" };

  const phoneNumberId = connection.phoneNumberId?.trim();
  const accessToken = connection.accessToken?.trim();
  const platformBacked =
    connection.connectionSource === GROWTH_WHATSAPP_CONNECTION_SOURCE_EMBEDDED ||
    Boolean(getMetaAppSecret());
  const hasLegacySecrets = Boolean(
    connection.verifyToken?.trim() && connection.appSecret?.trim()
  );
  if (
    !phoneNumberId ||
    !accessToken ||
    (!platformBacked && !hasLegacySecrets)
  ) {
    return { ok: false, reason: "incomplete" };
  }

  const probe = await cloudApi.probePhoneNumber({
    phoneNumberId,
    accessToken,
  });

  if (!probe.ok) return { ok: false, reason: "provider_rejected" };
  return { ok: true };
}
