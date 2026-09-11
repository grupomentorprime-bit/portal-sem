import type { Db } from "mongodb";
import type { SiteConfig } from "@/types/cms";
import type { CmsMenu } from "@/types/menu";
import type { CmsPage } from "@/types/page";
import type { IdentityMembership, IdentityRole, IdentityUser } from "@/types/identity";
import type { StorageIntegrationDocument } from "@/types/integrations";
import { getDefaultRolePermissionTemplate } from "@/core/identity/permissions/role-templates";
import {
  PORTAL_TENANT_ROLES,
  roleIdForTenant,
} from "@/core/identity/roles/defaults";
import { ROLE_CODES } from "@/core/identity/roles/codes";
import {
  DOMAINS_COLLECTION,
  SITE_CONFIG_COLLECTION,
  SITES_COLLECTION,
  TENANTS_COLLECTION,
} from "@/core/tenant/constants";
import { addDomainToSite, ensureDomainIndexes } from "@/core/tenant/domains";
import { findDomainByHost } from "@/core/tenant/repositories";
import { scopedResourceId, storageIntegrationIdForTenant } from "@/core/tenant/resource-ids";
import type {
  DomainKind,
  SiteConfigDocument,
  SiteDocument,
  TenantDocument,
  TenantType,
} from "@/core/tenant/types";
import { getDefaultMenusForTenant } from "@/lib/cms/menu-defaults";
import { computeItemLevels } from "@/lib/cms/menu-utils";

export interface TenantProvisionHost {
  host: string;
  kind: DomainKind;
  isPrimary?: boolean;
}

export interface TenantProvisionSpec {
  tenantId: string;
  code: string;
  name: string;
  slug?: string;
  type: TenantType;
  organization?: string;
  website?: string;
  siteId: string;
  siteCode: string;
  siteName: string;
  hosts: TenantProvisionHost[];
  config: SiteConfig;
  seedMenus?: boolean;
  seedHomePage?: boolean;
  seedRoles?: boolean;
  seedStorageStub?: boolean;
  membershipEmail?: string | null;
}

