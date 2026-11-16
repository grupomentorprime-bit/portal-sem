import "server-only";

import { connectSecretHasEntropy } from "@/lib/connect/secret-policy";

function readNamedSecret(
  env: Record<string, string | undefined>,
  name: "CONNECT_EXCHANGE_SECRET" | "CONNECT_EXCHANGE_SECRET_PREVIOUS"
): string | null {
  const value = env[name]?.trim() ?? "";
  return connectSecretHasEntropy(value) ? value : null;
}

/** Secreto vigente. Ausente o débil: no hay emisión ni canje. */
export function readConnectSecret(
  env: Record<string, string | undefined> = process.env
): string | null {
  return readNamedSecret(env, "CONNECT_EXCHANGE_SECRET");
}

/**
 * Secreto anterior, solo durante la rotación.
 * El canje lo acepta; la emisión exige el vigente.
 */
export function readPreviousConnectSecret(
  env: Record<string, string | undefined> = process.env
): string | null {
  return readNamedSecret(env, "CONNECT_EXCHANGE_SECRET_PREVIOUS");
}
