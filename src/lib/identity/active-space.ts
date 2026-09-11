import "server-only";

import { PLATFORM_SPACE_FALLBACK } from "@/core/branding";
import { getDatabase } from "@/lib/mongodb";
import { TENANTS_COLLECTION } from "@/core/tenant/constants";
import type { TenantDocument } from "@/core/tenant/types";
import type { IdentityMembership, IdentitySession } from "@/types/identity";
import { listMembershipsByUser, findMembership } from "@/lib/identity/memberships";
import { pickActiveTenantId } from "@/core/identity/spaces/pick-active-tenant";

export { pickActiveTenantId };

/** Espacio disponible para una cuenta (membresía activa + metadatos del Tenant). */
export interface AvailableSpace {
  tenantId: string;
  name: string;
  slug: string;
  status: TenantDocument["status"] | "unknown";
  membershipId: string;
}

export async function listAvailableSpacesForUser(
  userId: string
): Promise<AvailableSpace[]> {
  const memberships = await listMembershipsByUser(userId);
  if (memberships.length === 0) return [];

  const db = await getDatabase();
  const tenantIds = memberships.map((m) => m.tenantId);
  const tenants = await db
    .collection<TenantDocument>(TENANTS_COLLECTION)
    .find({
      $or: [{ _id: { $in: tenantIds } }, { tenantId: { $in: tenantIds } }],
    })
    .toArray();

  const byId = new Map<string, TenantDocument>();
  for (const t of tenants) {
    byId.set(t.tenantId, t);
    byId.set(t._id, t);
  }

  return memberships
    .map((m) => {
      const tenant = byId.get(m.tenantId);
      return {
        tenantId: m.tenantId,
        name: tenant?.name?.trim() || PLATFORM_SPACE_FALLBACK,
        slug: tenant?.slug?.trim() || m.tenantId,
        status: tenant?.status ?? "unknown",
        membershipId: m._id,
      } satisfies AvailableSpace;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

/**
 * Resuelve el Espacio activo de la cuenta.
 * Solo membresías `active`; preferred debe ser membresía válida.
 */
export async function resolveActiveTenantForUser(
  userId: string,
  preferredTenantId?: string | null
): Promise<{
  activeTenantId: string | null;
  membership: IdentityMembership | null;
  spaces: AvailableSpace[];
}> {
  const memberships = await listMembershipsByUser(userId);
  const spaces = await listAvailableSpacesForUser(userId);
  const activeTenantId = pickActiveTenantId(memberships, preferredTenantId);
  if (!activeTenantId) {
    return { activeTenantId: null, membership: null, spaces };
  }
  const membership =
    memberships.find((m) => m.tenantId === activeTenantId) ??
    (await findMembership(userId, activeTenantId));
  return { activeTenantId, membership, spaces };
}

/** Valida membresía activa antes de usar un Espacio (anti-spoof). */
export async function assertActiveMembership(
  userId: string,
  tenantId: string
): Promise<IdentityMembership | null> {
  const trimmed = tenantId.trim();
  if (!trimmed) return null;
  return findMembership(userId, trimmed);
}

export async function updateSessionActiveTenant(
  sessionId: string,
  activeTenantId: string
): Promise<IdentitySession | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.collection<IdentitySession>("identity_sessions").updateOne(
    { _id: sessionId },
    { $set: { tenantId: activeTenantId, lastActivity: now } }
  );
  return db.collection<IdentitySession>("identity_sessions").findOne({ _id: sessionId });
}

/**
 * Si session.tenantId ya no tiene membresía activa, elige otro válido
 * y persiste. Cero membresías → limpia activeTenantId (string vacío).
 */
export async function reconcileSessionActiveTenant(session: IdentitySession): Promise<{
  session: IdentitySession;
  membership: IdentityMembership | null;
  recovered: boolean;
}> {
  const currentId = session.tenantId?.trim() ?? "";
  if (currentId) {
    const current = await findMembership(session.userId, currentId);
    if (current) {
      return { session, membership: current, recovered: false };
    }
  }

  const resolved = await resolveActiveTenantForUser(session.userId, null);
  const nextId = resolved.activeTenantId ?? "";
  if (nextId === currentId) {
    return { session, membership: resolved.membership, recovered: false };
  }

  const updated = await updateSessionActiveTenant(session._id, nextId);
  return {
    session: updated ?? { ...session, tenantId: nextId },
    membership: resolved.membership,
    recovered: true,
  };
}
