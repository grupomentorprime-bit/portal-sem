/**
 * @deprecated Usar Experience Forms — formId: program-application
 * @see docs/core/CORE-EXPERIENCE-FORMS-v1.md
 */

"use client";

import { ExperienceFormGrid } from "@/components/blocks/ExperienceFormGrid";

interface AdmissionFormProps {
  settings?: Record<string, unknown>;
}

export function AdmissionForm({ settings = {} }: AdmissionFormProps) {
  return (
    <ExperienceFormGrid
      settings={{
        formId: "program-application",
        overline: "Admisión",
        title: "Postulación al programa",
        ...settings,
      }}
    />
  );
}
