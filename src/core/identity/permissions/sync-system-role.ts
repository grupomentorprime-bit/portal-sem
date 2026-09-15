/**
 * OT-GROWTH-IAM-SYNC-FIX-001 — Evolución de permissionMap en roles system.
 *
 * Distingue:
 * - claves nuevas del catálogo/plantilla (ausentes en el map persistido) → se toman de la plantilla
 * - claves ya presentes → se preservan (personalización del cliente)
 *
 * No es un reset a plantilla en cada login.
 *
 * Gate de seguridad: solo roles con `system === true` en el documento persistido
 * son administrados por plataforma. No inferir por nombre/código.
 */

import { ALL_CATALOG_PERMISSION_CODES } from "@/core/identity/permissions/catalog";
import {
  getDefaultRolePermissionTemplate,
  type PermissionMap,
} from "@/core/identity/permissions/role-templates";
import type { RoleCode } from "@/core/identity/roles/codes";

/**
 * Rol administrado por plataforma: solo si el documento persiste `system === true`.
 * No usar name/code como sustituto — un rol custom puede llamarse igual.
 */
export function isPlatformManagedSystemRole(role: {
  system?: boolean | null;
}): boolean {
  return role.system === true;
}

/**
 * Incorpora permisos nuevos de la plantilla vigente sin pisar personalizaciones.
 */
export function evolveSystemRolePermissionMap(
  currentMap: Record<string, boolean> | null | undefined,
  templateMap: PermissionMap
): PermissionMap {
  if (!currentMap || Object.keys(currentMap).length === 0) {
    return { ...templateMap };
  }

  const evolved: PermissionMap = {};
  for (const code of ALL_CATALOG_PERMISSION_CODES) {
    if (Object.prototype.hasOwnProperty.call(currentMap, code)) {
      evolved[code] = currentMap[code] === true;
    } else {
      evolved[code] = templateMap[code] === true;
    }
  }
  return evolved;
}

export function permissionMapsEqual(
  a: Record<string, boolean> | null | undefined,
  b: Record<string, boolean> | null | undefined
): boolean {
  for (const code of ALL_CATALOG_PERMISSION_CODES) {
    const aHas = Boolean(a && Object.prototype.hasOwnProperty.call(a, code));
    const bHas = Boolean(b && Object.prototype.hasOwnProperty.call(b, code));
    if (aHas !== bHas) return false;
    if ((a?.[code] === true) !== (b?.[code] === true)) return false;
  }
  return true;
}

export function permissionIdsEqual(
  a: string[] | null | undefined,
  b: string[] | null | undefined
): boolean {
  const left = [...(a ?? [])].map(String).sort().join("\0");
  const right = [...(b ?? [])].map(String).sort().join("\0");
  return left === right;
}

/**
 * Estado coherente permissionMap + ids derivados para un rol system de plataforma.
 * `toPermissionIds` se inyecta para evitar ciclos de import con el resolver.
 */
export function syncSystemRolePermissionState(input: {
  roleCode: RoleCode;
  currentPermissionMap?: Record<string, boolean> | null;
  currentPermissionIds?: string[] | null;
  toPermissionIds: (map: PermissionMap) => string[];
}): {
  permissionMap: PermissionMap;
  permissionIds: string[];
  changed: boolean;
} {
  const template = getDefaultRolePermissionTemplate(input.roleCode);
  const permissionMap = evolveSystemRolePermissionMap(
    input.currentPermissionMap,
    template
  );
  const permissionIds = input.toPermissionIds(permissionMap);
  const changed =
    !permissionMapsEqual(input.currentPermissionMap, permissionMap) ||
    !permissionIdsEqual(input.currentPermissionIds, permissionIds);

  return { permissionMap, permissionIds, changed };
}
