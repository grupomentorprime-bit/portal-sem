/** Experience Module — News Grid v1.0 (LOCKED) */

import type { ContentStatus } from "@/types/content";

export interface PortalNewsCardData {
  id: string;
  image?: string;
  category?: string;
  date?: string;
  title: string;
  excerpt?: string;
  readTime?: string;
  author?: string;
  href: string;
  featured?: boolean;
  status?: ContentStatus;
}

export interface PortalNewsGridSettings extends Record<string, unknown> {
  overline?: string;
  title?: string;
  description?: string;
  showButton?: boolean;
  buttonLabel?: string;
  buttonHref?: string;
  cardCtaLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
  errorTitle?: string;
  errorDescription?: string;
}

export interface PortalNewsGridProps {
  settings: PortalNewsGridSettings;
  items: PortalNewsCardData[];
  error?: boolean;
  id?: string;
  muted?: boolean;
}
