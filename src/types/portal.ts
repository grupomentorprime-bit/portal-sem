/** Portal Engine — tipos del motor CMS-driven */

import type { FeatureFlags } from "@/types/cms";
import type { BlockType, PageBlock, SeoSettings } from "@/types/page";

export type PortalAudience = "guest" | "student" | "teacher" | "admin";

export interface PortalBlockConditions {
  /** Audiencias permitidas (vacío = todas) */
  roles?: PortalAudience[];
  /** Feature flag requerido en `features` */
  featureFlag?: keyof FeatureFlags;
  /** Visible desde (ISO) */
  dateFrom?: string;
  /** Visible hasta (ISO) */
  dateTo?: string;
  /** Código de idioma */
  language?: string;
  /** Tenants permitidos (vacío = todos) */
  tenantIds?: string[];
}

export interface PortalRenderContext {
  tenantId: string;
  audience: PortalAudience;
  featureFlags: FeatureFlags;
  language?: string;
  preview?: boolean;
}

export interface PortalBlockDefinition {
  type: BlockType;
  version: number;
  name: string;
  category: string;
  /** Identificador del componente UI */
  component: string;
  /** Clave del resolver de datos (si aplica) */
  resolver?: string;
  queryDriven?: boolean;
  adminOnly?: boolean;
}

export interface PortalPageModel {
  slug: string;
  title: string;
  blocks: PageBlock[];
  seo: SeoSettings;
  tenantId: string;
}

export interface PortalSeoPayload {
  title?: string;
  description?: string;
  keywords?: string[];
  jsonLd: Record<string, unknown>[];
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
  };
}

export interface ResolvedBlockData {
  blockId: string;
  type: BlockType;
  items?: unknown[];
  media?: Record<string, string | undefined>;
  error?: boolean;
}
