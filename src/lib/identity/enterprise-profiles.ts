/**
 * Perfiles de empresa sobre identity_roles.
 * Los códigos oficiales siguen en la jerarquía existente.
 * Un perfil personalizado es un rol del Espacio con system:false, sin código de producto.
 */

import {
  ERP_ROLE_CODES,
  PORTAL_ROLE_CODES,
  ROLE_CODES,
  resolveRoleCode,
  type RoleCode,
} from "@/core/identity/roles/codes";
import { getRoleLevel } from "@/core/identity/roles/hierarchy";
import { getRolePermissionCeiling } from "@/core/identity/permissions/role-templates";

export type EnterpriseProfileKind = "enterprise" | "custom" | "product";

type ProfileRef = {
  code?: string | null;
  name?: string | null;
  system?: boolean;
};

export function officialRoleCode(role: ProfileRef): RoleCode | null {
  if (role.code) return resolveRoleCode(role.code);
  if (role.name) return resolveRoleCode(role.name);
  return null;
}

/** Empresa = plantillas del portal. Personalizado = rol del Espacio. Producto = ERP u otro sistema. */
export function classifyEnterpriseProfile(role: ProfileRef): EnterpriseProfileKind {
  const code = officialRoleCode(role);
  if (code && (ERP_ROLE_CODES as readonly string[]).includes(code)) return "product";
  if (code && (PORTAL_ROLE_CODES as readonly string[]).includes(code)) return "enterprise";
  if (code) return "product";
  if (role.system === false) return "custom";
  return "product";
}

export function grantsBeyondCaller(
  permissionMap: Record<string, boolean>,
  callerEffective: Record<string, boolean>
): string[] {
  return Object.entries(permissionMap)
    .filter(([code, allowed]) => allowed === true && callerEffective[code] !== true)
    .map(([code]) => code);
}

export function grantsBeyondCeiling(
  permissionMap: Record<string, boolean>,
  ceiling: Record<string, boolean>
): string[] {
  return Object.entries(permissionMap)
    .filter(([code, allowed]) => allowed === true && ceiling[code] !== true)
    .map(([code]) => code);
}

export function unionGranted(
  maps: Array<Record<string, boolean> | null | undefined>
): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const source of maps) {
    if (!source) continue;
    for (const [code, allowed] of Object.entries(source)) {
      if (allowed === true) map[code] = true;
    }
  }
  return map;
}

export function memberIsCustomOnly(roles: ProfileRef[]): boolean {
  return roles.length > 0 && roles.every((role) => classifyEnterpriseProfile(role) === "custom");
}

const RESERVED_PROFILE_NAMES = new Set<string>([
  ...Object.values(ROLE_CODES),
  ...PORTAL_ROLE_CODES,
  ...ERP_ROLE_CODES,
]);

