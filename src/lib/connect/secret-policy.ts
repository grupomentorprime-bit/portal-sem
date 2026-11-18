import { randomBytes } from "node:crypto";

/** 32 bytes en base64url: 256 bits, sin padding. */
const SECRET_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;

export function generateConnectExchangeSecret(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Longitud de clave de 256 bits y alfabeto de un generador criptográfico.
 * Una cadena larga pero repetida no cuenta: no hay entropía que medir, solo material de clave.
 */
export function connectSecretHasEntropy(value: string | null | undefined): boolean {
  const trimmed = value?.trim() ?? "";
  if (!SECRET_PATTERN.test(trimmed)) return false;
  if (new Set(trimmed).size < 16) return false;
  try {
    return Buffer.from(trimmed, "base64url").length >= 32;
  } catch {
    return false;
  }
}
