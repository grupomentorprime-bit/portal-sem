export * from "./permissions/registry";
export * from "./permissions/catalog";
export * from "./permissions/role-templates";
export * from "./permissions/resolver";
export * from "./permissions/scopes";
export * from "./roles/defaults";
export * from "./roles/codes";
export * from "./roles/hierarchy";
export * from "./roles/helpers";
export { hashPassword, verifyPassword, generateToken, generateId } from "./auth/crypto";
export { isIdentityEnforced, isKeycloakOnlyAuth, isEmailAuthEnabled, SESSION_COOKIE, SESSION_TTL_DAYS } from "./auth/config";
export {
  isKeycloakEnabled,
  getKeycloakConfig,
  buildKeycloakAuthorizeUrl,
} from "./auth/keycloak";
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
  requireRoleCode,
  requireOwner,
  requireSession,
  getActiveTenantId,
  isAuthContext,
} from "./middleware/guards";
