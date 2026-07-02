import type { HeroPortalConfig } from "@/types/hero-portal";
import {
  createDefaultSiteConfigModules,
  SITE_CONFIG_SCHEMA_VERSION,
  type SiteConfigModules,
} from "@/lib/cms/schema-versions";

export const SITE_CONFIG_ID = "site" as const;

export type PortalStatus = "active" | "maintenance" | "inactive";

export interface Institution {
  name: string;
  shortName: string;
  tenant: string;
  organization: string;
  website: string;
  /** Lema institucional — visible en footer y hero */
  tagline: string;
  status: PortalStatus;
}

export interface Branding {
  /** @deprecated Usar logoMediaId — URL derivada por Asset Engine */
  logo: string;
  logoMediaId?: string;
  /** @deprecated Usar secondaryLogoMediaId */
  secondaryLogo?: string;
  secondaryLogoMediaId?: string;
  /** @deprecated Usar faviconMediaId */
  favicon: string;
  faviconMediaId?: string;
  /** @deprecated Usar heroMediaId */
  heroImage: string;
  heroMediaId?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
}

export interface SeoConfig {
  title: string;
  description: string;
  keywords: string[];
  /** @deprecated Usar ogImageMediaId */
  ogImage?: string;
  ogImageMediaId?: string;
  /** @deprecated Usar twitterImageMediaId */
  twitterImage?: string;
  twitterImageMediaId?: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  country: string;
  /** Horario de atención público */
  hours: string;
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  tiktok: string;
  spotify: string;
}

export interface FeatureFlags {
  blog: boolean;
  news: boolean;
  events: boolean;
  academicAgenda: boolean;
  institutionalNotices: boolean;
  store: boolean;
  library: boolean;
  forms: boolean;
  applications: boolean;
  onlinePayments: boolean;
}

export interface PortalCopy {
  footerProgramsTitle: string;
  footerResourcesTitle: string;
  footerAdmissionTitle: string;
  footerContactTitle: string;
  footerAdminLabel: string;
  footerCopyrightSuffix: string;
  footerCredits: string;
  footerBackToTopLabel: string;
}

export interface PortalTopBarConfig {
  enabled: boolean;
  tagline: string;
  email: string;
  phone: string;
  virtualCampusLabel: string;
  virtualCampusHref: string;
}

export type PortalCursorMode = "premium" | "classic";

export interface PortalCursorConfig {
  enabled: boolean;
  mode: PortalCursorMode;
  primaryColor: string;
  secondaryColor: string;
  /** Diámetro del anillo en px (16–56) */
  size: number;
  /** 0.2 – 1 */
  opacity: number;
  glow: boolean;
  /** Factor de suavizado 0.08 – 0.45 */
  speed: number;
  magnetism: boolean;
  /** Intensidad del magnetismo 0 – 1 */
  magnetStrength: number;
  ripple: boolean;
  animations: boolean;
  showOnMobile: boolean;
}

export interface PortalFooterPremiumConfig {
  showDescription?: boolean;
  showNavigation?: boolean;
  showContact?: boolean;
  showSocial?: boolean;
  showLegal?: boolean;
  showNewsletter?: boolean;
  showCertifications?: boolean;
}

export interface PortalExperienceConfig {
  cursor: PortalCursorConfig;
  footerPremium?: PortalFooterPremiumConfig;
}

export interface SiteConfig {
  _id: typeof SITE_CONFIG_ID;
  /** Versión del documento cms_config (estructura con bloque modules) */
  schemaVersion: typeof SITE_CONFIG_SCHEMA_VERSION;
  /** Versiones por módulo — migraciones independientes */
  modules: SiteConfigModules;
  institution: Institution;
  branding: Branding;
  /** Hero administrable del portal (OT-PORTAL-014) */
  heroPortal: HeroPortalConfig;
  seo: SeoConfig;
  contact: ContactInfo;
  social: SocialLinks;
  features: FeatureFlags;
  portalCopy: PortalCopy;
  topBar: PortalTopBarConfig;
  portalExperience: PortalExperienceConfig;
  createdAt: string;
  updatedAt: string;
}

export type SiteConfigUpdate = Omit<SiteConfig, "_id" | "createdAt" | "updatedAt">;

export const CONFIG_SECTIONS = [
  { id: "general", label: "Configuración general" },
  { id: "branding", label: "Identidad visual" },
  { id: "seo", label: "Visibilidad web" },
  { id: "contact", label: "Contacto" },
  { id: "social", label: "Redes sociales" },
  { id: "features", label: "Funciones del portal" },
  { id: "experience", label: "Experiencia del visitante" },
  { id: "status", label: "Estado del portal" },
] as const;

export type ConfigSectionId = (typeof CONFIG_SECTIONS)[number]["id"];
