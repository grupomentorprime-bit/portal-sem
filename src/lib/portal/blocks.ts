import type { NewsItem } from "@/types/content";
import type { PageBlock } from "@/types/page";
import type { PortalTimelineStatus } from "@/types/timeline";
import { asString } from "@/lib/cms/block-utils";

export interface EmptyStateSettings {
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
}

export function emptyStateFromSettings(
  settings: Record<string, unknown> | undefined,
  defaults: Required<Pick<EmptyStateSettings, "emptyTitle" | "emptyDescription">> &
    Partial<Pick<EmptyStateSettings, "emptyActionLabel" | "emptyActionHref">>
): EmptyStateSettings {
  return {
    emptyTitle: asString(settings?.emptyTitle, defaults.emptyTitle),
    emptyDescription: asString(settings?.emptyDescription, defaults.emptyDescription),
    emptyActionLabel: asString(settings?.emptyActionLabel, defaults.emptyActionLabel ?? ""),
    emptyActionHref: asString(settings?.emptyActionHref, defaults.emptyActionHref ?? ""),
  };
}

export function findBlock(pageBlocks: PageBlock[] | undefined, type: string) {
  return pageBlocks?.find((b) => b.visible && b.type === type);
}

export function blockSettings<T extends Record<string, unknown>>(
  block: PageBlock | undefined
): Partial<T> {
  if (!block?.settings) return {};
  return block.settings as Partial<T>;
}

export interface StatItem {
  id: string;
  value: string;
  label: string;
}

export function extractStats(block: PageBlock | undefined): StatItem[] {
  const items = block?.settings?.items;
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is StatItem => {
      return (
        typeof item === "object" &&
        item !== null &&
        "value" in item &&
        "label" in item
      );
    })
    .map((item) => ({
      id: String(item.id ?? item.label),
      value: String(item.value),
      label: String(item.label),
    }));
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export function extractHighlights(block: PageBlock | undefined): FeatureItem[] {
  const items = block?.settings?.highlights;
  if (!Array.isArray(items)) return extractFeatures(block);
  return items
    .filter((item): item is FeatureItem => {
      return (
        typeof item === "object" &&
        item !== null &&
        "title" in item &&
        "description" in item
      );
    })
    .map((item) => ({
      id: String(item.id ?? item.title),
      title: String(item.title),
      description: String(item.description),
      icon: item.icon ? String(item.icon) : undefined,
    }));
}

export function extractModalityItems(block: PageBlock | undefined): FeatureItem[] {
  return extractFeatures(block);
}

export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  resourceType?: string;
  icon?: string;
  href: string;
  image?: string;
  ctaLabel?: string;
}

export function extractResources(block: PageBlock | undefined): ResourceItem[] {
  const items = block?.settings?.items;
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is ResourceItem => {
      return (
        typeof item === "object" &&
        item !== null &&
        "title" in item &&
        "href" in item
      );
    })
    .map((item) => ({
      id: String(item.id ?? item.title),
      title: String(item.title),
      description: String(item.description ?? ""),
      resourceType: item.resourceType ? String(item.resourceType) : undefined,
      icon: item.icon ? String(item.icon) : undefined,
      href: String(item.href),
      image: item.image ? String(item.image) : undefined,
      ctaLabel: item.ctaLabel ? String(item.ctaLabel) : undefined,
    }));
}

export function splitNewsItems(items: NewsItem[]): {
  featured: NewsItem | null;
  secondary: NewsItem[];
} {
  if (items.length === 0) return { featured: null, secondary: [] };
  const featuredIndex = items.findIndex((item) => item.featured);
  const index = featuredIndex >= 0 ? featuredIndex : 0;
  const featured = items[index];
  const secondary = items.filter((_, i) => i !== index).slice(0, 3);
  return { featured, secondary };
}

export function extractFeatures(block: PageBlock | undefined): FeatureItem[] {
  const items = block?.settings?.items;
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is FeatureItem => {
      return (
        typeof item === "object" &&
        item !== null &&
        "title" in item &&
        "description" in item
      );
    })
    .map((item) => ({
      id: String(item.id ?? item.title),
      title: String(item.title),
      description: String(item.description),
      icon: item.icon ? String(item.icon) : undefined,
    }));
}

export interface ProcessStepItem {
  id: string;
  step: number;
  title: string;
  description: string;
  icon?: string;
  url?: string;
  status?: PortalTimelineStatus;
}

export function extractProcessSteps(block: PageBlock | undefined): ProcessStepItem[] {
  const items = block?.settings?.items;
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is ProcessStepItem => {
      return typeof item === "object" && item !== null && "title" in item;
    })
    .map((item, index) => ({
      id: String(item.id ?? `step-${index + 1}`),
      step: Number(item.step ?? index + 1),
      title: String(item.title),
      description: String(item.description ?? ""),
      icon: item.icon ? String(item.icon) : undefined,
      url: item.url ? String(item.url) : undefined,
      status:
        typeof item.status === "string"
          ? (item.status as PortalTimelineStatus)
          : undefined,
    }));
}

export interface ScholarshipItem {
  id: string;
  kind: string;
  title: string;
  description: string;
}

export function extractScholarshipItems(block: PageBlock | undefined): ScholarshipItem[] {
  const items = block?.settings?.items;
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is ScholarshipItem => {
      return typeof item === "object" && item !== null && "title" in item;
    })
    .map((item, index) => ({
      id: String(item.id ?? `scholarship-${index}`),
      kind: String(item.kind ?? "benefit"),
      title: String(item.title),
      description: String(item.description ?? ""),
    }));
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export function extractFaqItems(block: PageBlock | undefined): FaqItem[] {
  const items = block?.settings?.items;
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is FaqItem => {
      return typeof item === "object" && item !== null && "question" in item;
    })
    .map((item, index) => ({
      id: String(item.id ?? `faq-${index}`),
      question: String(item.question),
      answer: String(item.answer ?? ""),
    }));
}
