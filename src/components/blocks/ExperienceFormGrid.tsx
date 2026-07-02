"use client";

import { useEffect, useState } from "react";
import { PortalContainer, PortalSection } from "@/components/portal/layout";
import {
  PortalExperienceForm,
  PortalFormSkeleton,
} from "@/components/portal/experience/forms";
import { asString } from "@/lib/cms/block-utils";
import type { ExperienceFormDefinition } from "@/types/experience-forms";

interface ExperienceFormGridProps {
  settings: Record<string, unknown>;
}

export function ExperienceFormGrid({ settings }: ExperienceFormGridProps) {
  const formId = asString(settings.formId, "information-request");
  const [form, setForm] = useState<ExperienceFormDefinition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/experience/forms/${encodeURIComponent(formId)}/public`)
      .then(async (res) => {
        const data = (await res.json()) as { ok: boolean; form?: ExperienceFormDefinition };
        if (!cancelled && data.ok && data.form) setForm(data.form);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [formId]);

  return (
    <PortalSection id={`form-${formId}`}>
      <PortalContainer size="md">
        {loading ? <PortalFormSkeleton /> : null}
        {!loading && form ? (
          <PortalExperienceForm
            form={form}
            overline={asString(settings.overline) || undefined}
            title={asString(settings.title) || undefined}
            description={asString(settings.description) || undefined}
          />
        ) : null}
        {!loading && !form ? (
          <p className="text-sm text-muted">Formulario &quot;{formId}&quot; no disponible.</p>
        ) : null}
      </PortalContainer>
    </PortalSection>
  );
}