export function validateCustomProfileName(
  name: string
): { ok: true; name: string } | { ok: false; error: string } {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (trimmed.length < 2 || trimmed.length > 60) {
    return { ok: false, error: "El nombre del perfil debe tener entre 2 y 60 caracteres." };
  }
  if (!/^[\p{L}\p{N}][\p{L}\p{N} .'-]*$/u.test(trimmed)) {
    return { ok: false, error: "Usa un nombre de perfil sin símbolos." };
  }
  if (RESERVED_PROFILE_NAMES.has(trimmed) || RESERVED_PROFILE_NAMES.has(trimmed.toLowerCase()) || resolveRoleCode(trimmed)) {
    return { ok: false, error: "Ese nombre está reservado para un perfil del sistema." };
  }
  return { ok: true, name: trimmed };
}

export function validateCustomProfileDescription(
  description: string
): { ok: true; description: string } | { ok: false; error: string } {
  const trimmed = description.trim().replace(/\s+/g, " ");
  if (trimmed.length > 240) {
    return { ok: false, error: "La descripción admite hasta 240 caracteres." };
  }
  return { ok: true, description: trimmed };
}

function canDelegateProfiles(
  callerCode: RoleCode | null,
  callerEffective: Record<string, boolean>
): boolean {
  if (
    callerCode === ROLE_CODES.SUPER_ADMIN ||
    callerCode === ROLE_CODES.INSTITUTION_ADMIN ||
    callerCode === ROLE_CODES.SUPPORT
  ) {
    return true;
  }
  return (
    callerEffective["settings.team.manage"] === true ||
    callerEffective["identity.members.manage"] === true ||
    callerEffective["identity.roles.manage"] === true
  );
}

export function assertCanManageCustomMember(input: {
  callerCode: RoleCode | null;
  callerEffective: Record<string, boolean>;
  permissionMap: Record<string, boolean>;
  isSystemAccount?: boolean;
}): { ok: true } | { ok: false; error: string; auditReason: string } {
  if (input.isSystemAccount) {
    return {
      ok: false,
      error: "No se puede modificar al Dueño del Espacio.",
      auditReason: "protected_system_account",
    };
  }
  return assertCanAssignCustomProfile(input);
}

export function assertCanAssignCustomProfile(input: {
  callerCode: RoleCode | null;
  callerEffective: Record<string, boolean>;
  permissionMap: Record<string, boolean>;
}): { ok: true } | { ok: false; error: string; auditReason: string } {
  const excess = grantsBeyondCaller(input.permissionMap, input.callerEffective);
  if (excess.length > 0) {
    return {
      ok: false,
      error: "No puedes asignar un perfil con permisos superiores a los tuyos.",
      auditReason: "custom_profile_exceeds_caller",
    };
  }
  if (!canDelegateProfiles(input.callerCode, input.callerEffective)) {
    return {
      ok: false,
      error: "No tienes permiso para asignar este perfil.",
      auditReason: "assign_denied_by_hierarchy",
    };
  }
  return { ok: true };
}

export function assertCanWriteProfilePermissions(input: {
  callerCode: RoleCode | null;
  callerEffective: Record<string, boolean>;
  role: ProfileRef;
  permissionMap: Record<string, boolean>;
}): { ok: true } | { ok: false; error: string } {
  const kind = classifyEnterpriseProfile(input.role);
  if (kind === "product") {
    return { ok: false, error: "Ese perfil no se administra desde la empresa." };
  }
  const code = officialRoleCode(input.role);
  if (code === ROLE_CODES.SUPER_ADMIN) {
    return { ok: false, error: "No se puede modificar la plantilla del Super Admin." };
  }
  if (kind === "enterprise") {
    if (getRoleLevel(input.callerCode) < getRoleLevel(code)) {
      return { ok: false, error: "No puedes modificar un perfil superior al tuyo." };
    }
    if (code && grantsBeyondCeiling(input.permissionMap, getRolePermissionCeiling(code)).length > 0) {
      return { ok: false, error: "Ese perfil no puede recibir permisos fuera de su plantilla." };
    }
  }
  if (grantsBeyondCaller(input.permissionMap, input.callerEffective).length > 0) {
    return { ok: false, error: "No puedes otorgar permisos superiores a los que tienes." };
  }
  return { ok: true };
}

export function grantablePermissionCodes(input: {
  callerEffective: Record<string, boolean>;
  role: ProfileRef;
}): string[] {
  const kind = classifyEnterpriseProfile(input.role);
  if (kind === "product") return [];
  const code = officialRoleCode(input.role);
  if (code === ROLE_CODES.SUPER_ADMIN) return [];
  let codes = Object.entries(input.callerEffective)
    .filter(([, allowed]) => allowed === true)
    .map(([permission]) => permission);
  if (kind === "enterprise" && code) {
    const ceiling = getRolePermissionCeiling(code);
    codes = codes.filter((permission) => ceiling[permission] === true);
  }
  return codes;
}
