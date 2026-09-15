export * from "./permissions/registry";
export * from "./permissions/catalog";
export * from "./permissions/role-templates";
export * from "./permissions/resolver";
export * from "./permissions/sync-system-role";
export * from "./permissions/scopes";
export * from "./roles/defaults";
export * from "./roles/codes";
export * from "./roles/hierarchy";
export * from "./roles/helpers";
export { hashPassword, verifyPassword, generateToken, generateId } from "./auth/crypto";
export { isIdentityEnforced, isKeycloakOnlyAuth, isEmailAuthEnabled, SESSION_COOKIE, SESSION_TTL_DAYS } from "./auth/config";
export {
  isKeycloakEnabled,
  buildKeycloakAuthorizeUrl,
  createPkcePair,
  GROWTH_OS_KEYCLOAK_CLIENT_ID,
} from "./auth/keycloak";
export { loginWithEmail, registerWithEmail, logoutCurrentSession } from "./auth/login";
export {
  can,
  cannot,
  authorize,
  authorizeOrThrow,
} from "./policies/engine";
export type { AuthorizeResult, AuthorizeFailure, AuthorizeResponse } from "./policies/engine";
export {
  requireAuth,
  requireSpace,
  requireTenant,
  requirePermission,
  requireRole,
  requireRoleCode,
  requireOwner,
  requirePlatformOperator,
  requireSession,
  getActiveTenantId,
  getSessionActiveTenantId,
  getOperationalTenantId,
  isAuthContext,
} from "./middleware/guards";
export {
  PLATFORM_ROLE_CODES,
  PLATFORM_ADMIN_HOME,
  isPlatformRoleCode,
  normalizePlatformRoles,
} from "./platform/codes";
export {
  hasPlatformOperatorCapability,
  evaluatePlatformOperatorAccess,
  readPlatformRoles,
} from "./platform/capability";
export { resolvePostAuthDestination } from "./platform/landing";
