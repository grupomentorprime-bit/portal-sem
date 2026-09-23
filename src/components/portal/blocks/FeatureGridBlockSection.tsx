import "server-only";

import {
  PortalFeatureGrid,
  extractFeatureGridItems,
} from "@/components/portal/experience/feature-grid";
import { SemHomeFormation } from "@/components/portal/home/formation/SemHomeFormation";
import { WhyStudyPremiumExperience } from "@/components/portal/home/why-study";
import { isSemTenant } from "@/core/tenant/is-sem";
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
  tenant?: string;
  id?: string;
  muted?: boolean;
  pageSlug?: string;
}

export function FeatureGridBlockSection({
  block,
  tenant,
  id = "feature-grid",
  muted = false,
  pageSlug,
}: FeatureGridBlockSectionProps) {
  const settings = mergeHomeFeatureGridSettings(
    blockSettings<PortalFeatureGridSettings>(block),
    pageSlug,
    tenant
  );
  const features = withHomeDemoFeatures(
    extractFeatureGridItems(block),
    pageSlug,
    tenant
  );

  if (isHomePageSlug(pageSlug ?? "") && isSemTenant(tenant)) {
    return <SemHomeFormation settings={settings} features={features} id={id} />;
  }

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
