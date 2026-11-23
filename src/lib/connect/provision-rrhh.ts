import "server-only";

import { rrhhOriginFromEnv } from "@/lib/connect/desk";
import { provisionRecord, type ExternalProvisionRecord } from "@/lib/connect/provision-state";
import { readConnectSecret } from "@/lib/connect/secret";

/** Pide a RR.HH. la empresa y el administrador master de ese cliente. Una sola vez. */
export async function provisionRrhhCompany(input: {
  tenantId: string;
  companyName: string;
  email: string;
  displayName: string;
}): Promise<ExternalProvisionRecord> {
  const at = new Date().toISOString();
  const origin = rrhhOriginFromEnv();
  const secret = readConnectSecret();
  if (!origin || !secret) return { state: "not_configured", httpStatus: null, at };
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
  const body = response ? await response.json().catch(() => null) : null;
  return provisionRecord({
    tenantId: input.tenantId,
    httpStatus: response ? response.status : null,
    body,
    at,
  });
}
