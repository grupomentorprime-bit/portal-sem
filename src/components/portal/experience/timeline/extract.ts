import type { ProcessStepItem } from "@/lib/portal/blocks";
import type { PageBlock } from "@/types/page";
import type { PortalTimelineItem, PortalTimelineStatus } from "@/types/timeline";

const VALID_STATUSES = new Set<PortalTimelineStatus>([
  "pending",
  "active",
  "completed",
  "upcoming",
]);

function parseStatus(value: unknown): PortalTimelineStatus | undefined {
  if (typeof value === "string" && VALID_STATUSES.has(value as PortalTimelineStatus)) {
    return value as PortalTimelineStatus;
  }
  return undefined;
}

function isVisible(value: unknown): boolean {
  return value !== false;
}

export function extractTimelineItems(block: PageBlock | undefined): PortalTimelineItem[] {
  const raw = block?.settings?.items;
  if (!Array.isArray(raw)) return [];

  return raw
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null && "title" in item
    )
    .map((item, index) => ({
      id: String(item.id ?? `timeline-${index + 1}`),
      step: typeof item.step === "number" ? item.step : index + 1,
      title: String(item.title),
      description: item.description ? String(item.description) : undefined,
      icon: item.icon ? String(item.icon) : undefined,
      order: typeof item.order === "number" ? item.order : index,
      status: parseStatus(item.status),
      color: item.color ? String(item.color) : undefined,
      date: item.date ? String(item.date) : undefined,
      visible: isVisible(item.visible),
      url: item.url ? String(item.url) : undefined,
    }))
    .filter((item) => item.visible)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function processStepsToTimelineItems(steps: ProcessStepItem[]): PortalTimelineItem[] {
  return steps.map((step, index) => ({
    id: step.id,
    step: step.step,
    title: step.title,
    description: step.description,
    icon: step.icon,
    url: step.url,
    order: index,
    visible: true,
    status: step.status,
  }));
}
