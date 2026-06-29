import "server-only";

import { TestimonialsSectionContent } from "@/components/portal/institution/InstitutionSectionContent";
import { resolveBlockContent } from "@/lib/content/block-queries";
import { getQueryLimit } from "@/lib/content/block-settings";
import { blockSettings } from "@/lib/portal/blocks";
import type { TestimonialItem } from "@/types/content";
import type { PageBlock } from "@/types/page";

interface TestimonialsBlockSectionProps {
  block: PageBlock;
  tenant: string;
}

export async function TestimonialsBlockSection({ block, tenant }: TestimonialsBlockSectionProps) {
  const settings = blockSettings<{
    overline?: string;
    title?: string;
    description?: string;
    errorTitle?: string;
    errorDescription?: string;
  }>(block);

  let items: TestimonialItem[] = [];
  let error = false;

  try {
    const resolved = await resolveBlockContent(block, tenant);
    items = (resolved as TestimonialItem[]).slice(0, getQueryLimit(block.settings, 3));
  } catch {
    error = true;
  }

  return (
    <TestimonialsSectionContent
      overline={settings.overline}
      title={settings.title}
      description={settings.description}
      items={items}
      error={error}
      errorTitle={settings.errorTitle}
      errorDescription={settings.errorDescription}
    />
  );
}
