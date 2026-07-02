"use client";

import { AlertCircle } from "lucide-react";

interface PortalFormErrorProps {
  message: string;
}

export function PortalFormError({ message }: PortalFormErrorProps) {
  return (
    <div className="portal-experience-form__error-banner" role="alert">
      <AlertCircle className="portal-experience-form__error-icon" aria-hidden />
      <p>{message}</p>
    </div>
  );
}
