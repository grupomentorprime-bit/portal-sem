"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import { Modal } from "@/components/ui/modal";
import { PortalFormSkeleton } from "@/components/portal/experience/forms/PortalFormSkeleton";
import type { ExperienceFormDefinition } from "@/types/experience-forms";

const PortalExperienceForm = dynamic(
  () =>
    import("@/components/portal/experience/forms/PortalExperienceForm").then(
      (m) => m.PortalExperienceForm
    ),
  { loading: () => <PortalFormSkeleton /> }
);

interface ExperienceFormHostProps {
  formId: string | null;
  onClose: () => void;
}

export function ExperienceFormHost({ formId, onClose }: ExperienceFormHostProps) {
  const [form, setForm] = useState<ExperienceFormDefinition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useDeferredEffect(() => {
    if (!formId) {
      setForm(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/experience/forms/${encodeURIComponent(formId)}/public`)
      .then(async (res) => {
        const data = (await res.json()) as {
          ok: boolean;
          form?: ExperienceFormDefinition;
          error?: string;
        };
        if (cancelled) return;
        if (!data.ok || !data.form) {
          setError(data.error ?? "Formulario no disponible.");
          setForm(null);
          return;
        }
        setForm(data.form);
      })
      .catch(() => {
        if (!cancelled) setError("No fue posible cargar el formulario.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [formId]);

  return (
    <Modal
      open={Boolean(formId)}
      onClose={onClose}
      title={form?.name ?? "Formulario"}
      description={form?.description}
      size="md"
    >
      {loading ? <PortalFormSkeleton /> : null}
      {!loading && error ? (
        <p className="text-body text-muted" role="alert">
          {error}
        </p>
      ) : null}
      {!loading && form ? (
        <PortalExperienceForm form={form} variant="modal" onSuccessClose={onClose} />
      ) : null}
    </Modal>
  );
}
