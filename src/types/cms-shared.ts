/**
 * OT-CMSV2-BUILD-001 — Tipos compartidos del motor CMS Visual.
 * Reutilizables en Admisión, Home, Programas y futuros portales.
 */

export type CmsAlignment = "left" | "center" | "right";
export type CmsAnimation = "fade" | "slide" | "zoom" | "none";
export type CmsMaxWidth = "sm" | "md" | "lg" | "full";
export type CmsCtaVariant = "solid" | "outlined" | "ghost";
export type CmsFormFieldType =
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "date"
  | "select"
  | "checkbox"
  | "radio"
  | "file";

export interface CmsBackground {
  type: "color" | "image" | "video" | "gradient";
  color?: string;
  imageMediaId?: string;
  videoMediaId?: string;
  gradient?: string;
  overlay?: number;
}

export interface CmsSectionLayout {
  badge?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  background?: CmsBackground;
  paddingTop?: "sm" | "md" | "lg" | "none";
  paddingBottom?: "sm" | "md" | "lg" | "none";
  maxWidth?: CmsMaxWidth;
  alignment?: CmsAlignment;
  animation?: CmsAnimation;
  muted?: boolean;
}

export interface CmsSectionSeo {
  anchor?: string;
  slug?: string;
  title?: string;
  description?: string;
  openGraphImageId?: string;
}

export interface CmsCTA {
  id: string;
  text: string;
  url: string;
  icon?: string;
  variant: CmsCtaVariant;
}

export interface CmsCardItem {
  id: string;
  icon?: string;
  imageMediaId?: string;
  title: string;
  subtitle?: string;
  description?: string;
  link?: string;
  buttonText?: string;
  color?: string;
  background?: string;
}

export interface CmsTimelineItem {
  id: string;
  step: number;
  title: string;
  description: string;
  icon?: string;
  color?: string;
  status?: "completed" | "active" | "upcoming" | "pending";
}

export interface CmsFaqItem {
  id: string;
  question: string;
  answer: string;
  enabled?: boolean;
  order?: number;
}

export interface CmsPricingItem {
  id: string;
  name: string;
  price: string;
  description?: string;
  icon?: string;
  highlighted?: boolean;
  color?: string;
  buttonText?: string;
  buttonUrl?: string;
  note?: string;
}

export interface CmsDocumentItem {
  id: string;
  name: string;
  description?: string;
  required: boolean;
  icon?: string;
  order?: number;
}

export interface CmsRequirementItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  order?: number;
}

export interface CmsIndicatorItem {
  id: string;
  value: string;
  label: string;
  icon?: string;
  link?: string;
}

export interface CmsSealItem {
  id: string;
  label?: string;
  imageMediaId?: string;
  assetId?: string;
}

export interface CmsDateItem {
  id: string;
  label: string;
  value: string;
  icon?: string;
}

export interface CmsFormField {
  id: string;
  type: CmsFormFieldType;
  name: string;
  label: string;
  placeholder?: string;
  required: boolean;
  regex?: string;
  width: "full" | "half";
  options?: Array<{ value: string; label: string }>;
  helper?: string;
  order?: number;
}

export interface CmsContactInfo {
  email?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  linkedin?: string;
  schedule?: string;
  address?: string;
  mapUrl?: string;
}

export interface CmsFooterColumn {
  id: string;
  title: string;
  items: Array<{ id: string; label: string; href: string }>;
}

export interface CmsSocialLink {
  id: string;
  platform: string;
  url: string;
  icon?: string;
}

export interface CmsVersionSnapshot<T> {
  id: string;
  label: string;
  savedAt: string;
  status: "draft" | "published";
  data: T;
}

export const DEFAULT_CMS_SECTION_LAYOUT: CmsSectionLayout = {
  alignment: "left",
  animation: "none",
  maxWidth: "lg",
  paddingTop: "md",
  paddingBottom: "md",
};

export function createCmsId(prefix = "cms"): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
