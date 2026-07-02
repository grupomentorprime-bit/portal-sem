import "server-only";

import { TestimonialsSectionContent } from "@/components/portal/institution/InstitutionSectionContent";
import { resolveBlockContent } from "@/lib/content/block-queries";
import { getQueryLimit } from "@/lib/content/block-settings";
import {
  withHomeDemoTestimonials,
} from "@/lib/portal/institutional-demo";
import { blockSettings } from "@/lib/portal/blocks";
import { isHomePageSlug } from "@/lib/portal/home-experience";
import type { TestimonialItem } from "@/types/content";
import type { PageBlock } from "@/types/page";

interface TestimonialsBlockSectionProps {
  block: PageBlock;
  tenant: string;
  pageSlug?: string;
}

export async function TestimonialsBlockSection({
  block,
  tenant,
  pageSlug,
}: TestimonialsBlockSectionProps) {
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
    items = withHomeDemoTestimonials(
      (resolved as TestimonialItem[]).slice(0, getQueryLimit(block.settings, 4)),
      pageSlug
    );
  } catch {
    error = true;
    items = withHomeDemoTestimonials([], pageSlug);
  }

  if (!error && items.length === 0) {
    items = withHomeDemoTestimonials([], pageSlug);
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
      editorialHome={pageSlug ? isHomePageSlug(pageSlug) : false}
    />
  );
}
