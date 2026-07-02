"use client";

import { AudienceProfilesExperience } from "@/components/portal/home/audience";
import { useResolvedMediaUrl } from "@/hooks/useResolvedMediaUrl";
import { asString } from "@/lib/cms/block-utils";
import { parseAudienceProfiles } from "@/lib/portal/audience-profiles";
import {
  mergeHomeAudienceProfilesSettings,
  withHomeDemoAudienceProfiles,
} from "@/lib/portal/institutional-demo";
import { isHomePageSlug } from "@/lib/portal/home-experience";

interface AudienceProfilesPreviewProps {
  settings: Record<string, unknown>;
  pageSlug?: string;
}

export function AudienceProfilesPreview({ settings, pageSlug }: AudienceProfilesPreviewProps) {
  const merged = mergeHomeAudienceProfilesSettings(settings, pageSlug);
  const profiles = withHomeDemoAudienceProfiles(parseAudienceProfiles(settings.profiles), pageSlug);
  const image = useResolvedMediaUrl(
    asString(merged.imageMediaId) || undefined,
    asString(merged.image) || undefined
  );

  return (
    <AudienceProfilesExperience
      overline={asString(merged.overline) || undefined}
      title={asString(merged.title) || undefined}
      description={asString(merged.description) || undefined}
      profiles={profiles}
      image={image}
      imageAlt={asString(merged.imageAlt) || undefined}
      quote={asString(merged.quote) || undefined}
      ctaLabel={asString(merged.ctaLabel) || undefined}
      ctaHref={asString(merged.ctaHref) || undefined}
      id={isHomePageSlug(pageSlug ?? "") ? "perfil-postulante" : "audience-profiles"}
    />
  );
}
