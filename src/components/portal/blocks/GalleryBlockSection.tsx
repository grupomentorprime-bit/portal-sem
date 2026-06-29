import "server-only";

import { GallerySectionContent } from "@/components/portal/institution/InstitutionSectionContent";
import { resolveBlockContent } from "@/lib/content/block-queries";
import { getQueryLimit } from "@/lib/content/block-settings";
import { blockSettings } from "@/lib/portal/blocks";
import { asString } from "@/lib/cms/block-utils";
import type { GalleryItem } from "@/types/content";
import type { PageBlock } from "@/types/page";

interface GalleryBlockSectionProps {
  block: PageBlock;
  tenant: string;
}

export async function GalleryBlockSection({ block, tenant }: GalleryBlockSectionProps) {
  const settings = blockSettings<{
    overline?: string;
    title?: string;
    description?: string;
    showButton?: boolean;
    buttonLabel?: string;
    buttonHref?: string;
    errorTitle?: string;
    errorDescription?: string;
    emptyTitle?: string;
    emptyDescription?: string;
  }>(block);

  let gallery: GalleryItem[] = [];
  let error = false;

  try {
    const items = await resolveBlockContent(block, tenant);
    gallery = (items as GalleryItem[]).slice(0, getQueryLimit(block.settings, 4));
  } catch {
    error = true;
  }

  return (
    <GallerySectionContent
      overline={settings.overline}
      title={settings.title}
      description={settings.description}
      items={gallery}
      showButton={settings.showButton}
      buttonLabel={settings.buttonLabel}
      buttonHref={settings.buttonHref}
      error={error}
      errorTitle={settings.errorTitle}
      errorDescription={settings.errorDescription}
      emptyTitle={asString(settings.emptyTitle) || undefined}
      emptyDescription={asString(settings.emptyDescription) || undefined}
    />
  );
}
