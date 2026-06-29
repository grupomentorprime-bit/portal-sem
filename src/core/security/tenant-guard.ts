import { getSiteConfigUncached } from "@/lib/cms/config";

export type TenantGuardResult =
  | { ok: true; tenant: string }
  | { ok: false; error: string; status: 400 | 403 | 503 };

/** Deny by default — solo permite el tenant activo de la instancia */
export async function assertActiveTenant(
  requestedTenant: string | null | undefined
): Promise<TenantGuardResult> {
  const trimmed = requestedTenant?.trim() ?? "";
  if (!trimmed) {
    return { ok: false, error: "tenant es obligatorio.", status: 400 };
  }

  const config = await getSiteConfigUncached();
  if (!config?.institution.tenant) {
    return { ok: false, error: "Tenant no configurado.", status: 503 };
  }

  if (trimmed !== config.institution.tenant) {
    return { ok: false, error: "Acceso denegado entre tenants.", status: 403 };
  }

  return { ok: true, tenant: trimmed };
}

export function tenantGuardResponse(result: Extract<TenantGuardResult, { ok: false }>) {
  return Response.json({ ok: false, error: result.error }, { status: result.status });
}
