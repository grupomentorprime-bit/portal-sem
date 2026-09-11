import { SEM_TENANT_ID } from "@/core/tenant/constants";

/** True solo para el Espacio productivo SEM (T001). */
export function isSemTenant(tenantId: string | null | undefined): boolean {
  return Boolean(tenantId?.trim() && tenantId.trim() === SEM_TENANT_ID);
}
