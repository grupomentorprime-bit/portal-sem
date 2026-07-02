import { FaqSection } from "@/components/portal/conversion/FaqSection";
import { blockSettings, extractFaqItems } from "@/lib/portal/blocks";
import { withHomeDemoFaqItems } from "@/lib/portal/institutional-demo";
import { isHomePageSlug } from "@/lib/portal/home-experience";
import type { PageBlock } from "@/types/page";

interface FaqBlockSectionProps {
  block: PageBlock;
  pageSlug?: string;
}

export function FaqBlockSection({ block, pageSlug }: FaqBlockSectionProps) {
  const settings = blockSettings<{
    overline?: string;
    title?: string;
    description?: string;
  }>(block);

  return (
    <FaqSection
      overline={settings.overline}
      title={settings.title}
      description={settings.description}
      items={withHomeDemoFaqItems(extractFaqItems(block), pageSlug)}
      editorialHome={pageSlug ? isHomePageSlug(pageSlug) : false}
    />
  );
}
