/**
 * Sincroniza roles del portal (OT-IAM-SEM-001) y plantillas granulares permissionMap (OT-IAM-002).
 * OT-GROWTH-IAM-SYNC-FIX-001 — misma regla evolutiva que ensureTenantRoles.
 * Uso: npx tsx --env-file=.env scripts/sync-tenant-roles.ts [tenantId]
 */
import { MongoClient } from "mongodb";
import {
  PORTAL_TENANT_ROLES,
  roleIdForTenant,
} from "../src/core/identity/roles/defaults";
import { LEGACY_ROLE_NAME_TO_CODE } from "../src/core/identity/roles/codes";
import { getDefaultRolePermissionTemplate } from "../src/core/identity/permissions/role-templates";
import { granularToLegacyPermissions } from "../src/core/identity/permissions/resolver";
import {
  isPlatformManagedSystemRole,
  syncSystemRolePermissionState,
} from "../src/core/identity/permissions/sync-system-role";
import type { RoleCode } from "../src/core/identity/roles/codes";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
const tenantId = process.argv[2]?.trim() || "seminario-ipn";

if (!uri || !dbName) {
  console.error("Faltan MONGODB_URI o MONGODB_DB.");
  process.exit(1);
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const now = new Date().toISOString();

  const existing = await db
    .collection("identity_roles")
    .find({ tenantId })
    .toArray();

  const existingByCode = new Map<string, (typeof existing)[0]>();
  const existingByName = new Map(existing.map((r) => [r.name, r]));
  for (const role of existing) {
    const code = role.code ?? LEGACY_ROLE_NAME_TO_CODE[role.name];
    if (code) existingByCode.set(code, role);
  }

  let inserted = 0;
  let updated = 0;
  let mapsEvolved = 0;

  for (const template of PORTAL_TENANT_ROLES) {
    const targetId = roleIdForTenant(tenantId, template.code);
    const permissionMap = getDefaultRolePermissionTemplate(template.code as RoleCode);
    const permissionIds = granularToLegacyPermissions(permissionMap);

    let current =
      existingByCode.get(template.code) ??
      existingByName.get(template.name) ??
      existing.find((r) => r._id === targetId) ??
      null;

    if (!current) {
      for (const [legacyName, legacyCode] of Object.entries(LEGACY_ROLE_NAME_TO_CODE)) {
        if (legacyCode === template.code && existingByName.has(legacyName)) {
          current = existingByName.get(legacyName)!;
          break;
        }
      }
    }

    if (!current) {
      await db.collection("identity_roles").insertOne({
        _id: targetId,
        tenantId,
        code: template.code,
        name: template.name,
        description: template.description,
        permissionIds,
        permissionMap,
        system: template.system,
        createdAt: now,
        updatedAt: now,
      });
      inserted += 1;
      console.log(`  + creado ${template.name} (${template.code}) + permissionMap`);
      continue;
    }

    // Solo `system === true` en el documento — no inferir por name/code.
    if (!isPlatformManagedSystemRole(current)) continue;

    const updates: Record<string, unknown> = {};
    if (current.code !== template.code) updates.code = template.code;
    if (current.name !== template.name) updates.name = template.name;
    if (current.description !== template.description) updates.description = template.description;

    const synced = syncSystemRolePermissionState({
      roleCode: template.code as RoleCode,
      currentPermissionMap: current.permissionMap as
        | Record<string, boolean>
        | null
        | undefined,
      currentPermissionIds: current.permissionIds as string[] | null | undefined,
      toPermissionIds: granularToLegacyPermissions,
    });
    if (synced.changed) {
      updates.permissionMap = synced.permissionMap;
      updates.permissionIds = synced.permissionIds;
      mapsEvolved += 1;
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = now;
      await db.collection("identity_roles").updateOne({ _id: current._id }, { $set: updates });
      updated += 1;
      console.log(`  ↻ ${template.name} (${template.code})`);
    }
  }

  await client.close();
  console.log(
    `\n✓ Tenant ${tenantId}: ${inserted} creados, ${updated} actualizados, ${mapsEvolved} permissionMap evolucionados`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
