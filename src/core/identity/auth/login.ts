import "server-only";

import { hashPassword, verifyPassword } from "@/core/identity/auth/crypto";
import {
  createSession,
  getRequestMeta,
  setSessionCookie,
} from "@/lib/identity/sessions";
import {
  createUser,
  findUserByEmail,
  getEmailCredential,
  updateUserLastLogin,
} from "@/lib/identity/users";
import { findMembership } from "@/lib/identity/memberships";
import { createMembership } from "@/lib/identity/memberships";
import { ensureTenantRoles, getOwnerRole } from "@/lib/identity/roles";
import { writeAudit } from "@/lib/identity/audit";
import type { IdentityUser } from "@/types/identity";

export async function loginWithEmail(input: {
  email: string;
  password: string;
  tenantId: string;
}): Promise<{ ok: true; user: IdentityUser } | { ok: false; error: string }> {
  const user = await findUserByEmail(input.email);
  if (!user || user.status !== "active") {
    return { ok: false, error: "Credenciales inválidas." };
  }

  const credential = await getEmailCredential(user._id);
  if (!credential?.passwordHash) {
    return { ok: false, error: "Credenciales inválidas." };
  }

  const valid = await verifyPassword(input.password, credential.passwordHash);
  if (!valid) {
    return { ok: false, error: "Credenciales inválidas." };
  }

  const membership = await findMembership(user._id, input.tenantId);
  if (!membership) {
    return { ok: false, error: "Sin acceso a este tenant." };
  }

  const meta = await getRequestMeta();
  const session = await createSession({
    userId: user._id,
    tenantId: input.tenantId,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  await setSessionCookie(session._id);
  await updateUserLastLogin(user._id);
  await writeAudit({
    tenantId: input.tenantId,
    userId: user._id,
    action: "auth.login",
    entity: "session",
    entityId: session._id,
  });

  return { ok: true, user };
}

export async function registerWithEmail(input: {
  email: string;
  password: string;
  displayName: string;
  tenantId: string;
  roleIds?: string[];
}): Promise<{ ok: true; user: IdentityUser } | { ok: false; error: string }> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    return { ok: false, error: "El email ya está registrado." };
  }

  if (input.password.length < 8) {
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };
  }

  await ensureTenantRoles(input.tenantId);
  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    email: input.email,
    displayName: input.displayName,
    passwordHash,
  });

  const ownerRole = await getOwnerRole(input.tenantId);
  const roleIds = input.roleIds ?? (ownerRole ? [ownerRole._id] : []);

  await createMembership({
    tenantId: input.tenantId,
    userId: user._id,
    roleIds,
  });

  const meta = await getRequestMeta();
  const session = await createSession({
    userId: user._id,
    tenantId: input.tenantId,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  await setSessionCookie(session._id);
  await writeAudit({
    tenantId: input.tenantId,
    userId: user._id,
    action: "user.register",
    entity: "user",
    entityId: user._id,
  });

  return { ok: true, user };
}

export async function logoutCurrentSession(): Promise<void> {
  const { getSessionIdFromCookie, deleteSession, clearSessionCookie } = await import(
    "@/lib/identity/sessions"
  );
  const sessionId = await getSessionIdFromCookie();
  if (sessionId) await deleteSession(sessionId);
  await clearSessionCookie();
}
