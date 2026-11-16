import "server-only";

import { findTenantById } from "@/core/tenant";
import { ROLE_CODES } from "@/core/identity/roles/codes";
import { hasPlatformOwnerCapability } from "@/core/identity/platform/capability";
import { provisionRrhhCompany } from "@/lib/connect/provision-rrhh";
import { MENTOR_APPS, type MentorAppId } from "@/lib/desktop/catalog";
import { mongoAppRequestStore, readSpaceContract, writeSpaceContract } from "@/lib/desktop/store";
import { findMembership } from "@/lib/identity/memberships";
import { findRolesByIds, getRoleCode } from "@/lib/identity/roles";
import { grantOwnerSpaceAccess } from "@/lib/platform/enter-space";
import { getDatabase } from "@/lib/mongodb";
import type { IdentityMembership, IdentityUser } from "@/types/identity";

/** Dueño de la plataforma, o administrador de esa empresa. */
export async function isDeskMaster(user: IdentityUser, tenantId: string): Promise<boolean> {
  if (hasPlatformOwnerCapability(user)) return true;
  const membership = await findMembership(user._id, tenantId);
  if (!membership) return false;
  const roles = await findRolesByIds(tenantId, membership.roleIds);
  return roles.some((role) => {
    const code = getRoleCode(role);
    return code === ROLE_CODES.SUPER_ADMIN || code === ROLE_CODES.INSTITUTION_ADMIN;
  });
}

/**
 * Al darle acceso a un cliente: RR.HH. queda en el plan, el master tiene la llave
 * y la empresa existe con ese usuario.
 */
export async function ensureClientCompany(input: {
  tenantId: string;
  userId: string;
  email: string;
  displayName: string;
}): Promise<void> {
  const tenantId = input.tenantId.trim();
  const email = input.email.trim().toLowerCase();
  if (!tenantId || !email.includes("@")) return;

  const db = await getDatabase();
  const tenant = await findTenantById(db, tenantId);
  if (!tenant) return;

  const contract = await readSpaceContract(tenantId);
  if (!contract.contracted.includes("rrhh")) {
    const contractedApps = MENTOR_APPS.filter(
      (id) => contract.contracted.includes(id) || id === "rrhh"
    );
    await writeSpaceContract(tenantId, {
      contractedApps,
      aprendeHoyEntryUrl: contract.aprendeHoyEntryUrl,
    });
    await mongoAppRequestStore().fulfillOpen(tenantId, "rrhh");
  }

  await grantOwnerSpaceAccess({ tenantId, ownerUserId: input.userId }).catch((error: unknown) => {
    console.error(
      "[escritorio] no se pudo crear el usuario master del cliente.",
      tenantId,
      error instanceof Error ? error.message : error
    );
  });
  const membership = await findMembership(input.userId, tenantId);
  const keys = membership?.authorizedApps;
  if (membership && keys && !keys.includes("rrhh")) {
    const authorizedApps: MentorAppId[] = MENTOR_APPS.filter(
      (id) => keys.includes(id) || id === "rrhh"
    );
    await db.collection<IdentityMembership>("identity_memberships").updateOne(
      { _id: membership._id },
      { $set: { authorizedApps, updatedAt: new Date().toISOString() } }
    );
  }

  await provisionRrhhCompany({
    tenantId,
    companyName: tenant.name?.trim() || tenantId,
    email,
    displayName: input.displayName.trim() || email,
  }).catch((error: unknown) => {
    console.error(
      "[escritorio] no se pudo crear la empresa de RR.HH.",
      tenantId,
      error instanceof Error ? error.message : error
    );
  });
}
