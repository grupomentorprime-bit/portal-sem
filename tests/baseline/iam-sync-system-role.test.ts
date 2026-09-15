/**
 * OT-GROWTH-IAM-SYNC-FIX-001 — evolución de permissionMap en roles system.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ALL_CATALOG_PERMISSION_CODES } from "../../src/core/identity/permissions/catalog";
import {
  getDefaultRolePermissionTemplate,
  ROLE_PERMISSION_TEMPLATES,
} from "../../src/core/identity/permissions/role-templates";
import {
  isPlatformManagedSystemRole,
  permissionMapsEqual,
  syncSystemRolePermissionState,
} from "../../src/core/identity/permissions/sync-system-role";
import {
  granularToLegacyPermissions,
  resolveRolePermissionMap,
} from "../../src/core/identity/permissions/resolver";
import { ROLE_CODES } from "../../src/core/identity/roles/codes";
import type { IdentityRole } from "../../src/types/identity";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("OT-GROWTH-IAM-SYNC-FIX-001 — sync evolutivo de roles system", () => {
  it("distingue rol platform-managed solo por system===true (no por nombre)", () => {
    assert.equal(isPlatformManagedSystemRole({ system: true }), true);
    assert.equal(isPlatformManagedSystemRole({ system: false }), false);
    assert.equal(isPlatformManagedSystemRole({ system: undefined }), false);
    assert.equal(isPlatformManagedSystemRole({}), false);
    assert.equal(isPlatformManagedSystemRole({ system: null }), false);
  });

  it("rol antiguo sin clave nueva → sync incorpora plantilla → resolver la reconoce", () => {
    const template = getDefaultRolePermissionTemplate(ROLE_CODES.SUPER_ADMIN);
    const staleKey = "growth.people.view";
    assert.equal(template[staleKey], true);

    // Simula map persistido antes de que el catálogo tuviera growth.*
    const oldMap: Record<string, boolean> = {};
    for (const code of ALL_CATALOG_PERMISSION_CODES) {
      if (code.startsWith("growth.")) continue;
      oldMap[code] = template[code] === true;
    }
    assert.equal(Object.prototype.hasOwnProperty.call(oldMap, staleKey), false);

    const synced = syncSystemRolePermissionState({
      roleCode: ROLE_CODES.SUPER_ADMIN,
      currentPermissionMap: oldMap,
      currentPermissionIds: [],
      toPermissionIds: granularToLegacyPermissions,
    });

    assert.equal(synced.changed, true);
    assert.equal(synced.permissionMap[staleKey], true);
    assert.ok(synced.permissionIds.includes("growth.people.view"));

    const role = {
      _id: "role-test",
      tenantId: "tenant-a",
      code: ROLE_CODES.SUPER_ADMIN,
      name: "Super Admin",
      description: "test",
      permissionIds: synced.permissionIds,
      permissionMap: synced.permissionMap,
      system: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } satisfies IdentityRole;

    const resolved = resolveRolePermissionMap(role);
    assert.equal(resolved[staleKey], true);
  });

  it("personalización del cliente se preserva (no reset a plantilla)", () => {
    const template = getDefaultRolePermissionTemplate(ROLE_CODES.INSTITUTION_ADMIN);
    assert.equal(template["growth.people.manage"], true);

    const customized = { ...template, "growth.people.manage": false };
    const synced = syncSystemRolePermissionState({
      roleCode: ROLE_CODES.INSTITUTION_ADMIN,
      currentPermissionMap: customized,
      currentPermissionIds: granularToLegacyPermissions(customized),
      toPermissionIds: granularToLegacyPermissions,
    });

    assert.equal(synced.changed, false);
    assert.equal(synced.permissionMap["growth.people.manage"], false);
  });

  it("sync repetido es idempotente", () => {
    const template = getDefaultRolePermissionTemplate(ROLE_CODES.SUPPORT);
    const first = syncSystemRolePermissionState({
      roleCode: ROLE_CODES.SUPPORT,
      currentPermissionMap: Object.fromEntries(
        Object.entries(template).filter(([k]) => !k.startsWith("growth."))
      ),
      currentPermissionIds: [],
      toPermissionIds: granularToLegacyPermissions,
    });
    assert.equal(first.changed, true);

    const second = syncSystemRolePermissionState({
      roleCode: ROLE_CODES.SUPPORT,
      currentPermissionMap: first.permissionMap,
      currentPermissionIds: first.permissionIds,
      toPermissionIds: granularToLegacyPermissions,
    });
    assert.equal(second.changed, false);
    assert.ok(permissionMapsEqual(first.permissionMap, second.permissionMap));
  });

  it("roles limitados no reciben Growth completo", () => {
    for (const code of [
      ROLE_CODES.GUEST,
      ROLE_CODES.REVIEWER,
      ROLE_CODES.STUDENT_AFFAIRS,
      ROLE_CODES.COMMUNICATIONS,
    ]) {
      const stale = Object.fromEntries(
        Object.entries(ROLE_PERMISSION_TEMPLATES[code]).filter(
          ([k]) => !k.startsWith("growth.")
        )
      );
      const synced = syncSystemRolePermissionState({
        roleCode: code,
        currentPermissionMap: stale,
        currentPermissionIds: [],
        toPermissionIds: granularToLegacyPermissions,
      });
      assert.equal(synced.permissionMap["growth.people.view"], false, code);
      assert.equal(synced.permissionMap["growth.sales.operate"], false, code);
      assert.equal(
        synced.permissionIds.some((p) => String(p).startsWith("growth.")),
        false,
        code
      );
    }
  });

  it("ensureTenantRoles y sync:tenant-roles reutilizan syncSystemRolePermissionState + gate system", () => {
    const ensureSrc = readSrc("src/lib/identity/roles.ts");
    const syncSrc = readSrc("scripts/sync-tenant-roles.ts");
    assert.match(ensureSrc, /syncSystemRolePermissionState/);
    assert.match(syncSrc, /syncSystemRolePermissionState/);
    assert.match(ensureSrc, /isPlatformManagedSystemRole/);
    assert.match(syncSrc, /isPlatformManagedSystemRole/);
    assert.ok(ensureSrc.includes('permissions/sync-system-role"'));
    assert.ok(syncSrc.includes("permissions/sync-system-role"));
    assert.doesNotMatch(
      ensureSrc,
      /current\.system && !current\.permissionMap/
    );
    assert.doesNotMatch(
      syncSrc,
      /!current\.permissionMap \|\| Object\.keys\(current\.permissionMap\)\.length === 0/
    );
  });

  it("provisionTenantFoundation sigue sembrando plantilla vigente en roles nuevos", () => {
    const provision = readSrc("src/core/tenant/provision.ts");
    assert.match(provision, /getDefaultRolePermissionTemplate/);
    assert.match(provision, /PORTAL_TENANT_ROLES/);
    assert.match(provision, /rolesSkipped/);
  });
});
