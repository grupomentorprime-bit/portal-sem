import "server-only";

import type { UnitAccess } from "@/core/units/types";
import { findRolesByIds, getRoleCode } from "@/lib/identity/roles";
import { setInvitationUnitAccess } from "@/lib/identity/invitations";
import {
  departmentInviteUnitId,
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
  const unitId = departmentInviteUnitId({
    tenantId: input.tenantId,
    roleCode,
  });
  if (!unitId) return undefined;

  if (input.invitationId) {
    await setInvitationUnitAccess(input.invitationId, input.tenantId, {
      mode: "units",
      unitIds: [unitId],
    });
  }
  return [unitId];
}
