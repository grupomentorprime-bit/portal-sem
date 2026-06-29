import type { AuthContext } from "@/types/identity";
import type { PermissionId } from "@/core/identity/permissions/registry";
import { ALL_PERMISSION_IDS } from "@/core/identity/permissions/registry";

export interface PolicyCondition {
  /** Extensión futura ABAC */
  field?: string;
  operator?: "eq" | "neq" | "in";
  value?: unknown;
}

export interface AuthorizeResult {
  ok: true;
  context: AuthContext;
}

export interface AuthorizeFailure {
  ok: false;
  error: string;
  status: 401 | 403;
}

export type AuthorizeResponse = AuthorizeResult | AuthorizeFailure;

export function can(context: AuthContext, permission: PermissionId | string): boolean {
  if (context.compatMode) return true;
  return context.permissions.includes(permission);
}

export function cannot(context: AuthContext, permission: PermissionId | string): boolean {
  return !can(context, permission);
}

export function authorize(
  context: AuthContext,
  permission: PermissionId | string
): AuthorizeResponse {
  if (can(context, permission)) {
    return { ok: true, context };
  }
  return {
    ok: false,
    error: `Permiso denegado: ${permission}`,
    status: 403,
  };
}

export function authorizeOrThrow(
  context: AuthContext,
  permission: PermissionId | string
): void {
  const result = authorize(context, permission);
  if (!result.ok) {
    const err = new Error(result.error) as Error & { status: number };
    err.status = result.status;
    throw err;
  }
}

export function createCompatContext(tenantId: string): AuthContext {
  return {
    user: {
      _id: "compat-user",
      email: "compat@local.dev",
      emailVerified: true,
      displayName: "Compat Mode",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    session: {
      _id: "compat-session",
      userId: "compat-user",
      tenantId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      lastActivity: new Date().toISOString(),
    },
    membership: null,
    permissions: [...ALL_PERMISSION_IDS],
    tenantId,
    compatMode: true,
  };
}
