import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";
import { getDatabase } from "@/lib/mongodb";
import type {
  IdentityMembership,
  IdentitySession,
  IdentityUser,
} from "@/types/identity";
import { SESSION_COOKIE, isSecureCookieFromHeaders } from "@/core/identity/auth/config";
import { generateId } from "@/core/identity/auth/crypto";

export async function createSession(input: {
  userId: string;
  tenantId: string;
  ip?: string;
  userAgent?: string;
}): Promise<IdentitySession> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  const session: IdentitySession = {
    _id: generateId("sess"),
    userId: input.userId,
    tenantId: input.tenantId,
    ip: input.ip,
    userAgent: input.userAgent,
    createdAt: now,
    expiresAt: expires.toISOString(),
    lastActivity: now,
  };

  await db.collection<IdentitySession>("identity_sessions").insertOne(session);
  return session;
}

export async function getSessionById(id: string): Promise<IdentitySession | null> {
  const db = await getDatabase();
  const session = await db.collection<IdentitySession>("identity_sessions").findOne({
    _id: id,
    expiresAt: { $gt: new Date().toISOString() },
  });
  return session;
}

export async function touchSession(id: string): Promise<void> {
  const db = await getDatabase();
  await db.collection<IdentitySession>("identity_sessions").updateOne(
    { _id: id },
    { $set: { lastActivity: new Date().toISOString() } }
  );
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDatabase();
  await db.collection<IdentitySession>("identity_sessions").deleteOne({ _id: id });
}

export async function deleteUserSessions(userId: string): Promise<void> {
  const db = await getDatabase();
  await db.collection<IdentitySession>("identity_sessions").deleteMany({ userId });
}

export async function setSessionCookie(sessionId: string): Promise<void> {
  const jar = await cookies();
  const h = await headers();
  jar.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: isSecureCookieFromHeaders(h),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSessionIdFromCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}

export async function getRequestMeta(): Promise<{ ip?: string; userAgent?: string }> {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? undefined,
    userAgent: h.get("user-agent") ?? undefined,
  };
}

const SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1000;

async function touchSessionIfStale(session: IdentitySession): Promise<void> {
  const lastActivity = new Date(session.lastActivity).getTime();
  if (Date.now() - lastActivity < SESSION_TOUCH_INTERVAL_MS) return;
  await touchSession(session._id);
}

export const loadSessionContext = cache(async (): Promise<{
  session: IdentitySession;
  user: IdentityUser;
  membership: IdentityMembership | null;
} | null> => {
  const sessionId = await getSessionIdFromCookie();
  if (!sessionId) return null;

  const session = await getSessionById(sessionId);
  if (!session) return null;

  const db = await getDatabase();
  const user = await db.collection<IdentityUser>("identity_users").findOne({
    _id: session.userId,
    status: "active",
  });
  if (!user) return null;

  const membership = await db.collection<IdentityMembership>("identity_memberships").findOne({
    userId: session.userId,
    tenantId: session.tenantId,
    status: "active",
  });

  await touchSessionIfStale(session);
  return { session, user, membership };
});
