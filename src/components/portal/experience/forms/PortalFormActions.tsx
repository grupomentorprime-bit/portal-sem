"use client";

import { Button } from "@/components/ui/button";

interface PortalFormActionsProps {
  submitLabel?: string;
  loading?: boolean;
  disabled?: boolean;
}

export function PortalFormActions({
  submitLabel = "Enviar",
  loading,
  disabled,
}: PortalFormActionsProps) {
  return (
    <div className="portal-experience-form__actions">
      <Button
        type="submit"
        variant="primary"
        className="portal-experience-form__submit w-full sm:w-auto"
        loading={loading}
        disabled={disabled || loading}
      >
        {submitLabel}
      </Button>
    </div>
  );
}
