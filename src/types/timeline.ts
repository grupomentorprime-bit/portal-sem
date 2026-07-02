import type { ReactNode } from "react";

/** Experience Module — Timeline v1.0 (LOCKED) */

export const TIMELINE_STATUSES = ["pending", "active", "completed", "upcoming"] as const;
export type PortalTimelineStatus = (typeof TIMELINE_STATUSES)[number];

export const TIMELINE_LAYOUTS = ["horizontal", "vertical", "auto"] as const;
export type PortalTimelineLayout = (typeof TIMELINE_LAYOUTS)[number];

export const TIMELINE_VARIANTS = [
  "process",
  "chronology",
  "calendar",
  "route",
  "steps",
  "roadmap",
] as const;
export type PortalTimelineVariant = (typeof TIMELINE_VARIANTS)[number];

export interface PortalTimelineItem {
  id: string;
  step?: number;
  title: string;
  description?: string;
  icon?: string;
  order?: number;
  status?: PortalTimelineStatus;
  color?: string;
  date?: string;
  visible?: boolean;
  url?: string;
}

export interface PortalTimelineSettings extends Record<string, unknown> {
  overline?: string;
  title?: string;
  description?: string;
  layout?: PortalTimelineLayout;
  variant?: PortalTimelineVariant;
  emptyTitle?: string;
  emptyDescription?: string;
}

export interface PortalTimelineProps {
  settings: PortalTimelineSettings;
  items: PortalTimelineItem[];
  id?: string;
  muted?: boolean;
  footer?: ReactNode;
}
