/**
 * OT-GROWTH-WHATSAPP-META-001 — state firmado del flujo Embedded Signup.
 * Vincula el retorno de Meta al Espacio que inició la conexión.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getSessionSecret } from "@/core/identity/auth/config";

const STATE_TTL_MS = 15 * 60 * 1000;
const STATE_PREFIX = "waes1";

export type WhatsAppConnectStateResult =
  | { ok: true; tenantId: string; nonce: string; issuedAt: number }
  | { ok: false; reason: "invalid_format" | "invalid_signature" | "expired" | "tenant_mismatch" };

function signPayload(payload: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(payload, "utf8")
    .digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Emite un state opaco para el Espacio autenticado. */
export function createWhatsAppConnectState(
  tenantId: string,
  options?: { now?: number; nonce?: string }
): string {
  const tid = tenantId.trim();
  if (!tid) throw new Error("tenantId requerido para state de WhatsApp.");
  const issuedAt = options?.now ?? Date.now();
  const nonce = options?.nonce ?? randomBytes(16).toString("base64url");
  const body = `${STATE_PREFIX}.${tid}.${issuedAt}.${nonce}`;
  return `${body}.${signPayload(body)}`;
}

export function verifyWhatsAppConnectState(
  state: string | null | undefined,
  options?: { expectedTenantId?: string; now?: number; ttlMs?: number }
): WhatsAppConnectStateResult {
  const raw = state?.trim() ?? "";
  if (!raw) return { ok: false, reason: "invalid_format" };

  const parts = raw.split(".");
  if (parts.length !== 5) return { ok: false, reason: "invalid_format" };
  const [prefix, tenantId, issuedAtRaw, nonce, signature] = parts;
  if (prefix !== STATE_PREFIX || !tenantId || !issuedAtRaw || !nonce || !signature) {
    return { ok: false, reason: "invalid_format" };
  }

  const body = `${prefix}.${tenantId}.${issuedAtRaw}.${nonce}`;
  const expected = signPayload(body);
  if (!safeEqual(signature, expected)) {
    return { ok: false, reason: "invalid_signature" };
  }

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt)) return { ok: false, reason: "invalid_format" };

  const now = options?.now ?? Date.now();
  const ttl = options?.ttlMs ?? STATE_TTL_MS;
  if (now - issuedAt > ttl || issuedAt > now + 60_000) {
    return { ok: false, reason: "expired" };
  }

  const expectedTenant = options?.expectedTenantId?.trim();
  if (expectedTenant && expectedTenant !== tenantId) {
    return { ok: false, reason: "tenant_mismatch" };
  }

  return { ok: true, tenantId, nonce, issuedAt };
}
