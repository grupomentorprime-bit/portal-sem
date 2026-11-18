import "server-only";

import { listOrgUnits } from "@/core/units/repository";
import type { UnitAccess } from "@/core/units/types";
import { departmentPlaceName, departmentUnitIdsForPlace } from "@/lib/identity/place-label";
import { getDatabase } from "@/lib/mongodb";

/** Nombre del departamento activo, o vacío si la sesión es del Espacio completo. */
export async function activeDepartmentName(input: {
  tenantId: string;
  roleCodes: readonly string[];
  unitAccess?: UnitAccess | null;
}): Promise<string> {
  const tenantId = input.tenantId.trim();
  if (!tenantId) return "";
  const unitIds = departmentUnitIdsForPlace({
    tenantId,
    roleCodes: input.roleCodes,
    unitAccess: input.unitAccess,
  });
  if (!unitIds.length) return "";
  const units = await listOrgUnits(await getDatabase(), tenantId);
  return departmentPlaceName({ unitIds, units });
}
