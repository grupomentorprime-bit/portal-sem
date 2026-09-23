import "server-only";

import { PLATFORM_SPACE_FALLBACK } from "@/core/branding";
import { ROLE_CODES } from "@/core/identity/roles/codes";
import {
  findDefaultSiteForTenant,
  findDomainsByTenantId,
  findPrimaryDomainBySiteId,
  findSiteConfigBySiteId,
  findSitesByTenantId,
  findTenantById,
  listTenants,
  type DomainKind,
  type SiteStatus,
  type TenantDocument,
  type TenantStatus,
  type TenantType,
} from "@/core/tenant";
import { getDatabase } from "@/lib/mongodb";
import { resolveMediaRef } from "@/core/media";
import {
  countMembershipsByTenant,
  listMembershipsByTenant,
} from "@/lib/identity/memberships";
import {
  findRoleByCode,
  findRolesByIds,
  getRoleCode,
} from "@/lib/identity/roles";
import { listUsersByIds } from "@/lib/identity/users";
import {
  labelSiteStatus,
  labelSpaceRole,
  labelTenantStatus,
  labelTenantType,
} from "@/lib/platform/space-labels";

export interface PlatformSpaceListItem {
  tenantId: string;
  name: string;
  status: TenantStatus;
  statusLabel: string;
  type: TenantType;
  typeLabel: string;
  primaryDomain: string | null;
  primaryDomainKind: DomainKind | null;
  primarySite: {
    siteId: string;
    name: string;
    status: SiteStatus;
    statusLabel: string;
  } | null;
  memberCount: number;
  /** Logo desde site_config.branding — null si no hay asset configurado. */
  logoUrl: string | null;
  /** Imagen hero desde site_config.branding — solo si está configurada (sin fallback de plataforma). */
  coverUrl: string | null;
  /** Lema institucional desde site_config, si existe. */
  tagline: string | null;
}

export interface PlatformSpaceMetrics {
  activeSpaces: number;
  activeSites: number;
  peopleWithAccess: number;
  activeDomains: number;
}

export interface PlatformSpaceMember {
  userId: string;
  email: string;
  displayName: string;
  roleCode: string | null;
  roleLabel: string;
  status: string;
  joinedAt: string;
}

export interface PlatformSpaceIdentity {
  name: string | null;
  shortName: string | null;
  organization: string | null;
  website: string | null;
  status: string | null;
}

export interface PlatformSpaceDetail {
  tenantId: string;
  name: string;
  status: TenantStatus;
  statusLabel: string;
  type: TenantType;
  typeLabel: string;
  site: {
    siteId: string;
    name: string;
    status: SiteStatus;
    statusLabel: string;
    isDefault: boolean;
  } | null;
  domains: Array<{
    host: string;
    isPrimary: boolean;
    kind: DomainKind;
  }>;
  owner: PlatformSpaceMember | null;
  owners: PlatformSpaceMember[];
  principalMembers: PlatformSpaceMember[];
  memberCount: number;
  identity: PlatformSpaceIdentity | null;
  logoUrl: string | null;
  coverUrl: string | null;
  tagline: string | null;
}

function asConfiguredText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readIdentity(
  institution: unknown
): PlatformSpaceIdentity | null {
  if (!institution || typeof institution !== "object") return null;
  const row = institution as Record<string, unknown>;
  return {
    name: asConfiguredText(row.name),
    shortName: asConfiguredText(row.shortName),
    organization: asConfiguredText(row.organization),
    website: asConfiguredText(row.website),
    status: asConfiguredText(row.status),
  };
}

function readTagline(institution: unknown): string | null {
  if (!institution || typeof institution !== "object") return null;
  return asConfiguredText((institution as Record<string, unknown>).tagline);
}

/**
 * Visuales del Espacio desde site_config.
 * No aplica fallbacks de plataforma ni assets inventados.
 */
async function resolveSpaceVisuals(
  tenantId: string,
  branding: unknown
): Promise<{ logoUrl: string | null; coverUrl: string | null }> {
  if (!branding || typeof branding !== "object") {
    return { logoUrl: null, coverUrl: null };
  }
  const row = branding as Record<string, unknown>;
  const logoMediaId = asConfiguredText(row.logoMediaId) ?? undefined;
  const logoLegacy = asConfiguredText(row.logo) ?? undefined;
  const heroMediaId = asConfiguredText(row.heroMediaId) ?? undefined;
  const heroLegacy = asConfiguredText(row.heroImage) ?? undefined;

  const [logoUrl, coverUrl] = await Promise.all([
    logoMediaId || logoLegacy
      ? resolveMediaRef(tenantId, {
          mediaId: logoMediaId,
          legacyUrl: logoLegacy,
        }, "w400")
      : Promise.resolve(null),
    heroMediaId || heroLegacy
      ? resolveMediaRef(tenantId, {
          mediaId: heroMediaId,
          legacyUrl: heroLegacy,
        }, "w800")
      : Promise.resolve(null),
  ]);

  return {
    logoUrl: logoUrl?.trim() || null,
    coverUrl: coverUrl?.trim() || null,
  };
}

