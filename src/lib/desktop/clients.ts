export interface DesktopClient {
  tenantId: string;
  name: string;
  needsAccess: boolean;
}

/** Residuo de scripts de validación. No es un cliente. */
const VALIDATION_TENANT_PREFIX = "saas-val-";

/**
 * El miembro ve sus Espacios. El dueño ve todos los clientes activos,
 * aunque todavía no tenga membresía en ese Espacio.
 */
export function desktopClients(input: {
  operator: boolean;
  memberships: { tenantId: string; name: string }[];
  catalog: { tenantId: string; name: string; status: string }[];
}): DesktopClient[] {
  if (!input.operator) {
    return input.memberships
      .map((space) => ({
        tenantId: space.tenantId,
        name: space.name,
        needsAccess: false,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }

  const mine = new Set(input.memberships.map((space) => space.tenantId));
  return input.catalog
    .filter(
      (space) =>
        space.status === "active" &&
        !space.tenantId.startsWith(VALIDATION_TENANT_PREFIX)
    )
    .map((space) => ({
      tenantId: space.tenantId,
      name: space.name.trim() || space.tenantId,
      needsAccess: !mine.has(space.tenantId),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}
