"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PortalFormSuccessProps {
  message: string;
  onClose?: () => void;
  closeLabel?: string;
  /** overlay = pantalla completa inmediata; inline = dentro del formulario */
  variant?: "overlay" | "inline";
}

export function PortalFormSuccess({
  message,
  onClose,
  closeLabel = "Entendido",
  variant = "overlay",
}: PortalFormSuccessProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
    if (variant === "inline") {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [variant]);

  const content = (
    <div
      ref={panelRef}
      tabIndex={-1}
      className={`portal-experience-form__success portal-experience-form__success--${variant}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="portal-experience-form__success-icon-wrap" aria-hidden="true">
        <CheckCircle2 className="portal-experience-form__success-icon" />
      </div>
      <p className="portal-experience-form__success-title">¡Respuesta enviada!</p>
      <p className="portal-experience-form__success-message">{message}</p>
      {onClose ? (
        <Button type="button" variant="primary" onClick={onClose} className="mt-2">
          {closeLabel}
        </Button>
      ) : null}
    </div>
  );

  if (variant === "overlay") {
    return (
      <div className="portal-experience-form__success-overlay" role="presentation">
        {content}
      </div>
    );
  }

  return content;
}