/** Métricas derivadas del catálogo ya cargado — sin consultas extra ni tendencias. */
export function summarizePlatformMetrics(
  spaces: PlatformSpaceListItem[]
): PlatformSpaceMetrics {
  return {
    activeSpaces: spaces.filter((space) => space.status === "active").length,
    activeSites: spaces.filter(
      (space) => space.primarySite?.status === "active"
    ).length,
    peopleWithAccess: spaces.reduce((sum, space) => sum + space.memberCount, 0),
    activeDomains: spaces.filter((space) => Boolean(space.primaryDomain)).length,
  };
}

async function resolvePrimarySite(tenant: TenantDocument) {
  const db = await getDatabase();
  const defaultSite = await findDefaultSiteForTenant(db, tenant.tenantId);
  if (defaultSite) return defaultSite;

  const sites = await findSitesByTenantId(db, tenant.tenantId);
  if (tenant.defaultSiteId) {
    const byId = sites.find(
      (site) =>
        site.siteId === tenant.defaultSiteId || site._id === tenant.defaultSiteId
    );
    if (byId) return byId;
  }
  return sites[0] ?? null;
}

async function buildListItem(tenant: TenantDocument): Promise<PlatformSpaceListItem> {
  const db = await getDatabase();
  const site = await resolvePrimarySite(tenant);
  const primaryDomain = site
    ? await findPrimaryDomainBySiteId(db, site.siteId)
    : null;
  const memberCount = await countMembershipsByTenant(tenant.tenantId);
  const siteConfig = site ? await findSiteConfigBySiteId(db, site.siteId) : null;
  const scopedConfig =
    siteConfig && siteConfig.tenantId === tenant.tenantId ? siteConfig : null;
  const visuals = scopedConfig
    ? await resolveSpaceVisuals(tenant.tenantId, scopedConfig.branding)
    : { logoUrl: null, coverUrl: null };

  return {
    tenantId: tenant.tenantId,
    name: tenant.name?.trim() || PLATFORM_SPACE_FALLBACK,
    status: tenant.status,
    statusLabel: labelTenantStatus(tenant.status),
    type: tenant.type,
    typeLabel: labelTenantType(tenant.type),
    primaryDomain: primaryDomain?.host ?? null,
    primaryDomainKind: primaryDomain?.kind ?? null,
    primarySite: site
      ? {
          siteId: site.siteId,
          name: site.name,
          status: site.status,
          statusLabel: labelSiteStatus(site.status),
        }
      : null,
    memberCount,
    logoUrl: visuals.logoUrl,
    coverUrl: visuals.coverUrl,
    tagline: scopedConfig ? readTagline(scopedConfig.institution) : null,
  };
}

/**
 * Catálogo global de Espacios para operadores de Growth OS.
 * No usa membresías del caller ni el listado de Espacios de la cuenta.
 */
export async function listPlatformSpaces(): Promise<PlatformSpaceListItem[]> {
  const db = await getDatabase();
  const tenants = await listTenants(db);
  return Promise.all(tenants.map((tenant) => buildListItem(tenant)));
}

/**
 * Ficha operativa de un Espacio. Aislada por tenantId (sin mezcla cruzada).
 */
