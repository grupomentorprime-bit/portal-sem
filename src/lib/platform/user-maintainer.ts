import "server-only";

import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { PLATFORM_ROLE_CODES, type PlatformRoleCode } from "@/core/identity/platform/codes";
import type { PortalRoleCode } from "@/core/identity/roles/codes";
import { getDatabase } from "@/lib/mongodb";
import { createMembership } from "@/lib/identity/memberships";
import { ensureTenantRoles, findRoleByCode } from "@/lib/identity/roles";
import { createUser, findUserByEmail, findUserById } from "@/lib/identity/users";
import { generateId } from "@/core/identity/auth/crypto";
import type { IdentityCredential, IdentityUser } from "@/types/identity";
import {
  deleteKeycloakUserByEmail,
  setKeycloakPasswordForInvite,
  setKeycloakUserEnabled,
} from "@/lib/identity/keycloak-admin";
import { deleteUserSessions } from "@/lib/identity/sessions";
import { writeAudit } from "@/lib/identity/audit";
import { labelPlatformRole, labelSpaceRole } from "@/lib/platform/space-labels";
import { listPlatformSpaceNames } from "@/lib/platform/spaces";
import {
  labelOwnerProfile,
  profileNeedsSpace,
  type MaintainedUserRow,
  type OwnerProfileId,
} from "@/lib/platform/user-profiles";

const scryptAsync = promisify(scrypt);

function temporaryPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(16);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

