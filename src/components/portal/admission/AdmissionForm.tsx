"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { CmsSectionHeader, CmsSectionShell } from "@/components/portal/cms/CmsSectionShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import type { CmsFormField } from "@/types/cms-shared";
import type { CmsSectionLayout } from "@/types/cms-shared";

export interface AdmissionProgramOption {
  id: string;
  label: string;
}

interface AdmissionFormProps {
  title: string;
  description?: string;
  fields: CmsFormField[];
  programs: AdmissionProgramOption[];
  layout?: CmsSectionLayout;
  anchor?: string;
  submitLabel?: string;
  footerNote?: string;
  globalErrorMessage?: string;
  connectionErrorMessage?: string;
}

export function AdmissionForm({
  title,
  description,
  fields,
  programs,
  layout,
  anchor,
  submitLabel = "Enviar postulación",
  footerNote,
  globalErrorMessage = "No pudimos enviar tu postulación. Intenta nuevamente.",
  connectionErrorMessage = "Error de conexión. Verifica tu red e intenta de nuevo.",
}: AdmissionFormProps) {
  const router = useRouter();
  const initialValues = useMemo(
    () =>
      Object.fromEntries(fields.map((f) => [f.name, ""])) as Record<string, string>,
    [fields]
  );
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const sortedFields = useMemo(
    () => [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [fields]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setGlobalError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admission/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await res.json()) as {
        ok: boolean;
        errors?: Record<string, string>;
        error?: string;
        redirectTo?: string;
      };

      if (!payload.ok) {
        if (payload.errors) setErrors(payload.errors);
        setGlobalError(payload.error ?? globalErrorMessage);
        return;
      }

      router.push(payload.redirectTo ?? "/postulacion/enviada");
    } catch {
      setGlobalError(connectionErrorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: CmsFormField) => {
    const common = {
      label: field.label,
      name: field.name,
      required: field.required,
      value: values[field.name] ?? "",
      error: errors[field.name],
      placeholder: field.placeholder,
      helper: field.helper,
    };

    if (field.type === "select" && field.name === "programId") {
      return (
        <Select
          key={field.id}
          {...common}
          onChange={(e) => setField(field.name, e.target.value)}
          options={programs.map((p) => ({ value: p.id, label: p.label }))}
        />
      );
    }

    if (field.type === "select" && field.options) {
      return (
        <Select
          key={field.id}
          {...common}
          onChange={(e) => setField(field.name, e.target.value)}
          options={field.options}
        />
      );
    }

    if (field.type === "textarea") {
      return (
        <Textarea
          key={field.id}
          {...common}
          rows={4}
          onChange={(e) => setField(field.name, e.target.value)}
        />
      );
    }

    const inputType =
      field.type === "email" ? "email" : field.type === "phone" ? "tel" : field.type === "date" ? "date" : "text";

    return (
      <Input
        key={field.id}
        {...common}
        type={inputType}
        onChange={(e) => setField(field.name, e.target.value)}
      />
    );
  };

  return (
    <CmsSectionShell id={anchor} layout={layout}>
      <CmsSectionHeader
        layout={{
          ...layout,
          badge: layout?.badge,
          title: title || layout?.title,
          description: description ?? layout?.description,
        }}
      />
      <form
        onSubmit={handleSubmit}
        className="admission-form rounded-[var(--radius-xl)] border border-border bg-background p-6 shadow-[var(--shadow-md)] sm:p-8"
        noValidate
      >
        {globalError ? (
          <Alert variant="error" className="mb-6">
            {globalError}
          </Alert>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          {sortedFields.map((field) => (
            <div
              key={field.id}
              className={field.width === "full" ? "sm:col-span-2" : undefined}
            >
              {renderField(field)}
            </div>
          ))}
        </div>

        {footerNote ? <p className="mt-6 text-sm text-muted">{footerNote}</p> : null}

        <div className="mt-6">
          <Button type="submit" size="lg" loading={submitting} className="w-full sm:w-auto">
            {submitLabel}
          </Button>
        </div>
      </form>
    </CmsSectionShell>
  );
}
