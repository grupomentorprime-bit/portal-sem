/**
 * OT-GROWTH-MESSAGING-002 — verificación GET del webhook (hub.challenge).
 */

import type { GrowthWhatsAppConnectionStore } from "./connection-store";
import { safeEqualString } from "./crypto";

export type VerifyWhatsAppWebhookResult =
  | { ok: true; challenge: string }
  | { ok: false; reason: "invalid_mode" }
  | { ok: false; reason: "missing_token_or_challenge" }
  | { ok: false; reason: "token_mismatch" };

export async function verifyWhatsAppWebhookSubscription(
  store: GrowthWhatsAppConnectionStore,
  query: {
    mode?: string | null;
    token?: string | null;
    challenge?: string | null;
  }
): Promise<VerifyWhatsAppWebhookResult> {
  const mode = query.mode?.trim();
  if (mode !== "subscribe") {
    return { ok: false, reason: "invalid_mode" };
  }

  const token = query.token?.trim();
  const challenge = query.challenge?.trim();
  if (!token || !challenge) {
    return { ok: false, reason: "missing_token_or_challenge" };
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
