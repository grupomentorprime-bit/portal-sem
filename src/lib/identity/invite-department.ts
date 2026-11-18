import "server-only";

import type { UnitAccess } from "@/core/units/types";
import { findOrgUnit } from "@/core/units/repository";
import { getDatabase } from "@/lib/mongodb";
import { findRolesByIds, getRoleCode } from "@/lib/identity/roles";
import { setInvitationUnitAccess } from "@/lib/identity/invitations";
import {
  departmentUnitIdForRole,
  unitIdsFromAccess,
} from "@/lib/notifications/email-brand";

/**
 * Ids de unidad para el correo.
 * Si la invitación ya trae unidades, se respetan.
 * Si es Operador Congreso Varones y no trae unidad, se usa el departamento
 * y se guarda en la invitación para que el enlace y el logo coincidan.
 */
export async function unitIdsForDepartmentEmail(input: {
  tenantId: string;
  roleIds: readonly string[];
  unitAccess?: UnitAccess | null;
  invitationId?: string;
}): Promise<string[] | undefined> {
  const existing = unitIdsFromAccess(input.unitAccess);
  if (existing?.length) return existing;

  const roles = await findRolesByIds(input.tenantId, [...input.roleIds]);
  const roleCode = roles.map(getRoleCode).find((code) =>
    Boolean(departmentUnitIdForRole(input.tenantId, code))
  );
  const unitId = departmentUnitIdForRole(input.tenantId, roleCode);
  if (!unitId) return undefined;

  const unit = await findOrgUnit(await getDatabase(), input.tenantId, unitId);
  if (!unit) return undefined;

  if (input.invitationId) {
    await setInvitationUnitAccess(input.invitationId, input.tenantId, {
      mode: "units",
      unitIds: [unitId],
    });
  }
  return [unitId];
}
