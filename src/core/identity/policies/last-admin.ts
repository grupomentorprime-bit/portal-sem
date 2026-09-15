import { ROLE_CODES, type RoleCode } from "@/core/identity/roles/codes";
import { getRoleLevel } from "@/core/identity/roles/hierarchy";

/** Error de producto estable (D4 / Equipo V1). */
export const LAST_SPACE_ADMIN_ERROR =
  "No se puede dejar el Espacio sin un Dueño o Administrador activo.";

/** Nivel mínimo que cuenta como garante de administración (Dueño o Administrador). Soporte (70) no cuenta. */
export const SPACE_ADMIN_MIN_LEVEL = getRoleLevel(ROLE_CODES.INSTITUTION_ADMIN);

export function isSpaceAdministratorRole(code: RoleCode | null | undefined): boolean {
  return getRoleLevel(code) >= SPACE_ADMIN_MIN_LEVEL;
}

/**
 * Tras quitar acceso o degradar un admin: ¿quedaría ≥1 Dueño/Administrador activo?
 * `membershipRemainsAdmin` = true si esa membership sigue activa y con nivel ≥ institution_admin.
 */
export function wouldLeaveWithoutSpaceAdmin(input: {
  activeAdminMembershipIds: string[];
  membershipId: string;
  membershipRemainsAdmin: boolean;
}): boolean {
  const remaining = input.activeAdminMembershipIds.filter((id) => {
    if (id !== input.membershipId) return true;
    return input.membershipRemainsAdmin;
  });
  return remaining.length === 0;
}
