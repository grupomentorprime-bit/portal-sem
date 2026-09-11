/**
 * OT-GROWTH-MESSAGING-005 — comprobar conexión WhatsApp guardada (sin exponer Meta).
 */

import type { GrowthWhatsAppConnectionStore } from "./connection-store";
import type { WhatsAppCloudApiPort } from "./cloud-api";
import { createHttpWhatsAppCloudApi } from "./cloud-api";

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
  if (
    !phoneNumberId ||
    !accessToken ||
    !connection.verifyToken?.trim() ||
    !connection.appSecret?.trim()
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
