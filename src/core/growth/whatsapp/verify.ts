/**
 * OT-GROWTH-MESSAGING-002 / OT-GROWTH-WHATSAPP-META-001 /
 * OT-GROWTH-WHATSAPP-WEBHOOK-VERIFY-FIX-001 —
 * verificación GET del webhook (hub.challenge).
 * Prioridad: META_WEBHOOK_VERIFY_TOKEN (sin DB); fallback conexiones legacy.
 */

import type { GrowthWhatsAppConnectionStore } from "./connection-store";
import { safeEqualString } from "./crypto";
import { getMetaWebhookVerifyToken } from "./meta-platform";

export type VerifyWhatsAppWebhookResult =
  | { ok: true; challenge: string }
  | { ok: false; reason: "invalid_mode" }
  | { ok: false; reason: "missing_token_or_challenge" }
  | { ok: false; reason: "token_mismatch" };

/**
 * Handshake oficial Meta. `store` puede ser `null` cuando solo se valida el
 * token de plataforma (camino preferido — no abre Mongo).
 */
export async function verifyWhatsAppWebhookSubscription(
  store: GrowthWhatsAppConnectionStore | null,
  query: {
    mode?: string | null;
    token?: string | null;
    challenge?: string | null;
  },
  options?: { platformVerifyToken?: string | null }
): Promise<VerifyWhatsAppWebhookResult> {
  const mode = query.mode?.trim();
  if (mode !== "subscribe") {
    return { ok: false, reason: "invalid_mode" };
  }

  const token = query.token?.trim();
  // Echo exacto del challenge que envía Meta (no recortar).
  const challenge = query.challenge;
  if (!token || challenge == null || challenge === "") {
    return { ok: false, reason: "missing_token_or_challenge" };
  }

  const platformToken =
    options?.platformVerifyToken !== undefined
      ? options.platformVerifyToken?.trim() || null
      : getMetaWebhookVerifyToken();

  if (platformToken && safeEqualString(platformToken, token)) {
    return { ok: true, challenge };
  }

  if (!store) {
    return { ok: false, reason: "token_mismatch" };
  }

  const enabled = await store.listEnabled();
  const matched = enabled.some((connection) =>
    safeEqualString(connection.verifyToken, token)
  );
  if (!matched) {
    return { ok: false, reason: "token_mismatch" };
  }

  return { ok: true, challenge };
}
