import "server-only";

import { rrhhOriginFromEnv } from "@/lib/connect/desk";
import { readConnectSecret } from "@/lib/connect/secret";

/** Pide a RR.HH. la empresa y el administrador master de ese cliente. */
export async function provisionRrhhCompany(input: {
  tenantId: string;
  companyName: string;
  email: string;
  displayName: string;
}): Promise<boolean> {
  const origin = rrhhOriginFromEnv();
  const secret = readConnectSecret();
  if (!origin || !secret) return false;
  const response = await fetch(`${origin}/api/connect/provision`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(input),
    cache: "no-store",
    signal: AbortSignal.timeout(4_000),
  }).catch(() => null);
  return Boolean(response?.ok);
}
