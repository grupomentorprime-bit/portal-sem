/**
 * @deprecated
 *
 * Reemplazado por:
 * TestimonialsSectionContent
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import { asString } from "@/lib/cms/block-utils";
import { getQueryLimit, getResolvedItems } from "@/lib/content/block-settings";
import { TestimonialsSectionContent } from "@/components/portal/institution/InstitutionSectionContent";
import type { TestimonialItem } from "@/types/content";

interface TestimonialsGridProps {
  settings: Record<string, unknown>;
}

export function TestimonialsGrid({ settings }: TestimonialsGridProps) {
  const items = getResolvedItems<TestimonialItem>(settings);
  const limit = getQueryLimit(settings, items.length);

  return (
    <TestimonialsSectionContent
      overline={asString(settings.overline) || undefined}
      title={asString(settings.title, "Testimonios")}
      description={asString(settings.description) || undefined}
      items={items.slice(0, limit)}
    />
  );
}
