import "server-only";

import { AudienceProfilesExperience } from "@/components/portal/home/audience";
import { resolveMediaRef } from "@/core/media";
import { asString } from "@/lib/cms/block-utils";
import { parseAudienceProfiles } from "@/lib/portal/audience-profiles";
import { blockSettings } from "@/lib/portal/blocks";
import {
  mergeHomeAudienceProfilesSettings,
  withHomeDemoAudienceProfiles,
} from "@/lib/portal/institutional-demo";
import type { PageBlock } from "@/types/page";

interface AudienceProfilesBlockSectionProps {
  block: PageBlock;
  tenant: string;
  pageSlug?: string;
}

export async function AudienceProfilesBlockSection({
  block,
  tenant,
  pageSlug,
}: AudienceProfilesBlockSectionProps) {
  const settings = mergeHomeAudienceProfilesSettings(blockSettings(block), pageSlug);
  const profiles = withHomeDemoAudienceProfiles(parseAudienceProfiles(block.settings?.profiles), pageSlug);
  const image = await resolveMediaRef(tenant, {
    mediaId: asString(settings.imageMediaId) || undefined,
    legacyUrl: asString(settings.image) || undefined,
  });

  return (
    <AudienceProfilesExperience
      overline={asString(settings.overline)}
      title={asString(settings.title)}
      description={asString(settings.description)}
      profiles={profiles}
      image={image ?? undefined}
      imageAlt={asString(settings.imageAlt) || undefined}
      quote={asString(settings.quote) || undefined}
      ctaLabel={asString(settings.ctaLabel) || undefined}
      ctaHref={asString(settings.ctaHref) || undefined}
    />
  );
}
