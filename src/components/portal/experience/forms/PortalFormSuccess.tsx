"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PortalFormSuccessProps {
  title?: string;
  kicker?: string;
  message: string;
  onClose?: () => void;
  closeLabel?: string;
  /** overlay = pantalla completa inmediata; inline = dentro del formulario */
  variant?: "overlay" | "inline";
  className?: string;
  children?: ReactNode;
}

export function PortalFormSuccess({
  title = "¡Respuesta enviada!",
  kicker,
  message,
  onClose,
  closeLabel = "Entendido",
  variant = "overlay",
  className,
  children,
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
      className={[
        "portal-experience-form__success",
        `portal-experience-form__success--${variant}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="alert"
      aria-live="assertive"
    >
      <div className="portal-experience-form__success-icon-wrap" aria-hidden="true">
        <CheckCircle2 className="portal-experience-form__success-icon" />
      </div>
      {kicker ? <p className="portal-experience-form__success-kicker">{kicker}</p> : null}
      <p className="portal-experience-form__success-title">{title}</p>
      <p className="portal-experience-form__success-message">{message}</p>
      {children}
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
