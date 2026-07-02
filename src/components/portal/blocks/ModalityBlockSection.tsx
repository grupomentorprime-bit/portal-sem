import "server-only";

import { ModalitySectionContent } from "@/components/portal/institution/InstitutionSectionContent";
import { MethodologyHomeExperience } from "@/components/portal/home/methodology";
import { blockSettings, extractModalityItems } from "@/lib/portal/blocks";
import { isHomePageSlug } from "@/lib/portal/home-experience";
import { resolveMediaRef } from "@/core/media";
import type { PageBlock } from "@/types/page";

interface ModalityBlockSectionProps {
  block: PageBlock;
  tenant: string;
  pageSlug?: string;
}

export async function ModalityBlockSection({
  block,
  tenant,
  pageSlug,
}: ModalityBlockSectionProps) {
  const settings = blockSettings<{
    overline?: string;
    title?: string;
    subtitle?: string;
    description?: string;
    image?: string;
    imageMediaId?: string;
    buttonLabel?: string;
    buttonHref?: string;
  }>(block);

  const image = await resolveMediaRef(tenant, {
    mediaId: settings.imageMediaId,
    legacyUrl: settings.image,
  });

  const items = extractModalityItems(block);

  if (isHomePageSlug(pageSlug ?? "")) {
    return (
      <MethodologyHomeExperience
        overline={settings.overline}
        title={settings.title}
        subtitle={settings.subtitle}
        description={settings.description}
        items={items}
      />
    );
  }

  return (
    <ModalitySectionContent
      overline={settings.overline}
      title={settings.title}
      subtitle={settings.subtitle}
      description={settings.description}
      items={extractModalityItems(block)}
      image={image ?? undefined}
      buttonLabel={settings.buttonLabel}
      buttonHref={settings.buttonHref}
    />
  );
}
