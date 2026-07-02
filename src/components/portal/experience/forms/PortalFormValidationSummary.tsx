"use client";

import { AlertCircle } from "lucide-react";
import type { ValidationSummaryItem } from "@/lib/experience/forms/form-validation-ui";

interface PortalFormValidationSummaryProps {
  items: ValidationSummaryItem[];
}

export function PortalFormValidationSummary({ items }: PortalFormValidationSummaryProps) {
  if (items.length === 0) return null;

  return (
    <div
      className="portal-experience-form__validation-summary portal-experience-form__validation-summary--error"
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="portal-experience-form__validation-summary-icon" aria-hidden />
      <div>
        <p className="portal-experience-form__validation-summary-title">
          {items.length === 1
            ? "Falta completar un campo antes de enviar"
            : "Faltan datos por completar antes de enviar"}
        </p>
        <ul className="portal-experience-form__validation-summary-list">
          {items.map((item) => (
            <li key={item.field}>
              <strong>{item.label}</strong>
              <span> — {item.message}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
