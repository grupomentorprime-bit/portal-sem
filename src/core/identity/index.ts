export * from "./permissions/registry";
export * from "./roles/defaults";
export { hashPassword, verifyPassword, generateToken, generateId } from "./auth/crypto";
export { isIdentityEnforced, SESSION_COOKIE, SESSION_TTL_DAYS } from "./auth/config";
export { loginWithEmail, registerWithEmail, logoutCurrentSession } from "./auth/login";
export {
  can,
  cannot,
  authorize,
  authorizeOrThrow,
  createCompatContext,
} from "./policies/engine";
export type { AuthorizeResult, AuthorizeFailure, AuthorizeResponse } from "./policies/engine";
export {
  requireAuth,
  requireTenant,
  requirePermission,
  requireRole,
  requireOwner,
  requireSession,
  getActiveTenantId,
  isAuthContext,
} from "./middleware/guards";
