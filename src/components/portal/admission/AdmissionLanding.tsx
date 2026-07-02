import type { AdmissionConfig } from "@/types/admission";
import type { ReactNode } from "react";
import { sortVisibleHeroItems } from "@/lib/portal/admission-hero-utils";
import { AdmissionDatesHighlightBar } from "./AdmissionDatesHighlightBar";
import { AdmissionHero } from "./AdmissionHero";

interface AdmissionLandingProps {
  config: AdmissionConfig;
  tenant: string;
  sectionId?: string;
  breadcrumb?: ReactNode;
}

export async function AdmissionLanding({
  config,
  tenant,
  sectionId,
  breadcrumb,
}: AdmissionLandingProps) {
  if (!config.hero.enabled && !config.datesHighlight.enabled) {
    return null;
  }

  const primaryAction =
    sortVisibleHeroItems(config.hero.actions).find((action) => action.variant === "primary") ??
    sortVisibleHeroItems(config.hero.actions)[0];

  return (
    <div className="admission-landing">
      <AdmissionHero
        content={config.hero}
        tenant={tenant}
        sectionId={sectionId}
        breadcrumb={breadcrumb}
      />
      <AdmissionDatesHighlightBar
        config={config.datesHighlight}
        primaryAction={primaryAction}
      />
    </div>
  );
}
