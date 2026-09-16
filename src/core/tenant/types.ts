import type { PortalStatus } from "@/types/cms";

export type TenantStatus = "active" | "inactive" | "suspended";
export type SiteStatus = PortalStatus;
/**
 * Clasificación del Espacio (UX / catálogo).
 * Categorías base nuevas: business | education | social | community | independent | other.
 * Legacy: institution | academy | platform.
 * No limita capacidades de Growth OS.
 */
export type TenantType =
  | "business"
  | "education"
  | "social"
  | "community"
  | "independent"
  | "other"
  | "institution"
  | "academy"
  | "platform"
  | string;

export interface TenantDocument {
  _id: string;
  tenantId: string;
  code: string;
  name: string;
  slug: string;
  status: TenantStatus;
  type: TenantType;
  defaultSiteId: string;
  organization?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SiteDocument {
  _id: string;
  siteId: string;
  tenantId: string;
  code: string;
  name: string;
  slug: string;
  status: SiteStatus;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Clasificación lógica del host (ADR-008 D3).
 * No implica DNS/TLS automático — solo modelo de aplicación.
 */
export type DomainKind =
  /** Dominio propio del cliente (custom domain). */
  | "custom"
  /** Subdominio de plataforma: `{slug}.{PLATFORM_BASE_DOMAIN}`. */
  | "platform_subdomain"
  /** Hosts migrados / bootstrap legacy (p. ej. SEM en transición). */
  | "legacy";

export interface DomainDocument {
  _id: string;
  /** Host normalizado (lowercase, con puerto si aplica). Único global. */
  host: string;
  tenantId: string;
  siteId: string;
  /** Exactamente un dominio `isPrimary` por Site cuando hay ≥1 dominio. */
  isPrimary: boolean;
  kind: DomainKind;
  createdAt: string;
  updatedAt: string;
}

/**
 * Documento de configuración por Site.
 * Mirror del contenido de cms_config (sin forzar `_id: "site"`).
 */
export interface SiteConfigDocument {
  _id: string;
  tenantId: string;
  siteId: string;
  legacyConfigId?: "site";
  schemaVersion: number;
  modules: unknown;
  institution: unknown;
  branding: unknown;
  heroPortal?: unknown;
  seo: unknown;
  contact: unknown;
  social: unknown;
  features: unknown;
  portalCopy?: unknown;
  topBar?: unknown;
  portalExperience?: unknown;
  createdAt: string;
  updatedAt: string;
}
