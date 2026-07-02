import "server-only";

import type { KeycloakUserInfo } from "@/core/identity/auth/keycloak";
import { ensureTenantRoles, findRoleByName } from "@/lib/identity/roles";

const IGNORED_REALM_ROLES = new Set([
  "offline_access",
  "uma_authorization",
]);

/** Mapeo opcional: rol en Keycloak → rol interno del CMS */
const KEYCLOAK_ROLE_ALIASES: Record<string, string> = {
  owner: "Tenant Owner",
  admin: "Institution Admin",
  editor: "Editor",
  reviewer: "Reviewer",
  teacher: "Teacher",
  admissions: "Admissions",
  "tenant-owner": "Tenant Owner",
  "institution-admin": "Institution Admin",
  "director-general": "Tenant Owner",
  "director_general": "Tenant Owner",
  cms_owner: "Tenant Owner",
  cms_admin: "Institution Admin",
  cms_editor: "Editor",
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

function resolveCmsRoleName(keycloakRole: string): string | null {
  const normalized = keycloakRole.trim();
  if (!normalized) return null;

  const alias = KEYCLOAK_ROLE_ALIASES[normalized.toLowerCase()];
  if (alias) return alias;

  // Coincidencia directa por nombre del rol CMS (Editor, Tenant Owner, etc.)
  const direct = TENANT_ROLE_NAMES.find(
    (name) => name.toLowerCase() === normalized.toLowerCase()
  );
  return direct ?? null;
}

const TENANT_ROLE_NAMES = [
  "Tenant Owner",
  "Institution Admin",
  "Editor",
  "Reviewer",
  "Teacher",
  "Admissions",
  "Finance",
  "Student",
  "Guest",
];

export async function resolveCmsRoleIdsFromKeycloak(
  tenantId: string,
  realmRoles: string[]
): Promise<string[]> {
  if (!realmRoles.length) return [];

  await ensureTenantRoles(tenantId);
  const roleIds: string[] = [];

  for (const keycloakRole of realmRoles) {
    const cmsRoleName = resolveCmsRoleName(keycloakRole);
    if (!cmsRoleName) continue;
    const role = await findRoleByName(tenantId, cmsRoleName);
    if (role) roleIds.push(role._id);
  }

  return [...new Set(roleIds)];
}
