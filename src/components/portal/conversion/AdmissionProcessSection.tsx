/**
 * @deprecated
 *
 * Reemplazado por:
 * PortalTimeline
 *
 * @see docs/core/CORE-TIMELINE-v1.md
 */

import {
  PortalTimeline,
  processStepsToTimelineItems,
} from "@/components/portal/experience/timeline";
import { PortalCTAButtons } from "@/components/portal/experience/cta-premium/PortalCTAButtons";
import type { ProcessStepItem } from "@/lib/portal/blocks";
import type { PortalCtaButton } from "@/types/cta-premium";
import type { PortalTimelineLayout, PortalTimelineSettings, PortalTimelineVariant } from "@/types/timeline";

interface AdmissionProcessSectionProps {
  overline?: string;
  title?: string;
  description?: string;
  items: ProcessStepItem[];
  layout?: PortalTimelineLayout;
  variant?: PortalTimelineVariant;
  buttons?: PortalCtaButton[];
}

/** @deprecated Usar PortalTimeline */
export function AdmissionProcessSection({
  overline,
  title,
  description,
  items,
  layout = "auto",
  variant = "steps",
  buttons = [],
}: AdmissionProcessSectionProps) {
  const sectionTitle = title?.trim();
  if (!sectionTitle || items.length === 0) return null;

  const settings: PortalTimelineSettings = {
    overline,
    title: sectionTitle,
    description,
    layout,
    variant,
  };

  return (
    <PortalTimeline
      settings={settings}
      items={processStepsToTimelineItems(items)}
      id="proceso-admision"
      muted
      footer={
        buttons.length > 0 ? (
          <div className="admission-process__footer mt-10 flex justify-center">
            <PortalCTAButtons buttons={buttons} className="justify-center" />
          </div>
        ) : undefined
      }
    />
  );
}
