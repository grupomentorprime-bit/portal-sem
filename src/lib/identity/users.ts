import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type { IdentityCredential, IdentityUser } from "@/types/identity";
import { generateId, hashPassword, verifyPassword } from "@/core/identity/auth/crypto";

export async function findUserByEmail(email: string): Promise<IdentityUser | null> {
  const db = await getDatabase();
  return db.collection<IdentityUser>("identity_users").findOne({
    email: email.toLowerCase().trim(),
  });
}

export async function findUserById(id: string): Promise<IdentityUser | null> {
  const db = await getDatabase();
  return db.collection<IdentityUser>("identity_users").findOne({ _id: id });
}

export async function createUser(input: {
  email: string;
  displayName: string;
  passwordHash?: string;
  emailVerified?: boolean;
}): Promise<IdentityUser> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const userId = generateId("user");

  const user: IdentityUser = {
    _id: userId,
    email: input.email.toLowerCase().trim(),
    emailVerified: input.emailVerified ?? false,
    displayName: input.displayName.trim(),
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<IdentityUser>("identity_users").insertOne(user);

  if (input.passwordHash) {
    const credential: IdentityCredential = {
      _id: generateId("cred"),
      userId,
      provider: "email",
      providerUserId: user.email,
      passwordHash: input.passwordHash,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection<IdentityCredential>("identity_credentials").insertOne(credential);
  }

  return user;
}

export async function updateUserLastLogin(userId: string): Promise<void> {
  const db = await getDatabase();
  await db.collection<IdentityUser>("identity_users").updateOne(
    { _id: userId },
    { $set: { lastLoginAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }
  );
}

export async function getEmailCredential(userId: string): Promise<IdentityCredential | null> {
  const db = await getDatabase();
  return db.collection<IdentityCredential>("identity_credentials").findOne({
    userId,
    provider: "email",
  });
}

export async function findOidcCredential(
  providerUserId: string
): Promise<IdentityCredential | null> {
  const db = await getDatabase();
  return db.collection<IdentityCredential>("identity_credentials").findOne({
    provider: "oidc",
    providerUserId,
  });
}

export async function upsertOidcCredential(input: {
  userId: string;
  providerUserId: string;
  providerData?: Record<string, unknown>;
}): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const existing = await db.collection<IdentityCredential>("identity_credentials").findOne({
    userId: input.userId,
    provider: "oidc",
  });

  if (existing) {
    await db.collection<IdentityCredential>("identity_credentials").updateOne(
      { _id: existing._id },
      {
        $set: {
          providerUserId: input.providerUserId,
          providerData: input.providerData,
          updatedAt: now,
        },
      }
    );
    return;
  }

  const credential: IdentityCredential = {
    _id: generateId("cred"),
    userId: input.userId,
    provider: "oidc",
    providerUserId: input.providerUserId,
    providerData: input.providerData,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection<IdentityCredential>("identity_credentials").insertOne(credential);
}

export async function listUsersByIds(ids: string[]): Promise<IdentityUser[]> {
  if (!ids.length) return [];
  const db = await getDatabase();
  return db.collection<IdentityUser>("identity_users").find({ _id: { $in: ids } }).toArray();
}

export async function updateUserProfile(
  userId: string,
  input: {
    displayName?: string;
    jobTitle?: string;
    phone?: string;
    timezone?: string;
    locale?: string;
  }
): Promise<IdentityUser | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const updates: Partial<IdentityUser> = { updatedAt: now };

  if (input.displayName !== undefined) updates.displayName = input.displayName.trim();
  if (input.jobTitle !== undefined) updates.jobTitle = input.jobTitle.trim();
  if (input.phone !== undefined) updates.phone = input.phone.trim();
  if (input.timezone !== undefined) updates.timezone = input.timezone;
  if (input.locale !== undefined) updates.locale = input.locale;

  await db.collection<IdentityUser>("identity_users").updateOne(
    { _id: userId },
    { $set: updates }
  );
  return findUserById(userId);
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (newPassword.length < 8) {
    return { ok: false, error: "La contraseña nueva debe tener al menos 8 caracteres." };
  }

  const credential = await getEmailCredential(userId);
  if (!credential?.passwordHash) {
    return { ok: false, error: "No hay credencial de email para este usuario." };
  }

  const valid = await verifyPassword(currentPassword, credential.passwordHash);
  if (!valid) {
    return { ok: false, error: "La contraseña actual no es correcta." };
  }

  const db = await getDatabase();
  const passwordHash = await hashPassword(newPassword);
  await db.collection<IdentityCredential>("identity_credentials").updateOne(
    { userId, provider: "email" },
    { $set: { passwordHash, updatedAt: new Date().toISOString() } }
  );

  return { ok: true };
}

export async function markUserAsSystemAccount(userId: string): Promise<void> {
  const db = await getDatabase();
  await db.collection<IdentityUser>("identity_users").updateOne(
    { _id: userId },
    { $set: { isSystemAccount: true, updatedAt: new Date().toISOString() } }
  );
}