export async function getPlatformSpaceDetail(
  tenantId: string
): Promise<PlatformSpaceDetail | null> {
  const trimmed = tenantId.trim();
  if (!trimmed) return null;

  const db = await getDatabase();
  const tenant = await findTenantById(db, trimmed);
  if (!tenant) return null;

  const site = await resolvePrimarySite(tenant);
  const domainsRaw = await findDomainsByTenantId(db, tenant.tenantId);
  // Defensa: solo dominios de este Espacio (aislamiento).
  const domains = domainsRaw
    .filter((domain) => domain.tenantId === tenant.tenantId)
    .sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      const rank = (kind: DomainKind) =>
        kind === "platform_subdomain" ? 0 : kind === "custom" ? 1 : 2;
      const byKind = rank(a.kind) - rank(b.kind);
      if (byKind !== 0) return byKind;
      return a.host.localeCompare(b.host);
    })
    .map((domain) => ({
      host: domain.host,
      isPrimary: domain.isPrimary,
      kind: domain.kind,
    }));

  const siteConfig = site ? await findSiteConfigBySiteId(db, site.siteId) : null;
  const identity =
    siteConfig && siteConfig.tenantId === tenant.tenantId
      ? readIdentity(siteConfig.institution)
      : null;

  const [memberships, memberCount, ownerRole, adminRole] = await Promise.all([
    listMembershipsByTenant(tenant.tenantId),
    countMembershipsByTenant(tenant.tenantId),
    findRoleByCode(tenant.tenantId, ROLE_CODES.SUPER_ADMIN),
    findRoleByCode(tenant.tenantId, ROLE_CODES.INSTITUTION_ADMIN),
  ]);

  const scopedMemberships = memberships.filter(
    (membership) => membership.tenantId === tenant.tenantId
  );
  const userIds = [...new Set(scopedMemberships.map((m) => m.userId))];
  const roleIds = [...new Set(scopedMemberships.flatMap((m) => m.roleIds))];
  const [users, roles] = await Promise.all([
    listUsersByIds(userIds),
    findRolesByIds(tenant.tenantId, roleIds),
  ]);
  const userMap = new Map(users.map((user) => [user._id, user]));
  const roleMap = new Map(roles.map((role) => [role._id, role]));

  const ownerRoleId = ownerRole?._id;
  const adminRoleId = adminRole?._id;

  const toMember = (
    membership: (typeof scopedMemberships)[number],
    preferredCode?: string | null
  ): PlatformSpaceMember | null => {
    const user = userMap.get(membership.userId);
    if (!user) return null;
    const memberRoles = membership.roleIds
      .map((id) => roleMap.get(id))
      .filter((role): role is NonNullable<typeof role> => Boolean(role));
    const codes = memberRoles
      .map((role) => getRoleCode(role))
      .filter((code): code is NonNullable<typeof code> => Boolean(code));
    let roleCode: string | null = codes[0] ?? null;
    if (preferredCode && codes.includes(preferredCode as (typeof codes)[number])) {
      roleCode = preferredCode;
    } else if (codes.includes(ROLE_CODES.SUPER_ADMIN)) {
      roleCode = ROLE_CODES.SUPER_ADMIN;
    } else if (codes.includes(ROLE_CODES.INSTITUTION_ADMIN)) {
      roleCode = ROLE_CODES.INSTITUTION_ADMIN;
    }
    return {
      userId: user._id,
      email: user.email,
      displayName: user.displayName?.trim() || user.email,
      roleCode,
      roleLabel: labelSpaceRole(roleCode),
      status: membership.status,
      joinedAt: membership.joinedAt,
    };
  };

  const owners = scopedMemberships
    .filter(
      (membership) =>
        membership.status === "active" &&
        ownerRoleId &&
        membership.roleIds.includes(ownerRoleId)
    )
    .map((membership) => toMember(membership, ROLE_CODES.SUPER_ADMIN))
    .filter((member): member is PlatformSpaceMember => Boolean(member))
    .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));

  const admins = scopedMemberships
    .filter(
      (membership) =>
        membership.status === "active" &&
        adminRoleId &&
        membership.roleIds.includes(adminRoleId) &&
        !(ownerRoleId && membership.roleIds.includes(ownerRoleId))
    )
    .map((membership) => toMember(membership, ROLE_CODES.INSTITUTION_ADMIN))
    .filter((member): member is PlatformSpaceMember => Boolean(member))
    .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));

  const principalMembers = [...owners, ...admins].slice(0, 12);

  const visuals =
    siteConfig && siteConfig.tenantId === tenant.tenantId
      ? await resolveSpaceVisuals(tenant.tenantId, siteConfig.branding)
      : { logoUrl: null, coverUrl: null };

  return {
    tenantId: tenant.tenantId,
    name: tenant.name?.trim() || PLATFORM_SPACE_FALLBACK,
    status: tenant.status,
    statusLabel: labelTenantStatus(tenant.status),
    type: tenant.type,
    typeLabel: labelTenantType(tenant.type),
    site: site
      ? {
          siteId: site.siteId,
          name: site.name,
          status: site.status,
          statusLabel: labelSiteStatus(site.status),
          isDefault: site.isDefault,
        }
      : null,
    domains,
    owner: owners[0] ?? null,
    owners,
    principalMembers,
    memberCount,
    identity,
    logoUrl: visuals.logoUrl,
    coverUrl: visuals.coverUrl,
    tagline:
      siteConfig && siteConfig.tenantId === tenant.tenantId
        ? readTagline(siteConfig.institution)
        : null,
  };
}
