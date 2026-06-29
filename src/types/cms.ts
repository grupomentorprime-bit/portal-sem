export const SITE_CONFIG_ID = "site" as const;

export type PortalStatus = "active" | "maintenance" | "inactive";

export interface Institution {
  name: string;
  shortName: string;
  tenant: string;
  organization: string;
  website: string;
  status: PortalStatus;
}

export interface Branding {
  logo: string;
  secondaryLogo?: string;
  favicon: string;
  heroImage: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
}

export interface SeoConfig {
  title: string;
  description: string;
  keywords: string[];
}

export interface ContactInfo {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  country: string;
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  tiktok: string;
}

export interface FeatureFlags {
  blog: boolean;
  news: boolean;
  events: boolean;
  store: boolean;
  library: boolean;
  forms: boolean;
  applications: boolean;
  onlinePayments: boolean;
}

export interface SiteConfig {
  _id: typeof SITE_CONFIG_ID;
  institution: Institution;
  branding: Branding;
  seo: SeoConfig;
  contact: ContactInfo;
  social: SocialLinks;
  features: FeatureFlags;
  createdAt: string;
  updatedAt: string;
}

export type SiteConfigUpdate = Omit<SiteConfig, "_id" | "createdAt" | "updatedAt">;

export const CONFIG_SECTIONS = [
  { id: "general", label: "General" },
  { id: "branding", label: "Branding" },
  { id: "seo", label: "SEO" },
  { id: "contact", label: "Contacto" },
  { id: "social", label: "Redes" },
  { id: "features", label: "Funcionalidades" },
  { id: "status", label: "Estado" },
] as const;

export type ConfigSectionId = (typeof CONFIG_SECTIONS)[number]["id"];
