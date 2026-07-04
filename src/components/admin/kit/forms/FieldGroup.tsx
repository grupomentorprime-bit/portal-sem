import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface FieldGroupProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/** Campo con label, hint y error unificados. */
export function FieldGroup({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: FieldGroupProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-[var(--color-danger)]"> *</span> : null}
      </Label>
      {children}
      {hint && !error ? <p className="text-xs text-muted">{hint}</p> : null}
      {error ? <p className="text-xs text-[var(--color-danger)]" role="alert">{error}</p> : null}
    </div>
  );
}
