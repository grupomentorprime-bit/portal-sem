"use client";

import { useCallback, useMemo, useState } from "react";
import {
  hasSubmissionAttachment,
  validateFormAttachmentFile,
} from "@/lib/experience/forms/attachments";
import { validateFormSubmission, normalizeFormSubmissionData } from "@/core/experience/forms/validation";
import {
  buildValidationSummaryItems,
  scrollToFirstFormError,
} from "@/lib/experience/forms/form-validation-ui";
import { launchAttendanceConfetti } from "@/lib/experience/forms/celebration";
import { canSubmitConvocatoriaForm } from "@/lib/experience/forms/convocatoria-identity";
import type { ExperienceFormDefinition } from "@/types/experience-forms";
import { ConvocatoriaParticipantFields } from "./ConvocatoriaParticipantFields";
import { PortalFormActions } from "./PortalFormActions";
import { PortalFormError } from "./PortalFormError";
import { PortalFormHeader } from "./PortalFormHeader";
import { PortalFormSuccess } from "./PortalFormSuccess";
import { PortalFormValidationSummary } from "./PortalFormValidationSummary";
import type { ValidationSummaryItem } from "@/lib/experience/forms/form-validation-ui";

interface PortalConvocatoriaExperienceFormProps {
  form: ExperienceFormDefinition;
  convocatoriaSlug: string;
  overline?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  className?: string;
  attendanceYesMessage?: string;
  attendanceNoMessage?: string;
  attendanceYesSuccessMessage?: string;
  celebrateAttendanceYes?: boolean;
}

export function PortalConvocatoriaExperienceForm({
  form,
  convocatoriaSlug,
  overline,
  title,
  description,
  submitLabel,
  className,
  attendanceYesMessage,
  attendanceNoMessage,
  attendanceYesSuccessMessage,
  celebrateAttendanceYes = false,
}: PortalConvocatoriaExperienceFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>(() => initialValues(form));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationSummary, setValidationSummary] = useState<ValidationSummaryItem[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const formClass = useMemo(
    () => ["portal-experience-form", "portal-experience-form--inline", className].filter(Boolean).join(" "),
    [className]
  );

  const submitReady = useMemo(() => canSubmitConvocatoriaForm(values), [values]);

  const handleChange = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setValidationSummary((prev) => (prev.length > 0 ? [] : prev));
    setGlobalError(null);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setGlobalError(null);
    setValidationSummary([]);

    const normalizedValues = normalizeFormSubmissionData(form, values);
    const clientErrors = validateFormSubmission(form, normalizedValues);
    if (values.attendance === "no") {
      const pendingFile = values.justificationAttachmentFile;
      if (!hasSubmissionAttachment(values.justificationAttachment) && !(pendingFile instanceof File)) {
        clientErrors.justificationAttachment = "Debe adjuntar un justificativo de respaldo.";
      } else if (pendingFile instanceof File) {
        const fileError = validateFormAttachmentFile(pendingFile);
        if (fileError) clientErrors.justificationAttachment = fileError;
      }
    }

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setValidationSummary(buildValidationSummaryItems(clientErrors, form));
      scrollToFirstFormError();
      return;
    }

    if (normalizedValues.phone !== values.phone) {
      setValues((prev) => ({ ...prev, phone: normalizedValues.phone }));
    }

    setSubmitting(true);
    try {
      const submissionData: Record<string, unknown> = { ...normalizedValues };
      const pendingFile = submissionData.justificationAttachmentFile;

      if (submissionData.attendance === "no" && pendingFile instanceof File) {
        const formData = new FormData();
        formData.append("file", pendingFile);
        const uploadRes = await fetch(
          `/api/experience/forms/${encodeURIComponent(form._id)}/attachments`,
          { method: "POST", body: formData }
        );
        const uploadPayload = (await uploadRes.json()) as {
          ok: boolean;
          attachment?: Record<string, unknown>;
          error?: string;
        };

        if (!uploadPayload.ok || !uploadPayload.attachment) {
          setErrors({
            justificationAttachment:
              uploadPayload.error ?? "No se pudo subir el justificativo. Intenta nuevamente.",
          });
          return;
        }

        submissionData.justificationAttachment = uploadPayload.attachment;
      }

      delete submissionData.justificationAttachmentFile;

      const res = await fetch(`/api/experience/forms/${encodeURIComponent(form._id)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: submissionData }),
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
          setValidationSummary(buildValidationSummaryItems(payload.errors, form));
          scrollToFirstFormError();
        }
        setGlobalError(payload.error ?? payload.message ?? form.errorMessage);
        return;
      }

      const confirmedAttendance = submissionData.attendance === "yes";
      if (confirmedAttendance && celebrateAttendanceYes) {
        launchAttendanceConfetti();
      }

      setSuccessMessage(
        confirmedAttendance && attendanceYesSuccessMessage
          ? attendanceYesSuccessMessage
          : payload.message ?? form.postSubmit?.message ?? form.successMessage ?? "Formulario enviado correctamente."
      );
    } catch {
      setGlobalError(form.errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (successMessage) {
    return (
      <div className={`${formClass} portal-experience-form--submitted`}>
        <PortalFormSuccess message={successMessage} variant="inline" />
      </div>
    );
  }

  return (
    <form className={formClass} onSubmit={handleSubmit} noValidate aria-labelledby="portal-form-title">
      <PortalFormHeader form={form} overline={overline} title={title} description={description} />
      {validationSummary.length > 0 ? <PortalFormValidationSummary items={validationSummary} /> : null}
      {globalError ? <PortalFormError message={globalError} /> : null}
      <ConvocatoriaParticipantFields
        convocatoriaSlug={convocatoriaSlug}
        fields={form.fields}
        values={values}
        errors={errors}
        disabled={submitting}
        onChange={handleChange}
        attendanceYesMessage={attendanceYesMessage}
        attendanceNoMessage={attendanceNoMessage}
      />
      <PortalFormActions submitLabel={submitLabel} loading={submitting} disabled={!submitReady} />
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
