import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type { UnitAccess } from "@/core/units/types";
import type { IdentityInvitation } from "@/types/identity";
import { generateId, generateToken } from "@/core/identity/auth/crypto";
import { normalizeEmail } from "@/lib/validation/identity";

/** El enlace para crear contraseña no caduca antes de 12 horas. */
export const INVITATION_TTL_MINUTES = 12 * 60;
export const INVITATION_TTL_MAX_MINUTES = 12 * 60;

export function invitationTtlMinutes(requested?: number): number {
  const floor = INVITATION_TTL_MINUTES;
  const ceiling = Math.max(INVITATION_TTL_MAX_MINUTES, floor);
  const value = requested ?? floor;
  return Math.min(Math.max(value, floor), ceiling);
}

export async function createInvitation(input: {
  tenantId: string;
  email: string;
  displayName: string;
  roleIds: string[];
  invitedBy: string;
  unitAccess?: UnitAccess;
  expiresInMinutes?: number;
  authorizedApps?: IdentityInvitation["authorizedApps"];
}): Promise<IdentityInvitation> {
  const db = await getDatabase();
  const email = normalizeEmail(input.email);
  const displayName = input.displayName.trim();

  const existingPending = await findPendingInvitationByEmail(input.tenantId, email);
  if (existingPending) {
    throw new Error("Ya existe una invitación pendiente para este correo.");
  }

  const now = new Date().toISOString();
  const ttlMinutes = invitationTtlMinutes(input.expiresInMinutes);
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + ttlMinutes);

  const invitation: IdentityInvitation = {
    _id: generateId("inv"),
    tenantId: input.tenantId,
    email,
    displayName,
    roleIds: input.roleIds,
    ...(input.authorizedApps ? { authorizedApps: input.authorizedApps } : {}),
    ...(input.unitAccess ? { unitAccess: input.unitAccess } : {}),
    token: generateToken(24),
    status: "pending",
    invitedBy: input.invitedBy,
    expiresAt: expires.toISOString(),
    createdAt: now,
  };

  await db.collection<IdentityInvitation>("identity_invitations").insertOne(invitation);
  return invitation;
}

/** Nombres de invitación de este correo, del más nuevo al más viejo. */
export async function listInvitationDisplayNames(
  tenantId: string,
  email: string
): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db
    .collection<IdentityInvitation>("identity_invitations")
    .find({ tenantId, email: normalizeEmail(email) })
    .project<{ displayName?: string }>({ displayName: 1 })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();
  return rows.map((row) => row.displayName?.trim() || "").filter(Boolean);
}

/** Nombre más reciente escrito al invitar a este correo en el Espacio. */
export async function findLatestInvitationDisplayName(
  tenantId: string,
  email: string
): Promise<string> {
  const names = await listInvitationDisplayNames(tenantId, email);
  return names[0] ?? "";
}

export async function findPendingInvitationByEmail(
  tenantId: string,
  email: string
): Promise<IdentityInvitation | null> {
  const db = await getDatabase();
  return db.collection<IdentityInvitation>("identity_invitations").findOne({
    tenantId,
    email: normalizeEmail(email),
    status: "pending",
    expiresAt: { $gt: new Date().toISOString() },
  });
}

/** Invitaciones pendientes vigentes para un correo (cualquier Espacio). */
export async function findPendingInvitationsByEmail(
  email: string
): Promise<IdentityInvitation[]> {
  const db = await getDatabase();
  return db
    .collection<IdentityInvitation>("identity_invitations")
    .find({
      email: normalizeEmail(email),
      status: "pending",
      expiresAt: { $gt: new Date().toISOString() },
    })
    .toArray();
}

export async function listInvitationsByTenant(
  tenantId: string
): Promise<IdentityInvitation[]> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  return db
    .collection<IdentityInvitation>("identity_invitations")
    .find({ tenantId, status: "pending", expiresAt: { $gt: now } })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function findInvitationById(
  invitationId: string,
  tenantId: string
): Promise<IdentityInvitation | null> {
  const db = await getDatabase();
  return db.collection<IdentityInvitation>("identity_invitations").findOne({
    _id: invitationId,
    tenantId,
  });
}

export async function findInvitationByToken(
  token: string
): Promise<IdentityInvitation | null> {
  const db = await getDatabase();
  return db.collection<IdentityInvitation>("identity_invitations").findOne({
    token,
    status: "pending",
    expiresAt: { $gt: new Date().toISOString() },
  });
}

export async function acceptInvitation(
  invitationId: string,
  userId: string,
  tenantId: string
): Promise<void> {
  const db = await getDatabase();
  await db.collection<IdentityInvitation>("identity_invitations").updateOne(
    { _id: invitationId, tenantId },
    {
      $set: {
        status: "accepted",
        acceptedAt: new Date().toISOString(),
        acceptedBy: userId,
      },
    }
  );
}

export function serializeInvitationWithoutToken(invitation: IdentityInvitation) {
  return {
    _id: invitation._id,
    tenantId: invitation.tenantId,
    email: invitation.email,
    displayName: invitation.displayName,
    roleIds: invitation.roleIds,
    unitAccess: invitation.unitAccess,
    status: invitation.status,
    invitedBy: invitation.invitedBy,
    expiresAt: invitation.expiresAt,
    acceptedAt: invitation.acceptedAt,
    acceptedBy: invitation.acceptedBy,
    createdAt: invitation.createdAt,
  };
}

/** Nuevo enlace y nueva vigencia. El token anterior deja de servir. */
export async function renewInvitationToken(
  invitationId: string,
  tenantId: string
): Promise<IdentityInvitation | null> {
  const db = await getDatabase();
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + invitationTtlMinutes());

  return db.collection<IdentityInvitation>("identity_invitations").findOneAndUpdate(
    { _id: invitationId, tenantId, status: "pending" },
    {
      $set: {
        token: generateToken(24),
        expiresAt: expires.toISOString(),
      },
    },
    { returnDocument: "after" }
  );
}

export async function setInvitationUnitAccess(
  invitationId: string,
  tenantId: string,
  unitAccess: UnitAccess
): Promise<void> {
  const db = await getDatabase();
  await db.collection<IdentityInvitation>("identity_invitations").updateOne(
    { _id: invitationId, tenantId },
    { $set: { unitAccess } }
  );
}

export async function revokeInvitation(
  invitationId: string,
  tenantId: string
): Promise<void> {
  const db = await getDatabase();
  await db.collection<IdentityInvitation>("identity_invitations").updateOne(
    { _id: invitationId, tenantId },
    {
      $set: {
        status: "revoked",
      },
    }
  );
}
