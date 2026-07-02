"use client";

import { useCallback, useMemo, useState } from "react";
import { executeExperienceAction } from "@/core/experience/actions";
import { validateFormSubmission } from "@/core/experience/forms/validation";
import { useExperienceAction } from "@/components/portal/experience/ExperienceActionProvider";
import type { ExperienceFormDefinition } from "@/types/experience-forms";
import { PortalFormActions } from "./PortalFormActions";
import { PortalFormError } from "./PortalFormError";
import { PortalFormFields } from "./PortalFormFields";
import { PortalFormHeader } from "./PortalFormHeader";
import { PortalFormSuccess } from "./PortalFormSuccess";

interface PortalExperienceFormProps {
  form: ExperienceFormDefinition;
  overline?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  variant?: "inline" | "modal";
  className?: string;
  onSuccessClose?: () => void;
}

export function PortalExperienceForm({
  form,
  overline,
  title,
  description,
  submitLabel,
  variant = "inline",
  className,
  onSuccessClose,
}: PortalExperienceFormProps) {
  const actionCtx = useExperienceAction();
  const [values, setValues] = useState<Record<string, unknown>>(() => initialValues(form));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const formClass = useMemo(
    () =>
      [
        "portal-experience-form",
        variant === "modal" ? "portal-experience-form--modal" : "portal-experience-form--inline",
        className,
      ]
        .filter(Boolean)
        .join(" "),
    [variant, className]
  );

  const handleChange = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const runPostSubmit = useCallback(async () => {
    const post = form.postSubmit;
    if (!post) return;

    switch (post.type) {
      case "message":
        return;
      case "redirect":
      case "page":
      case "modal":
      case "download":
      case "whatsapp":
        if (post.action) {
          await executeExperienceAction(post.action, actionCtx);
        }
        return;
      default:
        return;
    }
  }, [form.postSubmit, actionCtx]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setGlobalError(null);

    const clientErrors = validateFormSubmission(form, values);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/experience/forms/${encodeURIComponent(form._id)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: values }),
      });
      const payload = (await res.json()) as {
        ok: boolean;
        message?: string;
        errors?: Record<string, string>;
        error?: string;
      };

      if (!payload.ok) {
        if (payload.errors) {
          setErrors(payload.errors);
        }
        setGlobalError(payload.error ?? payload.message ?? form.errorMessage);
        return;
      }

      const message =
        payload.message ??
        form.postSubmit?.message ??
        form.successMessage ??
        "Formulario enviado correctamente.";

      if (form.postSubmit?.type === "message") {
        setSuccessMessage(message);
      } else {
        await runPostSubmit();
        if (form.postSubmit?.type !== "redirect" && form.postSubmit?.type !== "page") {
          setSuccessMessage(message);
        } else if (onSuccessClose) {
          onSuccessClose();
        }
      }
    } catch {
      setGlobalError(form.errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (successMessage) {
    return (
      <div className={formClass}>
        <PortalFormSuccess
          message={successMessage}
          onClose={onSuccessClose}
        />
      </div>
    );
  }

  return (
    <form
      className={formClass}
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="portal-form-title"
    >
      <PortalFormHeader
        form={form}
        overline={overline}
        title={title}
        description={description}
      />

      {globalError ? <PortalFormError message={globalError} /> : null}

      <PortalFormFields
        fields={form.fields}
        values={values}
        errors={errors}
        disabled={submitting}
        onChange={handleChange}
      />

      <PortalFormActions submitLabel={submitLabel} loading={submitting} />
    </form>
  );
}

function initialValues(form: ExperienceFormDefinition): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of form.fields) {
    if (field.defaultValue !== undefined) {
      values[field.name] = field.defaultValue;
    } else if (field.type === "checkbox") {
      values[field.name] = false;
    }
  }
  return values;
}
