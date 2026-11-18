import { ROLE_CODES } from "@/core/identity/roles/codes";
import { IPN_CHILE_TENANT_ID, IPN_CHILE_VARONES } from "@/core/units/ipn-chile";
import { departmentUnitIdForRole, unitIdsFromAccess } from "@/lib/notifications/email-brand";

/**
 * Unidades que nombran el lugar de la persona.
 * Acceso por unidad manda. En IPN Chile, sin unidad explícita, el lugar
 * visible es el Departamento Nacional de Varones (único departamento hoy).
 */
export function departmentUnitIdsForPlace(input: {
  tenantId: string;
  roleCodes: readonly string[];
  unitAccess?: { mode: string; unitIds?: readonly string[] } | null;
}): string[] {
  const fromAccess = unitIdsFromAccess(input.unitAccess);
  if (fromAccess?.length) return fromAccess;

  if (input.tenantId === IPN_CHILE_TENANT_ID) {
    return [IPN_CHILE_VARONES.unitId];
  }

  const codes = input.roleCodes.filter(Boolean);
  const unitId = codes
    .map((code) => departmentUnitIdForRole(input.tenantId, code))
    .find(Boolean);
  if (unitId) return [unitId];

  if (
    codes.includes(ROLE_CODES.CONGRESS_OPERATOR) &&
    !codes.includes(ROLE_CODES.STUDENT_AFFAIRS)
  ) {
    const implied = departmentUnitIdForRole(input.tenantId, ROLE_CODES.CONGRESS_OPERATOR);
    return implied ? [implied] : [];
  }

  return [];
}

/** Nombre visible del departamento. Vacío si la persona está en el Espacio entero. */
export function departmentPlaceName(input: {
  unitIds: readonly string[];
  units: readonly { unitId: string; name: string; status?: string }[];
}): string {
  const names: string[] = [];
  for (const id of input.unitIds) {
    const unit = input.units.find((row) => row.unitId === id);
    if (unit?.status === "active") {
      const name = unit.name.trim();
      if (name) {
        names.push(name);
        continue;
      }
    }
    if (!unit && id === IPN_CHILE_VARONES.unitId) {
      names.push(IPN_CHILE_VARONES.name);
    }
  }
  return [...new Set(names)].join(" · ");
}
