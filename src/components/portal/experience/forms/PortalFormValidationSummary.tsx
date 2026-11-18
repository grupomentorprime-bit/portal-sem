"use client";

import { AlertCircle } from "lucide-react";
import { isMissingFieldMessage } from "@/lib/experience/forms/already-enrolled";
import type { ValidationSummaryItem } from "@/lib/experience/forms/form-validation-ui";

interface PortalFormValidationSummaryProps {
  items: ValidationSummaryItem[];
}

export function PortalFormValidationSummary({ items }: PortalFormValidationSummaryProps) {
  if (items.length === 0) return null;

  const missing = items.filter((item) => isMissingFieldMessage(item.message));
  const other = items.filter((item) => !isMissingFieldMessage(item.message));
  const onlyMissing = missing.length > 0 && other.length === 0;

  const title = onlyMissing
    ? missing.length === 1
      ? "Te falta completar este dato"
      : "Te falta completar estos datos"
    : items.length === 1
      ? "Revisa este dato antes de enviar"
      : "Revisa estos datos antes de enviar";

  return (
    <div
      className="portal-experience-form__validation-summary portal-experience-form__validation-summary--error"
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="portal-experience-form__validation-summary-icon" aria-hidden />
      <div>
        <p className="portal-experience-form__validation-summary-title">{title}</p>
        {missing.length > 0 ? (
          <ul className="portal-experience-form__validation-summary-list">
            {missing.map((item) => (
              <li key={item.field}>
                <strong>{item.label}</strong>
              </li>
            ))}
          </ul>
        ) : null}
        {other.length > 0 ? (
          <ul className="portal-experience-form__validation-summary-list">
            {other.map((item) => (
              <li key={item.field}>
                <strong>{item.label}</strong>
                <span> — {item.message}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
