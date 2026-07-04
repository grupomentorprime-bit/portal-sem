import "server-only";

import type { KeycloakUserInfo } from "@/core/identity/auth/keycloak";
import { ROLE_CODES, resolveRoleCode, type RoleCode } from "@/core/identity/roles/codes";
import { ensureTenantRoles, findRoleByCode } from "@/lib/identity/roles";

const IGNORED_REALM_ROLES = new Set([
  "offline_access",
  "uma_authorization",
]);

/** Mapeo: rol en Keycloak → código oficial del CMS */
const KEYCLOAK_ROLE_TO_CODE: Record<string, RoleCode> = {
  owner: ROLE_CODES.SUPER_ADMIN,
  admin: ROLE_CODES.INSTITUTION_ADMIN,
  editor: ROLE_CODES.COMMUNICATIONS,
  communications: ROLE_CODES.COMMUNICATIONS,
  reviewer: ROLE_CODES.REVIEWER,
  teacher: ROLE_CODES.TEACHER,
  admissions: ROLE_CODES.ADMISSIONS,
  support: ROLE_CODES.SUPPORT,
  guest: ROLE_CODES.GUEST,
  "tenant-owner": ROLE_CODES.SUPER_ADMIN,
  "institution-admin": ROLE_CODES.INSTITUTION_ADMIN,
  "director-general": ROLE_CODES.SUPER_ADMIN,
  director_general: ROLE_CODES.SUPER_ADMIN,
  cms_owner: ROLE_CODES.SUPER_ADMIN,
  cms_admin: ROLE_CODES.INSTITUTION_ADMIN,
  cms_editor: ROLE_CODES.COMMUNICATIONS,
  super_admin: ROLE_CODES.SUPER_ADMIN,
  institution_admin: ROLE_CODES.INSTITUTION_ADMIN,
  student_affairs: ROLE_CODES.STUDENT_AFFAIRS,
  "student-affairs": ROLE_CODES.STUDENT_AFFAIRS,
};

export interface KeycloakIdentityClaims {
  displayName: string;
  jobTitle?: string;
  realmRoles: string[];
}

export function decodeAccessTokenPayload(accessToken: string): Record<string, unknown> {
  try {
    const part = accessToken.split(".")[1];
    if (!part) return {};
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(normalized, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function readStringClaim(payload: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

export function extractRealmRoles(payload: Record<string, unknown>): string[] {
  const realmAccess = payload.realm_access as { roles?: string[] } | undefined;
  const roles = realmAccess?.roles ?? [];
  return roles.filter(
    (role) =>
      !IGNORED_REALM_ROLES.has(role) &&
      !role.startsWith("default-roles-")
  );
}

export function buildKeycloakIdentityClaims(
  profile: KeycloakUserInfo,
  accessToken: string
): KeycloakIdentityClaims {
  const payload = decodeAccessTokenPayload(accessToken);
  const realmRoles = extractRealmRoles(payload);

  const displayName =
    profile.name?.trim() ||
    [profile.given_name, profile.family_name].filter(Boolean).join(" ").trim() ||
    readStringClaim(payload, "name") ||
    [readStringClaim(payload, "given_name"), readStringClaim(payload, "family_name")]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    profile.preferred_username?.trim() ||
    readStringClaim(payload, "preferred_username") ||
    profile.email?.trim() ||
    readStringClaim(payload, "email") ||
    "";

  const jobTitle =
    readStringClaim(payload, "title", "job_title", "jobTitle", "position", "cargo") ||
    readStringClaim(
      profile as unknown as Record<string, unknown>,
      "title",
      "job_title",
      "jobTitle",
      "position",
      "cargo"
    );

  return { displayName, jobTitle, realmRoles };
}

function resolveCmsRoleCode(keycloakRole: string): RoleCode | null {
  const normalized = keycloakRole.trim().toLowerCase();
  if (!normalized) return null;

  const alias = KEYCLOAK_ROLE_TO_CODE[normalized];
  if (alias) return alias;

  return resolveRoleCode(keycloakRole);
}

export async function resolveCmsRoleIdsFromKeycloak(
  tenantId: string,
  realmRoles: string[]
): Promise<string[]> {
  if (!realmRoles.length) return [];

  await ensureTenantRoles(tenantId);
  const roleIds: string[] = [];

  for (const keycloakRole of realmRoles) {
    const code = resolveCmsRoleCode(keycloakRole);
    if (!code) continue;
    const role = await findRoleByCode(tenantId, code);
    if (role) roleIds.push(role._id);
  }

  return [...new Set(roleIds)];
}

export { ROLE_CODES };
