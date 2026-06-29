import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type { IdentityCredential, IdentityUser } from "@/types/identity";
import { generateId } from "@/core/identity/auth/crypto";

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

export async function listUsersByIds(ids: string[]): Promise<IdentityUser[]> {
  if (!ids.length) return [];
  const db = await getDatabase();
  return db.collection<IdentityUser>("identity_users").find({ _id: { $in: ids } }).toArray();
}
