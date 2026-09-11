import "server-only";

import { NextResponse } from "next/server";
import { loadSessionContext } from "@/lib/identity/sessions";
import type { AuthContext } from "@/types/identity";
import type { PermissionId } from "@/core/identity/permissions/registry";
import { authorize } from "@/core/identity/policies/engine";

async function resolveSessionPermissions(
  tenantId: string,
  membership: import("@/types/identity").IdentityMembership
): Promise<string[]> {
  const { resolvePermissionsForMembership } = await import("@/lib/identity/permission-resolver");
  return resolvePermissionsForMembership(tenantId, membership);
}

/**
 * Tenant del request público: Host → TenantContext (SAAS-002).
 * No confía en ?tenant= del cliente. Sin host (scripts) → fallback singleton.
 * Para Espacio activo autenticado usar sesión / requireAuth / requireActiveTenant.
 */
export async function getActiveTenantId(): Promise<string | null> {
  const { resolveActiveTenantIdFromRequest } = await import("@/core/tenant/context");
  return resolveActiveTenantIdFromRequest();
}

/**
 * Espacio activo de la sesión (activeTenantId) si hay membresía válida.
 * No usa el host — evita que el portal público herede un switch de admin.
 */
export async function getSessionActiveTenantId(): Promise<string | null> {
  const loaded = await loadSessionContext();
  const tenantId = loaded?.session.tenantId?.trim() ?? "";
  if (!tenantId || !loaded?.membership) return null;
  return tenantId;
}

/**
 * Tenant operativo: sesión (admin multi-Espacio) o host (portal / sin sesión).
 */
export async function getOperationalTenantId(): Promise<string | null> {
  return (await getSessionActiveTenantId()) ?? (await getActiveTenantId());
}

async function loadRequiredAuthContext(
  unauthenticatedMessage = "No autenticado."
): Promise<AuthContext | NextResponse> {
  const loaded = await loadSessionContext();
  if (!loaded) {
    return NextResponse.json({ ok: false, error: unauthenticatedMessage }, { status: 401 });
  }

  const activeTenantId = loaded.session.tenantId?.trim() ?? "";
  const permissions =
    loaded.membership && activeTenantId
      ? await resolveSessionPermissions(activeTenantId, loaded.membership)
      : [];

  const { readPlatformRoles } = await import("@/core/identity/platform/capability");

  return {
    user: loaded.user,
    session: loaded.session,
    membership: loaded.membership,
    permissions,
    tenantId: activeTenantId,
    platformRoles: readPlatformRoles(loaded.user),
    compatMode: false,
  };
}

export async function requireAuth(): Promise<AuthContext | NextResponse> {
  return loadRequiredAuthContext();
}

/** Sesión + membresía activa en un Espacio. */
export async function requireSpace(): Promise<AuthContext | NextResponse> {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  if (!ctx.membership || !ctx.tenantId) {
    return NextResponse.json(
      { ok: false, error: "Sin Espacio activo. Elige o solicita acceso a un Espacio." },
      { status: 403 }
    );
  }

  return ctx;
}

export async function requireTenant(
  requestedTenant: string | null | undefined
): Promise<AuthContext | NextResponse> {
  const ctx = await requireSpace();
  if (ctx instanceof NextResponse) return ctx;

  const trimmed = requestedTenant?.trim() ?? "";
  if (!trimmed) {
    return NextResponse.json({ ok: false, error: "tenant es obligatorio." }, { status: 400 });
  }

  if (trimmed !== ctx.tenantId) {
    return NextResponse.json(
      { ok: false, error: "Acceso denegado entre tenants." },
      { status: 403 }
    );
  }

  return ctx;
}

export async function requirePermission(
  permission: PermissionId | string
): Promise<AuthContext | NextResponse> {
  const ctx = await requireSpace();
  if (ctx instanceof NextResponse) return ctx;

  const result = authorize(ctx, permission);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return result.context;
}

export async function requireRole(roleNameOrCode: string): Promise<AuthContext | NextResponse> {
  const ctx = await requireSpace();
  if (ctx instanceof NextResponse) return ctx;

  if (!ctx.membership) {
    return NextResponse.json({ ok: false, error: "Sin membresía activa." }, { status: 403 });
  }

  const { findRolesByIds, getRoleCode } = await import("@/lib/identity/roles");
  const { resolveRoleCode } = await import("@/core/identity/roles/codes");
  const roles = await findRolesByIds(ctx.tenantId, ctx.membership.roleIds);
  const expectedCode = resolveRoleCode(roleNameOrCode);
  const hasRole = roles.some((r) => {
    const code = getRoleCode(r);
    if (expectedCode && code === expectedCode) return true;
    return r.name === roleNameOrCode;
  });

  if (!hasRole) {
    return NextResponse.json(
      { ok: false, error: `Rol requerido: ${roleNameOrCode}` },
      { status: 403 }
    );
  }

  return ctx;
}

/** Valida rol exclusivamente por código oficial */
export async function requireRoleCode(roleCode: string): Promise<AuthContext | NextResponse> {
  return requireRole(roleCode);
}

export async function requireOwner(): Promise<AuthContext | NextResponse> {
  const ctx = await requireSpace();
  if (ctx instanceof NextResponse) return ctx;

  if (!ctx.membership) {
    return NextResponse.json({ ok: false, error: "Sin membresía activa." }, { status: 403 });
  }

  const { getCallerRoleCode } = await import("@/lib/identity/roles");
  const { ROLE_CODES } = await import("@/core/identity/roles/codes");
  const callerCode = await getCallerRoleCode(ctx.tenantId, ctx.membership.roleIds);

  if (callerCode !== ROLE_CODES.SUPER_ADMIN) {
    return NextResponse.json(
      { ok: false, error: "Se requiere rol Super Admin." },
      { status: 403 }
    );
  }

  return ctx;
}

/**
 * Operador de Growth OS. Independiente del Espacio activo.
 * No usa `super_admin`, email, `isSystemAccount` ni membresía de cliente.
 */
export async function requirePlatformOperator(): Promise<AuthContext | NextResponse> {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  const { evaluatePlatformOperatorAccess } = await import(
    "@/core/identity/platform/capability"
  );
  const decision = evaluatePlatformOperatorAccess({
    user: ctx.user,
    session: ctx.session,
    membership: ctx.membership,
    activeTenantId: ctx.tenantId,
  });

  if (!decision.allowed) {
    const { writeAudit } = await import("@/lib/identity/audit");
    await writeAudit({
      scope: "platform",
      userId: ctx.user._id,
      action: "platform.access.denied",
      entity: "platform",
      metadata: { reason: decision.reason },
    });
    return NextResponse.json(
      { ok: false, error: "Se requiere operador de Growth OS." },
      { status: 403 }
    );
  }

  return ctx;
}

/** Sesión real (cookie); nunca inventa un contexto sin autenticar. */
export async function requireSession(): Promise<AuthContext | NextResponse> {
  return loadRequiredAuthContext("Debes iniciar sesión.");
}

export function isAuthContext(value: unknown): value is AuthContext {
  return Boolean(value && typeof value === "object" && "user" in value && "permissions" in value);
}
