import "server-only";

import { VerseSectionContent } from "@/components/portal/institution/InstitutionSectionContent";
import { blockSettings } from "@/lib/portal/blocks";
import { resolveMediaRef } from "@/core/media";
import type { PageBlock } from "@/types/page";

interface VerseBlockSectionProps {
  block: PageBlock;
  tenant: string;
}

export async function VerseBlockSection({ block, tenant }: VerseBlockSectionProps) {
  const settings = blockSettings<{
    text?: string;
    reference?: string;
    background?: string;
    image?: string;
    imageMediaId?: string;
  }>(block);

  const image = await resolveMediaRef(tenant, {
    mediaId: settings.imageMediaId,
    legacyUrl: settings.image,
  });

  return (
    <VerseSectionContent
      text={settings.text}
      reference={settings.reference}
      background={settings.background}
      image={image ?? undefined}
    />
  );
}
