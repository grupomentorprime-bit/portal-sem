/** Contrato de datos — Portal Catalog Card v1.0 (LOCKED) */

export const PORTAL_CATALOG_CARD_VARIANTS = [
  "default",
  "featured",
  "compact",
  "horizontal",
  "minimal",
] as const;

export type PortalCatalogCardVariant = (typeof PORTAL_CATALOG_CARD_VARIANTS)[number];

export interface PortalCatalogCardData {
  id: string;
  image?: string;
  /** Icono de respaldo cuando no hay imagen */
  imageIcon?: string;
  title: string;
  description?: string;
  badge?: string;
  category?: string;
  modality?: string;
  duration?: string;
  level?: string;
  /** Color de acento desde CMS (token o valor de marca) */
  color?: string;
  url: string;
  featured?: boolean;
  comingSoon?: boolean;
  disabled?: boolean;
}

export interface PortalCatalogCardProps extends PortalCatalogCardData {
  variant?: PortalCatalogCardVariant;
  ctaLabel?: string;
  priorityImage?: boolean;
  staggerIndex?: number;
  className?: string;
}
