import { createDefaultSiteConfig } from "@/lib/cms/defaults";
import { normalizeHeroPortal } from "@/lib/cms/hero-portal-normalize";
import { normalizeSiteConfigModules } from "@/lib/cms/normalize-modules";
import { SITE_CONFIG_SCHEMA_VERSION } from "@/lib/cms/schema-versions";
import { DEFAULT_PORTAL_CURSOR } from "@/lib/portal/cursor-defaults";
import type {
  ContactInfo,
  FeatureFlags,
  SiteConfig,
} from "@/types/cms";
import { SITE_CONFIG_ID } from "@/types/cms";

type RawSiteConfig = Partial<SiteConfig> & {
  institution?: Partial<SiteConfig["institution"]> & {
    email?: string;
    phone?: string;
    whatsapp?: string;
  };
  contact?: Partial<ContactInfo>;
  features?: Partial<FeatureFlags>;
};

function normalizeContact(
  raw: RawSiteConfig,
  defaults: ContactInfo
): ContactInfo {
  const institution = raw.institution ?? {};
  const legacy = institution as Partial<ContactInfo>;

  return {
    email: raw.contact?.email ?? legacy.email ?? defaults.email,
    phone: raw.contact?.phone ?? legacy.phone ?? defaults.phone,
    whatsapp: raw.contact?.whatsapp ?? legacy.whatsapp ?? defaults.whatsapp,
    address: raw.contact?.address ?? defaults.address,
    city: raw.contact?.city ?? defaults.city,
    country: raw.contact?.country ?? defaults.country,
    hours: raw.contact?.hours ?? defaults.hours ?? "",
  };
}

function normalizeFeatures(
  raw: Partial<FeatureFlags> | undefined,
  defaults: FeatureFlags
): FeatureFlags {
  return {
    blog: raw?.blog ?? defaults.blog,
    news: raw?.news ?? defaults.news,
    events: raw?.events ?? defaults.events,
    academicAgenda: raw?.academicAgenda ?? defaults.academicAgenda,
    institutionalNotices: raw?.institutionalNotices ?? defaults.institutionalNotices,
    store: raw?.store ?? defaults.store,
    library: raw?.library ?? defaults.library,
    forms: raw?.forms ?? defaults.forms,
    applications: raw?.applications ?? defaults.applications,
    onlinePayments: raw?.onlinePayments ?? defaults.onlinePayments,
  };
}

export function normalizeSiteConfig(raw: RawSiteConfig | null): SiteConfig | null {
  if (!raw || raw._id !== SITE_CONFIG_ID) {
    return null;
  }

  const defaults = createDefaultSiteConfig();
  const now = new Date().toISOString();
  const modules = normalizeSiteConfigModules(raw.modules);
  const branding = { ...defaults.branding, ...raw.branding };

  return {
    _id: SITE_CONFIG_ID,
    schemaVersion: SITE_CONFIG_SCHEMA_VERSION,
    modules,
    institution: {
      name: raw.institution?.name ?? defaults.institution.name,
      shortName: raw.institution?.shortName ?? defaults.institution.shortName,
      tenant: raw.institution?.tenant ?? defaults.institution.tenant,
      organization: raw.institution?.organization ?? defaults.institution.organization,
      website: raw.institution?.website ?? defaults.institution.website,
      tagline: raw.institution?.tagline ?? defaults.institution.tagline,
      status: raw.institution?.status ?? defaults.institution.status,
    },
    branding,
    heroPortal: normalizeHeroPortal(raw.heroPortal, branding, modules.heroPortal.version),
    seo: {
      ...defaults.seo,
      ...raw.seo,
      keywords: Array.isArray(raw.seo?.keywords)
        ? raw.seo.keywords
        : defaults.seo.keywords,
    },
    contact: normalizeContact(raw, defaults.contact),
    social: { ...defaults.social, ...raw.social },
    features: normalizeFeatures(raw.features, defaults.features),
    portalCopy: { ...defaults.portalCopy, ...raw.portalCopy },
    topBar: { ...defaults.topBar, ...raw.topBar },
    portalExperience: {
      cursor: {
        ...DEFAULT_PORTAL_CURSOR,
        ...defaults.portalExperience.cursor,
        ...raw.portalExperience?.cursor,
      },
      footerPremium: {
        ...defaults.portalExperience.footerPremium,
        ...raw.portalExperience?.footerPremium,
      },
    },
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? now,
  };
}
