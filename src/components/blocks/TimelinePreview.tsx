/**
 * @deprecated
 *
 * Reemplazado por:
 * PortalTimeline
 *
 * @see docs/core/CORE-TIMELINE-v1.md
 */

import { asString } from "@/lib/cms/block-utils";
import { PortalTimeline } from "@/components/portal/experience/timeline";
import { extractTimelineItems } from "@/components/portal/experience/timeline/extract";
import type { PageBlock } from "@/types/page";

interface TimelinePreviewProps {
  settings: Record<string, unknown>;
}

export function TimelinePreview({ settings }: TimelinePreviewProps) {
  const block: PageBlock = {
    id: "preview-timeline",
    type: "timeline",
    visible: true,
    order: 0,
    settings,
  };

  return (
    <PortalTimeline
      settings={{
        overline: asString(settings.overline) || undefined,
        title: asString(settings.title) || undefined,
        description: asString(settings.description) || undefined,
        layout: settings.layout as "auto" | "horizontal" | "vertical" | undefined,
        variant: settings.variant as
          | "process"
          | "chronology"
          | "calendar"
          | "route"
          | "steps"
          | "roadmap"
          | undefined,
        emptyTitle: asString(settings.emptyTitle) || undefined,
        emptyDescription: asString(settings.emptyDescription) || undefined,
      }}
      items={extractTimelineItems(block)}
    />
  );
}