export interface TenantProvisionResult {
  tenantId: string;
  siteId: string;
  hosts: string[];
  created: {
    tenant: boolean;
    site: boolean;
    domains: number;
    siteConfig: boolean;
    menus: number;
    homePage: boolean;
    roles: number;
    storage: boolean;
    membership: boolean;
  };
  updated: {
    tenant: boolean;
    site: boolean;
    domains: number;
    siteConfig: boolean;
  };
  skipped: {
    menus: number;
    homePage: boolean;
    roles: number;
    storage: boolean;
    membership: boolean;
    hostsRejected: string[];
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

async function ensureFoundationIndexes(db: Db): Promise<void> {
  await db.collection(TENANTS_COLLECTION).createIndex({ tenantId: 1 }, { unique: true });
  await db.collection(SITES_COLLECTION).createIndex({ siteId: 1 }, { unique: true });
  await db.collection(SITES_COLLECTION).createIndex(
    { tenantId: 1, slug: 1 },
    { unique: true }
  );
  await db.collection(SITE_CONFIG_COLLECTION).createIndex(
    { tenantId: 1, siteId: 1 },
    { unique: true }
  );
  await ensureDomainIndexes(db);
}

export function buildProvisionedSiteConfigDocument(
  config: SiteConfig,
  tenantId: string,
  siteId: string,
  existing: SiteConfigDocument | null,
  at: string
): SiteConfigDocument {
  return {
    _id: siteId,
    tenantId,
    siteId,
    schemaVersion: config.schemaVersion,
    modules: config.modules,
    institution: {
      ...config.institution,
      tenant: tenantId,
    },
    branding: config.branding,
    heroPortal: config.heroPortal,
    seo: config.seo,
    contact: config.contact,
    social: config.social,
    features: config.features,
    portalCopy: config.portalCopy,
    topBar: config.topBar,
    portalExperience: config.portalExperience,
    createdAt: existing?.createdAt ?? config.createdAt ?? at,
    updatedAt: at,
  };
}

/**
 * Alta idempotente de un Espacio genérico sobre el modelo SAAS-001→008.
 * No crea resolvers ni entidades nuevas. No contiene lógica por cliente.
 */
export async function provisionTenantFoundation(
  db: Db,
  spec: TenantProvisionSpec
): Promise<TenantProvisionResult> {
  const at = nowIso();
  const tenantId = spec.tenantId.trim();
  const siteId = spec.siteId.trim();
  const slug = (spec.slug ?? tenantId).trim() || tenantId;

  await ensureFoundationIndexes(db);

  const tenantCol = db.collection<TenantDocument>(TENANTS_COLLECTION);
  const siteCol = db.collection<SiteDocument>(SITES_COLLECTION);
  const siteConfigCol = db.collection<SiteConfigDocument>(SITE_CONFIG_COLLECTION);

  const existingTenant = await tenantCol.findOne({ _id: tenantId });
  const tenantDoc: TenantDocument = {
    _id: tenantId,
    tenantId,
    code: existingTenant?.code || spec.code,
    name:
      existingTenant?.name?.trim() ||
      spec.config.institution.name.trim() ||
      spec.name,
    slug: existingTenant?.slug || slug,
    status: existingTenant?.status ?? "active",
    type: existingTenant?.type ?? spec.type,
    defaultSiteId: existingTenant?.defaultSiteId || siteId,
    organization:
      existingTenant?.organization ||
      spec.organization ||
      spec.config.institution.organization ||
      undefined,
    website:
      existingTenant?.website ||
      spec.website ||
      spec.config.institution.website ||
      undefined,
    createdAt: existingTenant?.createdAt ?? at,
    updatedAt: at,
  };
  const tenantWrite = await tenantCol.replaceOne({ _id: tenantId }, tenantDoc, {
    upsert: true,
  });

  const existingSite = await siteCol.findOne({ _id: siteId });
  const siteDoc: SiteDocument = {
    _id: siteId,
    siteId,
    tenantId,
    code: existingSite?.code || spec.siteCode,
    name:
      existingSite?.name?.trim() ||
      spec.config.institution.shortName.trim() ||
      spec.siteName,
    slug: existingSite?.slug || siteId,
    status: existingSite?.status ?? "active",
    isDefault: existingSite?.isDefault ?? true,
    createdAt: existingSite?.createdAt ?? at,
    updatedAt: at,
  };
  const siteWrite = await siteCol.replaceOne({ _id: siteId }, siteDoc, {
    upsert: true,
  });

  let domainsCreated = 0;
  let domainsUpdated = 0;
  const hostsRejected: string[] = [];
  const acceptedHosts: string[] = [];
  for (let i = 0; i < spec.hosts.length; i += 1) {
    const entry = spec.hosts[i]!;
    const before = await findDomainByHost(db, entry.host);
    const result = await addDomainToSite(db, {
      host: entry.host,
      siteId,
      tenantId,
      isPrimary: entry.isPrimary ?? i === 0,
      kind: entry.kind,
    });
    if (!result.ok) {
      hostsRejected.push(`${entry.host}:${result.reason}`);
      continue;
    }
    acceptedHosts.push(result.domain.host);
    if (!before) domainsCreated += 1;
  }

  const existingSiteConfig = await siteConfigCol.findOne({ _id: siteId });
  let siteConfigCreated = false;
  const siteConfigUpdated = false;
  if (!existingSiteConfig) {
    const siteConfigDoc = buildProvisionedSiteConfigDocument(
      spec.config,
      tenantId,
      siteId,
      null,
      at
    );
    await siteConfigCol.insertOne(siteConfigDoc);
    siteConfigCreated = true;
  }

  let menusCreated = 0;
  let menusSkipped = 0;
  if (spec.seedMenus !== false) {
    const menusCol = db.collection<CmsMenu>("cms_menus");
    const menus = getDefaultMenusForTenant(tenantId);
    for (const menu of menus) {
      const physicalId = scopedResourceId(tenantId, menu._id);
      const exists = await menusCol.countDocuments({
        $or: [
          { _id: physicalId, tenant: tenantId },
          { _id: menu._id, tenant: tenantId },
        ],
      } as Record<string, unknown>);
      if (exists > 0) {
        menusSkipped += 1;
        continue;
      }
      await menusCol.insertOne({
        ...menu,
        _id: physicalId,
        tenant: tenantId,
        items: computeItemLevels(menu.items ?? []),
        createdAt: at,
        updatedAt: at,
      });
      menusCreated += 1;
    }
  }

  let homeCreated = false;
  let homeSkipped = false;
  if (spec.seedHomePage !== false) {
    const pagesCol = db.collection<CmsPage>("cms_pages");
    const physicalId = scopedResourceId(tenantId, "home");
    const exists = await pagesCol.countDocuments({
      $or: [
        { _id: physicalId, tenant: tenantId },
        { _id: "home", tenant: tenantId },
      ],
    } as Record<string, unknown>);
    if (exists > 0) {
      homeSkipped = true;
    } else {
      await pagesCol.insertOne({
        _id: physicalId,
        tenant: tenantId,
        title: spec.config.institution.shortName.trim() || spec.siteName || "Inicio",
        slug: "/",
        description: "",
        status: "published",
        template: "institutional",
        seo: {
          title: spec.config.seo.title,
          description: spec.config.seo.description,
        },
        blocks: [],
        versions: [],
        createdAt: at,
        updatedAt: at,
      });
      homeCreated = true;
    }
  }

  let rolesCreated = 0;
  let rolesSkipped = 0;
  if (spec.seedRoles !== false) {
    const rolesCol = db.collection<IdentityRole>("identity_roles");
    for (const template of PORTAL_TENANT_ROLES) {
      const targetId = roleIdForTenant(tenantId, template.code);
      const existing = await rolesCol.findOne({
        $or: [
          { _id: targetId, tenantId },
          { tenantId, code: template.code },
        ],
      });
      if (existing) {
        rolesSkipped += 1;
        continue;
      }
      const permissionMap = getDefaultRolePermissionTemplate(template.code);
      await rolesCol.insertOne({
        _id: targetId,
        tenantId,
        code: template.code,
        name: template.name,
        description: template.description,
        permissionIds: [...template.permissionIds],
        permissionMap,
        system: template.system,
        createdAt: at,
        updatedAt: at,
      });
      rolesCreated += 1;
    }
  }

  let storageCreated = false;
  let storageSkipped = false;
  if (spec.seedStorageStub !== false) {
    const storageCol = db.collection<StorageIntegrationDocument>(
      "platform_integrations"
    );
    const storageId = storageIntegrationIdForTenant(tenantId);
    const existing = await storageCol.findOne({ _id: storageId, tenantId });
    if (existing) {
      storageSkipped = true;
    } else {
      await storageCol.insertOne({
        _id: storageId,
        tenantId,
        enabled: false,
        provider: "s3-compatible",
        accessMode: "private",
        endpoint: "",
        region: "auto",
        bucket: "",
        accessKeyId: "",
        secretAccessKeyEncrypted: "",
        publicUrl: "",
        forcePathStyle: true,
        createdAt: at,
        updatedAt: at,
      });
      storageCreated = true;
    }
  }

  let membershipCreated = false;
  let membershipSkipped = false;
  const email = spec.membershipEmail?.trim().toLowerCase() ?? "";
  if (email) {
    const usersCol = db.collection<IdentityUser>("identity_users");
    const user = await usersCol.findOne({ email });
    if (user) {
      const membershipsCol = db.collection<IdentityMembership>(
        "identity_memberships"
      );
      const existingMem = await membershipsCol.findOne({
        tenantId,
        userId: user._id,
      });
      if (existingMem) {
        membershipSkipped = true;
      } else {
        const superAdminId = roleIdForTenant(tenantId, ROLE_CODES.SUPER_ADMIN);
        await membershipsCol.insertOne({
          _id: `membership-${tenantId}-${user._id}`,
          tenantId,
          userId: user._id,
          roleIds: [superAdminId],
          status: "active",
          joinedAt: at,
          createdAt: at,
          updatedAt: at,
        });
        membershipCreated = true;
      }
    } else {
      membershipSkipped = true;
    }
  }

  return {
    tenantId,
    siteId,
    hosts: acceptedHosts,
    created: {
      tenant: tenantWrite.upsertedCount > 0,
      site: siteWrite.upsertedCount > 0,
      domains: domainsCreated,
      siteConfig: siteConfigCreated,
      menus: menusCreated,
      homePage: homeCreated,
      roles: rolesCreated,
      storage: storageCreated,
      membership: membershipCreated,
    },
    updated: {
      tenant: tenantWrite.modifiedCount > 0,
      site: siteWrite.modifiedCount > 0,
      domains: domainsUpdated,
      siteConfig: siteConfigUpdated,
    },
    skipped: {
      menus: menusSkipped,
      homePage: homeSkipped,
      roles: rolesSkipped,
      storage: storageSkipped,
      membership: membershipSkipped,
      hostsRejected,
    },
  };
}
