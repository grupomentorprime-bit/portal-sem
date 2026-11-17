import "server-only";

import { findTenantById } from "@/core/tenant";
import { ROLE_CODES } from "@/core/identity/roles/codes";
import { hasPlatformOwnerCapability } from "@/core/identity/platform/capability";
import { provisionAprendeHoyCompany } from "@/lib/connect/provision-aprende-hoy";
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

/** Deja la app en el plan y le da la llave al usuario de esa empresa. */
export async function ensureDeskProduct(input: {
  tenantId: string;
  userId: string;
  appId: MentorAppId;
}): Promise<void> {
  const tenantId = input.tenantId.trim();
  if (!tenantId) return;
  const db = await getDatabase();
  const contract = await readSpaceContract(tenantId);
  if (!contract.contracted.includes(input.appId)) {
    const contractedApps = MENTOR_APPS.filter(
      (id) => contract.contracted.includes(id) || id === input.appId
    );
    await writeSpaceContract(tenantId, {
      contractedApps,
      aprendeHoyEntryUrl: contract.aprendeHoyEntryUrl,
    });
    await mongoAppRequestStore().fulfillOpen(tenantId, input.appId);
  }
  const membership = await findMembership(input.userId, tenantId);
  if (!membership) return;
  const keys = membership.authorizedApps;
  if (keys?.includes(input.appId)) return;
  const base = keys ?? contract.contracted;
  const authorizedApps: MentorAppId[] = MENTOR_APPS.filter(
    (id) => base.includes(id) || id === input.appId
  );
  await db.collection<IdentityMembership>("identity_memberships").updateOne(
    { _id: membership._id },
    { $set: { authorizedApps, updatedAt: new Date().toISOString() } }
  );
}

/**
 * Al darle acceso a un cliente: RR.HH. y Aprende Hoy quedan en el plan,
 * el master tiene las llaves y existen la empresa y el usuario master.
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

  await grantOwnerSpaceAccess({ tenantId, ownerUserId: input.userId }).catch((error: unknown) => {
    console.error(
      "[escritorio] no se pudo crear el usuario master del cliente.",
      tenantId,
      error instanceof Error ? error.message : error
    );
  });
  await ensureDeskProduct({ tenantId, userId: input.userId, appId: "rrhh" });
  await ensureDeskProduct({ tenantId, userId: input.userId, appId: "aprende-hoy" });

  const companyName = tenant.name?.trim() || tenantId;
  const displayName = input.displayName.trim() || email;
  void provisionRrhhCompany({ tenantId, companyName, email, displayName }).catch((error: unknown) => {
    console.error(
      "[escritorio] no se pudo crear la empresa de RR.HH.",
      tenantId,
      error instanceof Error ? error.message : error
    );
  });
  void provisionAprendeHoyCompany({ tenantId, companyName, email, displayName }).catch(
    (error: unknown) => {
      console.error(
        "[escritorio] no se pudo crear el perfil de Aprende Hoy.",
        tenantId,
        error instanceof Error ? error.message : error
      );
    }
  );
}
