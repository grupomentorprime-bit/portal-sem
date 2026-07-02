"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PortalFormSuccessProps {
  message: string;
  onClose?: () => void;
  closeLabel?: string;
}

export function PortalFormSuccess({
  message,
  onClose,
  closeLabel = "Cerrar",
}: PortalFormSuccessProps) {
  return (
    <div className="portal-experience-form__success" role="status" aria-live="polite">
      <CheckCircle2 className="portal-experience-form__success-icon" aria-hidden />
      <p className="portal-experience-form__success-message">{message}</p>
      {onClose ? (
        <Button type="button" variant="secondary" onClick={onClose}>
          {closeLabel}
        </Button>
      ) : null}
    </div>
  );
}
