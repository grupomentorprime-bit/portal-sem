import "server-only";

import { PortalTimeline, extractTimelineItems } from "@/components/portal/experience/timeline";
import type { PortalTimelineSettings } from "@/types/timeline";
import { blockSettings } from "@/lib/portal/blocks";
import { withHomeDemoTimeline } from "@/lib/portal/institutional-demo";
import type { PageBlock } from "@/types/page";

interface TimelineBlockSectionProps {
  block: PageBlock;
  id?: string;
  muted?: boolean;
  pageSlug?: string;
}

export function TimelineBlockSection({
  block,
  id = "timeline",
  muted = false,
  pageSlug,
}: TimelineBlockSectionProps) {
  const settings = blockSettings<PortalTimelineSettings>(block);

  return (
    <PortalTimeline
      settings={settings}
      items={withHomeDemoTimeline(extractTimelineItems(block), pageSlug)}
      id={id}
      muted={muted}
    />
  );
}
