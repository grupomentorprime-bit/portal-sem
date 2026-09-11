import { loadSessionContext } from "@/lib/identity/sessions";
import { resolveActiveTenantIdFromRequest } from "@/core/tenant/context";

export type TenantGuardResult =
  | { ok: true; tenant: string }
  | { ok: false; error: string; status: 400 | 403 | 503 };

/**
 * Tenant efectivo solo desde contexto — ignora body/query.
 * Auth (SAAS-005): sesión.activeTenantId + membresía activa.
 * Público / sin sesión: Host → TenantContext (SAAS-002).
 */
export async function requireActiveTenant(): Promise<TenantGuardResult> {
  const loaded = await loadSessionContext();
  if (loaded) {
    const active = loaded.session.tenantId?.trim() ?? "";
    if (!active || !loaded.membership) {
      return {
        ok: false,
        error: "Sin Espacio activo.",
        status: 403,
      };
    }
    return { ok: true, tenant: active };
  }

  const activeTenant = await resolveActiveTenantIdFromRequest();
  if (!activeTenant) {
    return { ok: false, error: "Tenant no configurado.", status: 503 };
  }
  return { ok: true, tenant: activeTenant };
}

/**
 * Deny by default — el tenant pedido debe coincidir con el del contexto
 * (sesión o host), no con un ?tenant= spoofeable solo.
 * @deprecated Preferir `requireActiveTenant()` y no leer tenant del body/query.
 */
export async function assertActiveTenant(
  requestedTenant: string | null | undefined
): Promise<TenantGuardResult> {
  const trimmed = requestedTenant?.trim() ?? "";
  if (!trimmed) {
    return { ok: false, error: "tenant es obligatorio.", status: 400 };
  }

  const active = await requireActiveTenant();
  if (!active.ok) return active;

  if (trimmed !== active.tenant) {
    return { ok: false, error: "Acceso denegado entre tenants.", status: 403 };
  }

  return { ok: true, tenant: trimmed };
}

export function tenantGuardResponse(result: Extract<TenantGuardResult, { ok: false }>) {
  return Response.json({ ok: false, error: result.error }, { status: result.status });
}
