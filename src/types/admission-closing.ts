/**
 * OT-PORTAL-005 — Cierre Institucional del Centro de Admisión.
 * Bloques independientes, ordenables y activables desde CMS.
 */

export type AdmissionClosingBlockType =
  | "message"
  | "actions"
  | "indicators"
  | "quote"
  | "contact"
  | "footer"
  | "backdrop"
  | "seal"
  | "copyright"
  | "benefits"
  | "final_cta";

export type AdmissionClosingAlignment = "left" | "center" | "right";

export type AdmissionClosingButtonVariant = "primary" | "secondary" | "outline" | "ghost";

export type AdmissionClosingLinkType =
  | "page"
  | "program"
  | "news"
  | "library"
  | "url"
  | "file"
  | "email"
  | "phone";

export type AdmissionClosingBackdropMode =
  | "image"
  | "video"
  | "pattern"
  | "texture"
  | "gradient";

export type AdmissionClosingSealType = "default" | "compact" | "emblem";

export type AdmissionClosingSealTone = "primary" | "secondary" | "accent" | "inverse";

export type AdmissionClosingSealPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center";

export type AdmissionClosingSealSize = "sm" | "md" | "lg";

export interface AdmissionClosingBlockBase {
  id: string;
  type: AdmissionClosingBlockType;
  enabled: boolean;
  order: number;
}

export interface AdmissionClosingMessageData {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  mediaId?: string;
  overlay: number;
  alignment: AdmissionClosingAlignment;
}

export interface AdmissionClosingActionItem {
  id: string;
  label: string;
  icon?: string;
  href: string;
  openInNewTab?: boolean;
  variant: AdmissionClosingButtonVariant;
  order: number;
  visible: boolean;
}

export interface AdmissionClosingActionsData {
  items: AdmissionClosingActionItem[];
}

export interface AdmissionClosingIndicator {
  id: string;
  icon?: string;
  title: string;
  value: string;
  description?: string;
  visible: boolean;
  order: number;
}

export interface AdmissionClosingIndicatorsData {
  items: AdmissionClosingIndicator[];
}

export interface AdmissionClosingQuoteItem {
  id: string;
  text: string;
  author?: string;
  reference?: string;
  showQuotes: boolean;
  showSignature: boolean;
  visible: boolean;
  order: number;
}

export interface AdmissionClosingQuotesData {
  items: AdmissionClosingQuoteItem[];
}

export interface AdmissionClosingSocialLink {
  id: string;
  platform: string;
  url: string;
  visible: boolean;
}

export interface AdmissionClosingContactData {
  title: string;
  description: string;
  email: string;
  phone: string;
  whatsapp?: string;
  schedule?: string;
  address?: string;
  mapEmbedUrl?: string;
  social: AdmissionClosingSocialLink[];
}

export interface AdmissionClosingFooterItem {
  id: string;
  text: string;
  type: AdmissionClosingLinkType;
  url?: string;
  order: number;
}

export interface AdmissionClosingFooterColumn {
  id: string;
  title: string;
  items: AdmissionClosingFooterItem[];
  order: number;
  visible: boolean;
}

export interface AdmissionClosingFooterData {
  columns: AdmissionClosingFooterColumn[];
}

export interface AdmissionClosingBackdropData {
  mode: AdmissionClosingBackdropMode;
  imageMediaId?: string;
  videoMediaId?: string;
  pattern?: string;
  texture?: string;
  overlay: number;
  gradientFrom?: string;
  gradientTo?: string;
  opacity: number;
  parallax: boolean;
  blur: boolean;
}

export interface AdmissionClosingSealData {
  lines: string[];
  sealType: AdmissionClosingSealType;
  tone: AdmissionClosingSealTone;
  position: AdmissionClosingSealPosition;
  opacity: number;
  size: AdmissionClosingSealSize;
}

export interface AdmissionClosingCopyrightData {
  primaryText: string;
  secondaryText?: string;
  developerText?: string;
  developerName?: string;
  developerUrl?: string;
}

export interface AdmissionClosingBenefitItem {
  id: string;
  icon?: string;
  label: string;
  visible: boolean;
  order: number;
}

export interface AdmissionClosingBenefitsData {
  items: AdmissionClosingBenefitItem[];
}

export interface AdmissionClosingFinalCtaData {
  icon?: string;
  title: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
  openInNewTab?: boolean;
}

export type AdmissionClosingBlock =
  | (AdmissionClosingBlockBase & { type: "message"; data: AdmissionClosingMessageData })
  | (AdmissionClosingBlockBase & { type: "actions"; data: AdmissionClosingActionsData })
  | (AdmissionClosingBlockBase & { type: "indicators"; data: AdmissionClosingIndicatorsData })
  | (AdmissionClosingBlockBase & { type: "quote"; data: AdmissionClosingQuotesData })
  | (AdmissionClosingBlockBase & { type: "contact"; data: AdmissionClosingContactData })
  | (AdmissionClosingBlockBase & { type: "footer"; data: AdmissionClosingFooterData })
  | (AdmissionClosingBlockBase & { type: "backdrop"; data: AdmissionClosingBackdropData })
  | (AdmissionClosingBlockBase & { type: "seal"; data: AdmissionClosingSealData })
  | (AdmissionClosingBlockBase & { type: "copyright"; data: AdmissionClosingCopyrightData })
  | (AdmissionClosingBlockBase & { type: "benefits"; data: AdmissionClosingBenefitsData })
  | (AdmissionClosingBlockBase & { type: "final_cta"; data: AdmissionClosingFinalCtaData });

export interface AdmissionClosingConfig {
  enabled: boolean;
  blocks: AdmissionClosingBlock[];
}

export const ADMISSION_CLOSING_BLOCK_LABELS: Record<AdmissionClosingBlockType, string> = {
  message: "Mensaje",
  actions: "Botones",
  indicators: "Indicadores",
  quote: "Frase institucional",
  contact: "Contacto",
  footer: "Footer",
  backdrop: "Fondo",
  seal: "Sello",
  copyright: "Copyright",
  benefits: "Beneficios",
  final_cta: "Llamado final",
};