async function hashPassword(value: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(value, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function listMaintainedUsers(): Promise<MaintainedUserRow[]> {
  const db = await getDatabase();
  const [users, memberships, roles, spaces] = await Promise.all([
    db
      .collection<IdentityUser>("identity_users")
      .find(
        {},
        {
          projection: {
            email: 1,
            displayName: 1,
            status: 1,
            platformRoles: 1,
            isSystemAccount: 1,
            avatarPresetId: 1,
            avatarPhoto: 1,
            avatarPhotoUpdatedAt: 1,
          },
        }
      )
      .toArray(),
    db
      .collection("identity_memberships")
      .find({ status: "active" }, { projection: { userId: 1, tenantId: 1, roleIds: 1 } })
      .toArray(),
    db.collection("identity_roles").find({}, { projection: { code: 1, tenantId: 1 } }).toArray(),
    listPlatformSpaceNames(),
  ]);
  const spaceName = new Map(spaces.map((space) => [space.tenantId, space.name]));
  const roleCode = new Map(roles.map((role) => [String(role._id), String(role.code || "")]));

  return users
    .map((user) => {
      const platformRoles = Array.isArray(user.platformRoles)
        ? (user.platformRoles as PlatformRoleCode[])
        : [];
      const platformLabel = platformRoles.length > 0 ? labelPlatformRole(platformRoles) : null;
      const platformRole = platformRoles.includes(PLATFORM_ROLE_CODES.OWNER)
        ? PLATFORM_ROLE_CODES.OWNER
        : platformRoles.includes(PLATFORM_ROLE_CODES.OPERATOR)
          ? PLATFORM_ROLE_CODES.OPERATOR
          : null;
      const own = memberships.filter((row) => String(row.userId) === String(user._id));
      const seenTenants = new Set<string>();
      const places = own.flatMap((row) => {
        const tenantId = String(row.tenantId);
        if (seenTenants.has(tenantId)) return [];
        seenTenants.add(tenantId);
        const code = (row.roleIds || []).map((id: string) => roleCode.get(String(id))).find(Boolean);
        return [
          {
            tenantId,
            spaceName: spaceName.get(tenantId) || tenantId,
            roleLabel: labelSpaceRole(code),
          },
        ];
      });
      const placeLabel =
        places.length === 1
          ? places[0].roleLabel
          : places.map((place) => `${place.spaceName}: ${place.roleLabel}`).join(" · ");
      const profile = platformLabel || placeLabel || "Sin perfil";
      return {
        id: String(user._id),
        email: String(user.email || ""),
        displayName: String(user.displayName || user.email || ""),
        avatarPresetId: typeof user.avatarPresetId === "string" ? user.avatarPresetId : null,
        avatarPhoto: user.avatarPhoto === true,
        avatarPhotoUpdatedAt:
          typeof user.avatarPhotoUpdatedAt === "string" ? user.avatarPhotoUpdatedAt : null,
        profile,
        status: String(user.status || "active"),
        platformLabel,
        platformRole,
        reserved: user.isSystemAccount === true,
        memberships: places,
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "es"));
}

export async function createMaintainedUser(input: {
  actorUserId: string;
  displayName: string;
  email: string;
  profile: OwnerProfileId;
  tenantId?: string | null;
}): Promise<{ email: string; displayName: string; profile: string; password: string }> {
  const email = input.email.toLowerCase().trim();
  const displayName = input.displayName.trim();
  if (!displayName || !email.includes("@")) {
    throw new Error("Nombre y correo son obligatorios.");
  }
  if (await findUserByEmail(email)) {
    throw new Error("Ese correo ya tiene cuenta.");
  }

  const needsSpace = profileNeedsSpace(input.profile);
  const tenantId = input.tenantId?.trim() || "";
  if (needsSpace && !tenantId) {
    throw new Error("Elige el Espacio de ese perfil.");
  }

  let roleId: string | null = null;
  if (needsSpace) {
    await ensureTenantRoles(tenantId);
    const role = await findRoleByCode(tenantId, input.profile as PortalRoleCode);
    if (!role) throw new Error("Ese perfil no existe en el Espacio.");
    roleId = String(role._id);
  }

  const plain = temporaryPassword();
  const user = await createUser({
    email,
    displayName,
    emailVerified: true,
    passwordHash: await hashPassword(plain),
  });

  const db = await getDatabase();
  const now = new Date().toISOString();
  try {
    if (!needsSpace) {
      const platformRole: PlatformRoleCode =
        input.profile === PLATFORM_ROLE_CODES.OWNER
          ? PLATFORM_ROLE_CODES.OWNER
          : PLATFORM_ROLE_CODES.OPERATOR;
      await db.collection<IdentityUser>("identity_users").updateOne(
        { _id: user._id },
        { $set: { platformRoles: [platformRole], updatedAt: now } }
      );
    } else if (roleId) {
      await createMembership({
        tenantId,
        userId: user._id,
        roleIds: [roleId],
        invitedBy: input.actorUserId,
      });
    }

    const keycloak = await setKeycloakPasswordForInvite({ email, displayName, password: plain });
    if (!keycloak.ok) {
      throw new Error(keycloak.error);
    }
  } catch (error) {
    await db.collection("identity_memberships").deleteMany({ userId: user._id });
    await db.collection("identity_credentials").deleteMany({ userId: user._id });
    await db.collection<IdentityUser>("identity_users").deleteOne({ _id: user._id });
    throw error instanceof Error ? error : new Error("No se pudo crear el usuario.");
  }

  await writeAudit({
    scope: "platform",
    userId: input.actorUserId,
    action: "platform.user.create",
    entity: "user",
    entityId: user._id,
    metadata: { email, profile: input.profile, tenantId: tenantId || null },
  });

  return {
    email,
    displayName,
    profile: labelOwnerProfile(input.profile),
    password: plain,
  };
}

/** Cuenta existente: nueva contraseña. La anterior deja de servir. Se muestra una sola vez. */
export async function resendMaintainedUserAccess(input: {
  actorUserId: string;
  userId: string;
}): Promise<{ email: string; displayName: string; password: string }> {
  const userId = input.userId.trim();
  const user = userId ? await findUserById(userId) : null;
  if (!user?.email) {
    throw new Error("No encontramos esa cuenta.");
  }
  if (user.status !== "active") {
    throw new Error("Esa cuenta no tiene acceso.");
  }

  const plain = temporaryPassword();
  const keycloak = await setKeycloakPasswordForInvite({
    email: user.email,
    displayName: user.displayName || user.email,
    password: plain,
  });
  if (!keycloak.ok) {
    throw new Error(keycloak.error);
  }

  const db = await getDatabase();
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(plain);
  const credentials = db.collection<IdentityCredential>("identity_credentials");
  const existing = await credentials.findOne({ userId: user._id, provider: "email" });
  if (existing) {
    await credentials.updateOne(
      { _id: existing._id },
      { $set: { passwordHash, updatedAt: now } }
    );
  } else {
    const credential: IdentityCredential = {
      _id: generateId("cred"),
      userId: user._id,
      provider: "email",
      providerUserId: user.email,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };
    await credentials.insertOne(credential);
  }

  await writeAudit({
    scope: "platform",
    userId: input.actorUserId,
    action: "platform.user.resend",
    entity: "user",
    entityId: user._id,
    metadata: { email: user.email },
  });

  return {
    email: user.email,
    displayName: user.displayName || user.email,
    password: plain,
  };
}

function isPlatformOwner(user: IdentityUser): boolean {
  return (user.platformRoles ?? []).includes(PLATFORM_ROLE_CODES.OWNER);
}

async function activeOwnerIds(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db
    .collection<IdentityUser>("identity_users")
    .find(
      { status: "active", platformRoles: PLATFORM_ROLE_CODES.OWNER },
      { projection: { _id: 1 } }
    )
    .toArray();
  return rows.map((row) => String(row._id));
}

/** Quitar dueño, suspenderlo o borrarlo dejaría la plataforma sin un dueño activo. */
async function wouldLeaveWithoutOwner(user: IdentityUser): Promise<boolean> {
  if (!isPlatformOwner(user)) return false;
  const others = (await activeOwnerIds()).filter((id) => id !== user._id);
  return others.length === 0;
}

async function requirePlatformAccount(userId: string): Promise<IdentityUser> {
  const user = userId ? await findUserById(userId) : null;
  if (!user?.email) throw new Error("No encontramos esa cuenta.");
  if (!user.platformRoles?.length) throw new Error("Esa cuenta no es de la plataforma.");
  return user;
}

export async function updateMaintainedPlatformUser(input: {
  actorUserId: string;
  userId: string;
  displayName: string;
  profile: "platform_owner" | "platform_operator";
}): Promise<void> {
  const user = await requirePlatformAccount(input.userId.trim());
  const displayName = input.displayName.trim();
  if (!displayName) throw new Error("El nombre es obligatorio.");
  if (input.profile !== PLATFORM_ROLE_CODES.OWNER && (await wouldLeaveWithoutOwner(user))) {
    throw new Error("Tiene que quedar un dueño activo.");
  }

  const db = await getDatabase();
  await db.collection<IdentityUser>("identity_users").updateOne(
    { _id: user._id },
    {
      $set: {
        displayName,
        platformRoles: [input.profile],
        updatedAt: new Date().toISOString(),
      },
    }
  );
  await writeAudit({
    scope: "platform",
    userId: input.actorUserId,
    action: "platform.user.update",
    entity: "user",
    entityId: user._id,
    metadata: { email: user.email, profile: input.profile },
  });
}

export async function setMaintainedUserAccess(input: {
  actorUserId: string;
  userId: string;
  status: "active" | "suspended";
}): Promise<void> {
  const user = await requirePlatformAccount(input.userId.trim());
  if (user._id === input.actorUserId) {
    throw new Error("No puedes cambiar el acceso de tu propia cuenta.");
  }
  if (user.isSystemAccount) throw new Error("Esa cuenta está reservada.");
  if (input.status === "suspended" && (await wouldLeaveWithoutOwner(user))) {
    throw new Error("Tiene que quedar un dueño activo.");
  }

  const enabled = input.status === "active";
  const keycloak = await setKeycloakUserEnabled(user.email, enabled);
  if (!keycloak.ok) throw new Error(keycloak.error);

  const db = await getDatabase();
  await db.collection<IdentityUser>("identity_users").updateOne(
    { _id: user._id },
    { $set: { status: input.status, updatedAt: new Date().toISOString() } }
  );
  if (!enabled) await deleteUserSessions(user._id);
  await writeAudit({
    scope: "platform",
    userId: input.actorUserId,
    action: enabled ? "platform.user.activate" : "platform.user.suspend",
    entity: "user",
    entityId: user._id,
    metadata: { email: user.email },
  });
}

export async function deleteMaintainedPlatformUser(input: {
  actorUserId: string;
  userId: string;
}): Promise<void> {
  const user = await requirePlatformAccount(input.userId.trim());
  if (user._id === input.actorUserId) {
    throw new Error("No puedes eliminar tu propia cuenta.");
  }
  if (user.isSystemAccount) throw new Error("Esa cuenta está reservada.");
  if (await wouldLeaveWithoutOwner(user)) {
    throw new Error("Tiene que quedar un dueño activo.");
  }

  const keycloak = await deleteKeycloakUserByEmail(user.email);
  if (!keycloak.ok) throw new Error(keycloak.error);

  const db = await getDatabase();
  await deleteUserSessions(user._id);
  await db.collection("identity_memberships").deleteMany({ userId: user._id });
  await db.collection("identity_credentials").deleteMany({ userId: user._id });
  await db.collection<IdentityUser>("identity_users").deleteOne({ _id: user._id });
  await writeAudit({
    scope: "platform",
    userId: input.actorUserId,
    action: "platform.user.delete",
    entity: "user",
    entityId: user._id,
    metadata: { email: user.email },
  });
}
