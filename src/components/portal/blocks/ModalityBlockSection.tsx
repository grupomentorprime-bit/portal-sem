import "server-only";

import { ModalitySectionContent } from "@/components/portal/institution/InstitutionSectionContent";
import { blockSettings, extractModalityItems } from "@/lib/portal/blocks";
import { resolveMediaRef } from "@/core/media";
import type { PageBlock } from "@/types/page";

interface ModalityBlockSectionProps {
  block: PageBlock;
  tenant: string;
}

export async function ModalityBlockSection({ block, tenant }: ModalityBlockSectionProps) {
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
