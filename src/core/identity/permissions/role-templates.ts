/**
 * OT-IAM-002 — Plantillas de permisos granulares por rol (ROLE_CODES).
 * Los roles son plantillas; los usuarios heredan y pueden tener overrides.
 */

import { ROLE_CODES, type RoleCode } from "@/core/identity/roles/codes";
import { ALL_CATALOG_PERMISSION_CODES } from "@/core/identity/permissions/catalog";

export type PermissionMap = Record<string, boolean>;

function allAllowed(): PermissionMap {
  return Object.fromEntries(ALL_CATALOG_PERMISSION_CODES.map((code) => [code, true]));
}

function fromEntries(entries: [string, boolean][]): PermissionMap {
  const map: PermissionMap = {};
  for (const code of ALL_CATALOG_PERMISSION_CODES) map[code] = false;
  for (const [code, allowed] of entries) map[code] = allowed;
  return map;
}

/** Plantillas predeterminadas por código de rol oficial */
export const ROLE_PERMISSION_TEMPLATES: Record<RoleCode, PermissionMap> = {
  [ROLE_CODES.SUPER_ADMIN]: allAllowed(),

  [ROLE_CODES.INSTITUTION_ADMIN]: fromEntries([
    ["convocations.view", true], ["convocations.create", true], ["convocations.update", true],
    ["convocations.publish", true], ["convocations.close", true], ["convocations.delete", false],
    ["participants.view", true], ["participants.update", true], ["participants.checkin", true], ["participants.export", true],
    ["portal.pages.view", true], ["portal.pages.create", true], ["portal.pages.update", true],
    ["portal.pages.publish", true], ["portal.pages.delete", false],
    ["portal.media.view", true], ["portal.media.upload", true], ["portal.media.update", true], ["portal.media.delete", false],
    ["portal.menus.view", true], ["portal.menus.manage", true],
    ["content.programs.manage", true], ["content.news.manage", true], ["content.events.manage", true],
    ["student_affairs.panel.view", true], ["student_affairs.scope.manage", true],
    ["settings.institution.update", true], ["settings.integrations.manage", true], ["settings.team.manage", true],
    ["identity.roles.manage", false], ["identity.members.manage", true], ["identity.permissions.override", true],
    ["identity.audit.read", true],
    ["workflow.view", true], ["workflow.manage", true], ["workflow.transition", true],
    ["events.view", true], ["events.manage", true], ["events.replay", false],
    ["academic.students.view", true], ["academic.finance.view", false], ["academic.finance.manage", false],
  ]),

  [ROLE_CODES.SUPPORT]: fromEntries([
    ["convocations.view", true], ["convocations.create", true], ["convocations.update", true],
    ["convocations.publish", true], ["convocations.close", true], ["convocations.delete", false],
    ["participants.view", true], ["participants.update", true], ["participants.checkin", true], ["participants.export", true],
    ["portal.pages.view", true], ["portal.pages.create", true], ["portal.pages.update", true],
    ["portal.pages.publish", true], ["portal.pages.delete", false],
    ["portal.media.view", true], ["portal.media.upload", true], ["portal.media.update", true], ["portal.media.delete", false],
    ["portal.menus.view", true], ["portal.menus.manage", true],
    ["content.programs.manage", true], ["content.news.manage", true], ["content.events.manage", true],
    ["student_affairs.panel.view", true], ["student_affairs.scope.manage", true],
    ["settings.institution.update", true], ["settings.integrations.manage", true], ["settings.team.manage", true],
    ["identity.roles.manage", false], ["identity.members.manage", true], ["identity.permissions.override", true],
    ["identity.audit.read", true],
    ["workflow.view", true], ["workflow.manage", false], ["workflow.transition", true],
    ["events.view", true], ["events.manage", false], ["events.replay", false],
    ["academic.students.view", true], ["academic.finance.view", false], ["academic.finance.manage", false],
  ]),

  [ROLE_CODES.ADMISSIONS]: fromEntries([
    ["convocations.view", true], ["convocations.create", false], ["convocations.update", false],
    ["convocations.publish", false], ["convocations.close", false], ["convocations.delete", false],
    ["participants.view", true], ["participants.update", false], ["participants.checkin", false], ["participants.export", false],
    ["portal.pages.view", true],
    ["academic.students.view", true],
  ]),

  [ROLE_CODES.STUDENT_AFFAIRS]: fromEntries([
    ["convocations.view", true], ["convocations.create", true], ["convocations.update", true],
    ["convocations.publish", false], ["convocations.close", false], ["convocations.delete", false],
    ["participants.view", true], ["participants.update", true], ["participants.checkin", true], ["participants.export", true],
    ["student_affairs.panel.view", true], ["student_affairs.scope.manage", false],
  ]),

  [ROLE_CODES.COMMUNICATIONS]: fromEntries([
    ["convocations.view", true], ["convocations.create", true], ["convocations.update", true],
    ["convocations.publish", true], ["convocations.close", false], ["convocations.delete", false],
    ["participants.view", true], ["participants.update", true], ["participants.checkin", true], ["participants.export", false],
    ["portal.pages.view", true], ["portal.pages.update", true],
    ["portal.media.view", true], ["portal.media.upload", true],
    ["content.programs.manage", true], ["content.news.manage", true], ["content.events.manage", true],
    ["student_affairs.panel.view", true], ["student_affairs.scope.manage", true],
  ]),

  [ROLE_CODES.REVIEWER]: fromEntries([
    ["portal.pages.view", true], ["portal.media.view", true],
    ["content.programs.manage", true], ["content.news.manage", true], ["content.events.manage", true],
  ]),

  [ROLE_CODES.GUEST]: fromEntries([
    ["portal.pages.view", true], ["portal.media.view", true],
  ]),

  [ROLE_CODES.TEACHER]: fromEntries([
    ["portal.pages.view", true], ["portal.media.view", true], ["academic.students.view", true],
  ]),

  [ROLE_CODES.FINANCE]: fromEntries([
    ["academic.finance.view", true], ["academic.finance.manage", true],
  ]),

  [ROLE_CODES.STUDENT]: fromEntries([
    ["portal.pages.view", true],
  ]),
};

/** Techo de permisos: overrides no pueden activar permisos fuera de este mapa */
export function getRolePermissionCeiling(roleCode: RoleCode | null): PermissionMap {
  if (!roleCode) return fromEntries([]);
  return { ...ROLE_PERMISSION_TEMPLATES[roleCode] };
}

export function getDefaultRolePermissionTemplate(roleCode: RoleCode): PermissionMap {
  return { ...ROLE_PERMISSION_TEMPLATES[roleCode] };
}

export function mergeRolePermissionMaps(maps: PermissionMap[]): PermissionMap {
  const merged: PermissionMap = {};
  for (const code of ALL_CATALOG_PERMISSION_CODES) merged[code] = false;
  for (const map of maps) {
    for (const [code, allowed] of Object.entries(map)) {
      if (allowed) merged[code] = true;
    }
  }
  return merged;
}
