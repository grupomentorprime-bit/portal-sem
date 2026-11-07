"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  alreadyRegisteredConfirmationMessage,
  shouldShowConvocatoriaSubmitButton,
  type ConvocatoriaRegistrationLookup,
  type RegisteredAttendance,
} from "@/lib/experience/forms/already-registered-confirmation";
import {
  getUploadedJustificationAttachment,
  hasJustificationAttachment,
  parseSubmissionAttachment,
  validateFormAttachmentFile,
} from "@/lib/experience/forms/attachments";
import { validateFormSubmission, normalizeFormSubmissionData } from "@/core/experience/forms/validation";
import {
  buildValidationSummaryItems,
  scrollToFirstFormError,
} from "@/lib/experience/forms/form-validation-ui";
import { canSubmitConvocatoriaForm } from "@/lib/experience/forms/convocatoria-identity";
import type { ExperienceFormDefinition } from "@/types/experience-forms";
import { ConvocatoriaParticipantFields } from "./ConvocatoriaParticipantFields";
import { ConvocatoriaResponseSuccess } from "./ConvocatoriaResponseSuccess";
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
  programDownloadUrl?: string;
  programDownloadLabel?: string;
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
  programDownloadUrl,
  programDownloadLabel,
}: PortalConvocatoriaExperienceFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>(() => initialValues(form));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationSummary, setValidationSummary] = useState<ValidationSummaryItem[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submittedAttendance, setSubmittedAttendance] = useState<"yes" | "no" | null>(null);
  const [registrationResult, setRegistrationResult] = useState<{
    studentId: string;
    registered: boolean;
    attendance: RegisteredAttendance;
  } | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const pendingAttachmentRef = useRef<File | null>(null);

  const formClass = useMemo(
    () => ["portal-experience-form", "portal-experience-form--inline", className].filter(Boolean).join(" "),
    [className]
  );

  const registrationMode = String(values.registrationMode ?? "");
  const selectedStudentId = String(values.studentId ?? "").trim();
  const rosterSelected = registrationMode === "roster" && selectedStudentId.length > 0;
  const matchedRegistration =
    rosterSelected && registrationResult?.studentId === selectedStudentId
      ? registrationResult
      : null;
  const registrationLookup: ConvocatoriaRegistrationLookup = !rosterSelected
    ? "idle"
    : !matchedRegistration
      ? "pending"
      : matchedRegistration.registered
        ? "registered"
        : "open";
  const existingRegistration =
    registrationResult?.registered && registrationResult.studentId === selectedStudentId
      ? { attendance: registrationResult.attendance }
      : null;

  const submitReady = useMemo(() => canSubmitConvocatoriaForm(values), [values]);
  const showSubmit = shouldShowConvocatoriaSubmitButton({
    registrationMode,
    studentId: selectedStudentId,
    lookup: registrationLookup,
  });

  const resetIdentity = useCallback(() => {
    setRegistrationResult(null);
    setGlobalError(null);
    setErrors({});
    setValidationSummary([]);
    setValues((prev) => {
      const next = { ...prev };
      for (const key of [
        "registrationMode",
        "studentId",
        "fullName",
        "program",
        "generation",
        "rut",
        "phone",
        "email",
        "attendance",
        "notes",
        "justification",
        "justificationAttachment",
        "justificationAttachmentFile",
      ]) {
        delete next[key];
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!rosterSelected) return;

    const controller = new AbortController();
    const studentId = selectedStudentId;

    void (async () => {
      try {
        const res = await fetch(
          `/api/experience/forms/convocatorias/${encodeURIComponent(convocatoriaSlug)}/registration?studentId=${encodeURIComponent(studentId)}`,
          { signal: controller.signal }
        );
        const data = (await res.json()) as {
          ok?: boolean;
          registered?: boolean;
          attendance?: unknown;
        };
        if (controller.signal.aborted) return;
        setRegistrationResult({
          studentId,
          registered: Boolean(data.ok && data.registered),
          attendance:
            data.attendance === "yes" || data.attendance === "no" ? data.attendance : null,
        });
      } catch {
        if (controller.signal.aborted) return;
        setRegistrationResult({ studentId, registered: false, attendance: null });
      }
    })();

    return () => controller.abort();
  }, [convocatoriaSlug, rosterSelected, selectedStudentId]);

  const handleChange = useCallback((name: string, value: unknown) => {
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "attendance" && value !== "no") {
        delete next.justification;
        delete next.justificationAttachment;
        delete next.justificationAttachmentFile;
        pendingAttachmentRef.current = null;
      }
      return next;
    });
    setErrors((prev) => {
      if (!prev[name] && name !== "justificationAttachmentFile") return prev;
      const next = { ...prev };
      delete next[name];
      if (name === "justificationAttachmentFile" || name === "attendance") {
        delete next.justificationAttachment;
      }
      return next;
    });
    setValidationSummary((prev) => (prev.length > 0 ? [] : prev));
    setGlobalError(null);
  }, []);

  const uploadAttachment = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch(
        `/api/experience/forms/${encodeURIComponent(form._id)}/attachments`,
        { method: "POST", body: formData }
      );
      return (await uploadRes.json()) as {
        ok: boolean;
        attachment?: Record<string, unknown>;
        error?: string;
      };
    },
    [form._id]
  );

  const handleAttachmentFileChange = useCallback(
    async (file: File | undefined) => {
      pendingAttachmentRef.current = file && file.size > 0 ? file : null;

      setValues((prev) => ({
        ...prev,
        justificationAttachmentFile: file,
        justificationAttachment: undefined,
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.justificationAttachment;
        return next;
      });
      setValidationSummary((prev) => (prev.length > 0 ? [] : prev));
      setGlobalError(null);

      if (!file) return;

      const fileError = validateFormAttachmentFile(file);
      if (fileError) {
        setErrors((prev) => ({ ...prev, justificationAttachment: fileError }));
        return;
      }

      setUploadingAttachment(true);
      try {
        const uploadPayload = await uploadAttachment(file);
        if (!uploadPayload.ok || !uploadPayload.attachment) {
          setErrors({
            justificationAttachment:
              uploadPayload.error ?? "No se pudo subir el justificativo. Intenta nuevamente.",
          });
          return;
        }

        const uploadedAttachment = parseSubmissionAttachment(uploadPayload.attachment);
        if (!uploadedAttachment) {
          setErrors({
            justificationAttachment:
              "El justificativo se recibió de forma incompleta. Intenta subirlo nuevamente.",
          });
          return;
        }

        setValues((prev) => ({
          ...prev,
          justificationAttachmentFile: file,
          justificationAttachment: uploadedAttachment,
        }));
      } catch {
        setErrors({
          justificationAttachment: "No se pudo subir el justificativo. Intenta nuevamente.",
        });
      } finally {
        setUploadingAttachment(false);
      }
    },
    [uploadAttachment]
  );

  const resolvePendingAttachmentFile = useCallback(() => {
    const fromState = values.justificationAttachmentFile;
    if (fromState instanceof File && fromState.size > 0) return fromState;
    const fromRef = pendingAttachmentRef.current;
    if (fromRef instanceof File && fromRef.size > 0) return fromRef;
    return null;
  }, [values.justificationAttachmentFile]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!showSubmit) return;
    setGlobalError(null);
    setValidationSummary([]);

    const normalizedValues = normalizeFormSubmissionData(form, values);
    const validationData = {
      ...normalizedValues,
      justificationAttachmentFile: resolvePendingAttachmentFile() ?? normalizedValues.justificationAttachmentFile,
      justificationAttachment: values.justificationAttachment ?? normalizedValues.justificationAttachment,
    };
    const clientErrors = validateFormSubmission(form, validationData);
    if (values.attendance === "no") {
      const pendingFile = resolvePendingAttachmentFile();
      if (pendingFile) {
        const fileError = validateFormAttachmentFile(pendingFile);
        if (fileError) {
          clientErrors.justificationAttachment = fileError;
        } else if (hasJustificationAttachment(validationData)) {
          delete clientErrors.justificationAttachment;
        }
      } else if (!hasJustificationAttachment(validationData)) {
        clientErrors.justificationAttachment = "Debe adjuntar un justificativo de respaldo.";
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

      if (submissionData.attendance === "no") {
        let uploadedAttachment = getUploadedJustificationAttachment(values);

        if (!uploadedAttachment) {
          const pendingFile = resolvePendingAttachmentFile();
          if (!pendingFile) {
            setErrors({
              justificationAttachment: "Debe adjuntar un justificativo de respaldo.",
            });
            setValidationSummary(
              buildValidationSummaryItems(
                { justificationAttachment: "Debe adjuntar un justificativo de respaldo." },
                form
              )
            );
            return;
          }

          const uploadPayload = await uploadAttachment(pendingFile);
          if (!uploadPayload.ok || !uploadPayload.attachment) {
            setErrors({
              justificationAttachment:
                uploadPayload.error ?? "No se pudo subir el justificativo. Intenta nuevamente.",
            });
            return;
          }

          uploadedAttachment = parseSubmissionAttachment(uploadPayload.attachment);
          if (!uploadedAttachment) {
            setErrors({
              justificationAttachment:
                "El justificativo se recibió de forma incompleta. Intenta subirlo nuevamente.",
            });
            return;
          }
        }

        submissionData.justificationAttachment = uploadedAttachment;
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
        alreadyRegistered?: boolean;
        attendance?: unknown;
        confirmationEmail?: { sent: boolean; reason?: string };
      };

      if (!payload.ok) {
        const alreadyRegistered =
          payload.alreadyRegistered || isAlreadyRegisteredResponse(payload.errors, payload.error);
        if (alreadyRegistered) {
          setErrors({});
          setValidationSummary([]);
          setGlobalError(null);
          setRegistrationResult({
            studentId: String(values.studentId ?? "").trim(),
            registered: true,
            attendance:
              payload.attendance === "yes" || payload.attendance === "no"
                ? payload.attendance
                : null,
          });
          return;
        }
        if (payload.errors) {
          setErrors(payload.errors);
          setValidationSummary(buildValidationSummaryItems(payload.errors, form));
          scrollToFirstFormError();
        }
        setGlobalError(payload.error ?? payload.message ?? form.errorMessage);
        return;
      }

      const confirmedAttendance = submissionData.attendance === "yes";
      const declinedAttendance = submissionData.attendance === "no";

      setSubmittedAttendance(confirmedAttendance ? "yes" : declinedAttendance ? "no" : null);
      setSuccessNotice(
        payload.confirmationEmail && !payload.confirmationEmail.sent
          ? "Tu respuesta quedó registrada, pero no pudimos enviar el correo de confirmación. Revisa la carpeta de spam o contacta a asuntos estudiantiles."
          : null
      );
      setSuccessMessage(
        firstFilled(
          confirmedAttendance ? attendanceYesSuccessMessage : null,
          declinedAttendance ? attendanceNoMessage : null,
          payload.message,
          form.postSubmit?.message,
          form.successMessage,
          "Formulario enviado correctamente."
        )
      );
    } catch {
      setGlobalError(form.errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (existingRegistration) {
    return (
      <div className={`${formClass} portal-experience-form--submitted`}>
        <PortalFormSuccess
          kicker="Registro confirmado"
          title="Ya estás registrado"
          message={alreadyRegisteredConfirmationMessage(existingRegistration.attendance)}
          variant="overlay"
          className="portal-experience-form__success--registered"
        >
          {existingRegistration.attendance === "yes" && programDownloadUrl ? (
            <div className="convocatoria-program-download">
              <a
                className="convocatoria-program-download__button"
                href={programDownloadUrl}
                download
              >
                <Download aria-hidden="true" />
                {programDownloadLabel?.trim() || "Descargar el programa"}
              </a>
              <p className="convocatoria-program-download__note">
                También te lo enviamos adjunto en el correo de confirmación.
              </p>
            </div>
          ) : null}
          <Button type="button" variant="outline" onClick={resetIdentity}>
            Buscar otro nombre
          </Button>
        </PortalFormSuccess>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className={`${formClass} portal-experience-form--submitted`}>
        {submittedAttendance ? (
          <ConvocatoriaResponseSuccess
            attendance={submittedAttendance}
            message={successMessage}
            notice={successNotice}
            programDownloadUrl={programDownloadUrl}
            programDownloadLabel={programDownloadLabel}
          />
        ) : (
          <>
            <PortalFormSuccess message={successMessage} variant="inline" />
            {successNotice ? (
              <p className="mt-3 rounded-lg border border-[var(--state-warning-border)] bg-[var(--state-warning-bg)] px-4 py-3 text-sm text-[var(--state-warning-fg)]">
                {successNotice}
              </p>
            ) : null}
          </>
        )}
      </div>
    );
  }

  return (
    <form className={formClass} onSubmit={handleSubmit} noValidate aria-labelledby="portal-form-title">
      <PortalFormHeader form={form} overline={overline} title={title} description={description} />
      {registrationLookup === "pending" ? (
        <p className="portal-experience-form__identity-hint rounded-xl border border-dashed border-border bg-background-muted/25 px-4 py-3 text-sm text-muted" role="status">
          Revisando si ya registraste tu respuesta…
        </p>
      ) : null}
      {validationSummary.length > 0 ? <PortalFormValidationSummary items={validationSummary} /> : null}
      {globalError ? <PortalFormError message={globalError} /> : null}
      <ConvocatoriaParticipantFields
        convocatoriaSlug={convocatoriaSlug}
        fields={form.fields}
        values={values}
        errors={errors}
        disabled={submitting || uploadingAttachment}
        onChange={handleChange}
        onAttachmentFileChange={handleAttachmentFileChange}
        uploadingAttachment={uploadingAttachment}
        attendanceYesMessage={attendanceYesMessage}
        attendanceNoMessage={attendanceNoMessage}
      />
      {showSubmit ? (
        <PortalFormActions
          submitLabel={submitLabel}
          loading={submitting}
          disabled={!submitReady}
        />
      ) : null}
    </form>
  );
}

function firstFilled(...candidates: Array<string | null | undefined>): string {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed) return trimmed;
  }
  return "Formulario enviado correctamente.";
}

function isAlreadyRegisteredResponse(
  errors: Record<string, string> | undefined,
  globalError: string | undefined
): boolean {
  const messages = [...Object.values(errors ?? {}), globalError ?? ""];
  return messages.some((message) =>
    /ya registraste una respuesta|ya existe una respuesta registrada/i.test(message)
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
