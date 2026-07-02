export const PAGE_STATUSES = ["draft", "published", "scheduled", "archived"] as const;
export type PageStatus = (typeof PAGE_STATUSES)[number];

export const PAGE_TEMPLATES = [
  "institutional",
  "landing",
  "program",
  "news",
  "team",
  "library",
  "contact",
] as const;
export type PageTemplate = (typeof PAGE_TEMPLATES)[number];

export const BLOCK_TYPES = [
  "hero",
  "text",
  "presentation",
  "feature_grid",
  "audience_profiles",
  "modality",
  "programs",
  "academic_offer",
  "seminarios_home",
  "teachers",
  "people",
  "news",
  "events",
  "academic_agenda",
  "institutional_notices",
  "library",
  "resources",
  "cta",
  "cta_premium",
  "testimonials",
  "gallery",
  "stats",
  "video",
  "verse",
  "contact",
  "admission_process",
  "timeline",
  "scholarships",
  "faq",
  "quick_contact",
  "contact_hub",
  "experience_form",
  "footer_premium",
  "alliance",
  "divider",
  "html",
  "markdown",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export interface SeoSettings {
  title?: string;
  description?: string;
  keywords?: string[];
  /** @deprecated Usar ogImageMediaId */
  ogImage?: string;
  ogImageMediaId?: string;
  twitterImageMediaId?: string;
  noIndex?: boolean;
}

export interface PageBlock {
  id: string;
  type: BlockType;
  visible: boolean;
  order: number;
  settings: BlockSettings;
}

export interface PageVersion {
  title: string;
  blocks: PageBlock[];
  seo: SeoSettings;
  savedAt: string;
}

export interface CmsPage {
  _id: string;
  tenant: string;
  title: string;
  slug: string;
  description: string;
  status: PageStatus;
  template: PageTemplate;
  seo: SeoSettings;
  blocks: PageBlock[];
  scheduledAt?: string;
  versions: PageVersion[];
  createdAt: string;
  updatedAt: string;
}

export type CmsPageCreate = Pick<
  CmsPage,
  "_id" | "tenant" | "title" | "slug" | "description" | "template" | "seo" | "blocks"
> & {
  status?: PageStatus;
  scheduledAt?: string;
};

export type CmsPageUpdate = Pick<
  CmsPage,
  | "title"
  | "slug"
  | "description"
  | "status"
  | "template"
  | "seo"
  | "blocks"
  | "scheduledAt"
>;

export interface BlockDefinition {
  _id: BlockType;
  name: string;
  component: string;
  category: string;
  enabled: boolean;
  adminOnly?: boolean;
}

export interface CmsTemplate {
  _id: string;
  name: string;
  description: string;
  template: PageTemplate;
  blocks: Array<{ type: BlockType; settings?: Partial<BlockSettings> }>;
  enabled: boolean;
}

export type BlockSettings = Record<string, unknown>;

export interface PageValidationError {
  field: string;
  message: string;
}
