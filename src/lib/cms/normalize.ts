import { createDefaultSiteConfig } from "@/lib/cms/defaults";
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

  return {
    _id: SITE_CONFIG_ID,
    institution: {
      name: raw.institution?.name ?? defaults.institution.name,
      shortName: raw.institution?.shortName ?? defaults.institution.shortName,
      tenant: raw.institution?.tenant ?? defaults.institution.tenant,
      organization: raw.institution?.organization ?? defaults.institution.organization,
      website: raw.institution?.website ?? defaults.institution.website,
      status: raw.institution?.status ?? defaults.institution.status,
    },
    branding: { ...defaults.branding, ...raw.branding },
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
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? now,
  };
}
