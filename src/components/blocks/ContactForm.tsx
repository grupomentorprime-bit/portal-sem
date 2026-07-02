/**
 * @deprecated Usar Experience Forms — ver docs/core/CORE-EXPERIENCE-FORMS-v1.md
 */

"use client";

import { ExperienceFormGrid } from "@/components/blocks/ExperienceFormGrid";
import { asString } from "@/lib/cms/block-utils";
import type { ContactInfo } from "@/types/cms";

interface ContactFormProps {
  settings: Record<string, unknown>;
  contact?: ContactInfo;
}

export function ContactForm({ settings }: ContactFormProps) {
  return (
    <ExperienceFormGrid
      settings={{
        formId: asString(settings.formId, "contact"),
        overline: asString(settings.overline, "Contacto"),
        title: asString(settings.title, "Contáctanos"),
        description: asString(settings.description),
      }}
    />
  );
}
