import "server-only";

import {
  PortalFeatureGrid,
  extractFeatureGridItems,
} from "@/components/portal/experience/feature-grid";
import { WhyStudyPremiumExperience } from "@/components/portal/home/why-study";
import type { PortalFeatureGridSettings } from "@/types/feature-grid";
import { blockSettings } from "@/lib/portal/blocks";
import {
  mergeHomeFeatureGridSettings,
  withHomeDemoFeatures,
} from "@/lib/portal/institutional-demo";
import { isHomePageSlug } from "@/lib/portal/home-experience";
import type { PageBlock } from "@/types/page";

interface FeatureGridBlockSectionProps {
  block: PageBlock;
  id?: string;
  muted?: boolean;
  pageSlug?: string;
}

export function FeatureGridBlockSection({
  block,
  id = "feature-grid",
  muted = false,
  pageSlug,
}: FeatureGridBlockSectionProps) {
  const settings = mergeHomeFeatureGridSettings(
    blockSettings<PortalFeatureGridSettings>(block),
    pageSlug
  );
  const features = withHomeDemoFeatures(extractFeatureGridItems(block), pageSlug);

  if (isHomePageSlug(pageSlug ?? "")) {
    return (
      <WhyStudyPremiumExperience
        settings={settings}
        id={id}
        muted={muted}
      />
    );
  }

  return (
    <PortalFeatureGrid
      settings={settings}
      features={features}
      id={id}
      muted={muted}
    />
  );
}
