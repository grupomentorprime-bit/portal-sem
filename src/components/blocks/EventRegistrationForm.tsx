/**
 * @deprecated Usar Experience Forms — formId: event_registration (destino event_registration)
 * @see docs/core/CORE-EXPERIENCE-FORMS-v1.md
 */

"use client";

import { ExperienceFormGrid } from "@/components/blocks/ExperienceFormGrid";

interface EventRegistrationFormProps {
  settings?: Record<string, unknown>;
  eventId?: string;
}

export function EventRegistrationForm({ settings = {}, eventId }: EventRegistrationFormProps) {
  return (
    <ExperienceFormGrid
      settings={{
        formId: "event-registration",
        overline: "Eventos",
        title: "Inscribirse al evento",
        ...settings,
        ...(eventId ? { hiddenEventId: eventId } : {}),
      }}
    />
  );
}
