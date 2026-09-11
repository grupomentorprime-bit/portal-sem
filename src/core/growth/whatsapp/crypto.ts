/**
 * OT-GROWTH-MESSAGING-002 — firma X-Hub-Signature-256 y comparación constante.
 */

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function safeEqualString(left: string, right: string): boolean {
  const a = createHash("sha256").update(left, "utf8").digest();
  const b = createHash("sha256").update(right, "utf8").digest();
  return timingSafeEqual(a, b);
}

/**
 * Meta envía `X-Hub-Signature-256: sha256=<hex>` sobre el body crudo.
 */
export function verifyWhatsAppHubSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  appSecret: string
): boolean {
  const header = signatureHeader?.trim() ?? "";
  const secret = appSecret.trim();
  if (!header || !secret || !rawBody) return false;
  if (!header.toLowerCase().startsWith("sha256=")) return false;

  const expected =
    "sha256=" +
    createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  return safeEqualString(header, expected);
}

export function signWhatsAppHubBody(rawBody: string, appSecret: string): string {
  return (
    "sha256=" +
    createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex")
  );
}
