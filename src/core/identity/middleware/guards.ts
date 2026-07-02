import "server-only";

import { NextResponse } from "next/server";
import { getSiteConfigUncached } from "@/lib/cms/config";
import { loadSessionContext } from "@/lib/identity/sessions";
import { resolvePermissionsForRoles } from "@/lib/identity/roles";
import { isIdentityEnforced } from "@/core/identity/auth/config";
import { createCompatContext } from "@/core/identity/policies/engine";
import type { AuthContext } from "@/types/identity";
import type { PermissionId } from "@/core/identity/permissions/registry";
import { authorize } from "@/core/identity/policies/engine";

export async function getActiveTenantId(): Promise<string | null> {
  const config = await getSiteConfigUncached();
  return config?.institution.tenant?.trim() || null;
}

export async function requireAuth(): Promise<AuthContext | NextResponse> {
  const tenantId = await getActiveTenantId();
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "Tenant no configurado." }, { status: 503 });
  }

  if (!isIdentityEnforced()) {
    return createCompatContext(tenantId);
  }

  const loaded = await loadSessionContext();
  if (!loaded) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const permissions = loaded.membership
    ? await resolvePermissionsForRoles(loaded.session.tenantId, loaded.membership.roleIds)
    : [];

  return {
    user: loaded.user,
    session: loaded.session,
    membership: loaded.membership,
    permissions,
    tenantId: loaded.session.tenantId,
    compatMode: false,
  };
}

export async function requireTenant(
  requestedTenant: string | null | undefined
): Promise<AuthContext | NextResponse> {
  const ctx = await requireAuth();
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
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  const result = authorize(ctx, permission);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return result.context;
}

export async function requireRole(roleName: string): Promise<AuthContext | NextResponse> {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  if (ctx.compatMode) return ctx;

  if (!ctx.membership) {
    return NextResponse.json({ ok: false, error: "Sin membresía activa." }, { status: 403 });
  }

  const { findRolesByIds } = await import("@/lib/identity/roles");
  const roles = await findRolesByIds(ctx.tenantId, ctx.membership.roleIds);
  const hasRole = roles.some((r) => r.name === roleName);

  if (!hasRole) {
    return NextResponse.json(
      { ok: false, error: `Rol requerido: ${roleName}` },
      { status: 403 }
    );
  }

  return ctx;
}

export async function requireOwner(): Promise<AuthContext | NextResponse> {
  return requireRole("Tenant Owner");
}

/** Sesión real (cookie); no devuelve contexto compat ficticio. */
export async function requireSession(): Promise<AuthContext | NextResponse> {
  const tenantId = await getActiveTenantId();
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "Tenant no configurado." }, { status: 503 });
  }

  const loaded = await loadSessionContext();
  if (!loaded) {
    return NextResponse.json({ ok: false, error: "Debes iniciar sesión." }, { status: 401 });
  }

  const permissions = loaded.membership
    ? await resolvePermissionsForRoles(loaded.session.tenantId, loaded.membership.roleIds)
    : [];

  return {
    user: loaded.user,
    session: loaded.session,
    membership: loaded.membership,
    permissions,
    tenantId: loaded.session.tenantId,
    compatMode: !isIdentityEnforced(),
  };
}

export function isAuthContext(value: unknown): value is AuthContext {
  return Boolean(value && typeof value === "object" && "user" in value && "permissions" in value);
}
