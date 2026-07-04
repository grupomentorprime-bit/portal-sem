import {
  PORTAL_ROLE_CODES,
  ROLE_CODES,
  type PortalRoleCode,
  type RoleCode,
  isSuperAdminCode,
} from "@/core/identity/roles/codes";

/** Nivel jerárquico (mayor = más privilegio). Roles operativos comparten nivel. */
const HIERARCHY_LEVEL: Record<PortalRoleCode, number> = {
  [ROLE_CODES.SUPER_ADMIN]: 100,
  [ROLE_CODES.INSTITUTION_ADMIN]: 80,
  [ROLE_CODES.SUPPORT]: 70,
  [ROLE_CODES.ADMISSIONS]: 40,
  [ROLE_CODES.STUDENT_AFFAIRS]: 40,
  [ROLE_CODES.COMMUNICATIONS]: 40,
  [ROLE_CODES.REVIEWER]: 30,
  [ROLE_CODES.GUEST]: 10,
};

export function getRoleLevel(code: RoleCode | null | undefined): number {
  if (!code) return 0;
  return HIERARCHY_LEVEL[code as PortalRoleCode] ?? 0;
}

/** Roles visibles en listado de usuarios según el rol del caller. */
export function getVisibleRoleCodes(callerCode: RoleCode | null): PortalRoleCode[] {
  if (!callerCode || callerCode === ROLE_CODES.SUPER_ADMIN) {
    return [...PORTAL_ROLE_CODES];
  }
  if (callerCode === ROLE_CODES.INSTITUTION_ADMIN) {
    return PORTAL_ROLE_CODES.filter((c) => c !== ROLE_CODES.SUPER_ADMIN);
  }
  if (callerCode === ROLE_CODES.SUPPORT) {
    return PORTAL_ROLE_CODES.filter(
      (c) => c !== ROLE_CODES.SUPER_ADMIN && c !== ROLE_CODES.INSTITUTION_ADMIN
    );
  }
  return [];
}

/** Roles que el caller puede asignar al invitar o cambiar rol. */
export function getAssignableRoleCodes(callerCode: RoleCode | null): PortalRoleCode[] {
  if (!callerCode) return [];
  if (callerCode === ROLE_CODES.SUPER_ADMIN) {
    return PORTAL_ROLE_CODES.filter((c) => c !== ROLE_CODES.SUPER_ADMIN);
  }
  if (callerCode === ROLE_CODES.INSTITUTION_ADMIN) {
    return PORTAL_ROLE_CODES.filter((c) => c !== ROLE_CODES.SUPER_ADMIN);
  }
  if (callerCode === ROLE_CODES.SUPPORT) {
    return PORTAL_ROLE_CODES.filter(
      (c) =>
        c !== ROLE_CODES.SUPER_ADMIN &&
        c !== ROLE_CODES.INSTITUTION_ADMIN
    );
  }
  return [];
}

export function canViewMember(callerCode: RoleCode | null, targetCode: RoleCode | null): boolean {
  if (!targetCode) return true;
  if (isSuperAdminCode(targetCode)) {
    return callerCode === ROLE_CODES.SUPER_ADMIN;
  }
  const visible = getVisibleRoleCodes(callerCode);
  return visible.includes(targetCode as PortalRoleCode);
}

export function canManageMember(callerCode: RoleCode | null, targetCode: RoleCode | null): boolean {
  if (!callerCode || !targetCode) return false;
  if (isSuperAdminCode(targetCode)) {
    return callerCode === ROLE_CODES.SUPER_ADMIN;
  }
  if (targetCode === ROLE_CODES.INSTITUTION_ADMIN) {
    return callerCode === ROLE_CODES.SUPER_ADMIN || callerCode === ROLE_CODES.INSTITUTION_ADMIN;
  }
  const assignable = getAssignableRoleCodes(callerCode);
  return assignable.includes(targetCode as PortalRoleCode);
}

export function canAssignRole(callerCode: RoleCode | null, newRoleCode: RoleCode | null): boolean {
  if (!newRoleCode) return false;
  if (isSuperAdminCode(newRoleCode)) return false;
  const assignable = getAssignableRoleCodes(callerCode);
  return assignable.includes(newRoleCode as PortalRoleCode);
}

export function denySuperAdminTarget(targetCode: RoleCode | null): boolean {
  return isSuperAdminCode(targetCode);
}
