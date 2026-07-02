import {
  PortalTimeline,
  processStepsToTimelineItems,
} from "@/components/portal/experience/timeline";
import type { AdmissionProcessStep } from "@/types/admission";
import type { CmsSectionLayout } from "@/types/cms-shared";
import type { PortalTimelineSettings } from "@/types/timeline";

interface AdmissionTimelineProps {
  steps: AdmissionProcessStep[];
  layout?: CmsSectionLayout;
  anchor?: string;
}

export function AdmissionTimeline({ steps, layout, anchor }: AdmissionTimelineProps) {
  if (steps.length === 0) return null;

  const settings: PortalTimelineSettings = {
    overline: layout?.badge,
    title: layout?.title ?? "",
    description: layout?.description,
    layout: "auto",
    variant: "process",
  };

  return (
    <PortalTimeline
      settings={settings}
      items={processStepsToTimelineItems(steps)}
      id={anchor ?? "proceso-postulacion"}
      muted={layout?.muted ?? true}
    />
  );
}
