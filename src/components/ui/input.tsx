import { cn } from "@/lib/utils";
import { Loader2, type LucideIcon } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { inputBase } from "./shared";
import { Label } from "./label";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
  icon?: LucideIcon;
  loading?: boolean;
}

export function Input({
  className,
  label,
  helper,
  error,
  icon: Icon,
  loading,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? (label ? `input-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  const helperId = helper ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <InputField
      label={label}
      helper={helper}
      error={error}
      inputId={inputId}
      helperId={helperId}
      errorId={errorId}
    >
      <div className="relative">
        {Icon ? (
          <Icon
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
            strokeWidth={2}
            aria-hidden
          />
        ) : null}
        <input
          id={inputId}
          aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
          aria-invalid={error ? true : undefined}
          className={cn(
            inputBase,
            "h-10",
            Icon && "pl-10",
            loading && "pr-10",
            error && "border-primary",
            className
          )}
          {...props}
        />
        {loading ? (
          <Loader2
            className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-muted"
            strokeWidth={2}
            aria-hidden
          />
        ) : null}
      </div>
    </InputField>
  );
}

interface InputFieldProps {
  label?: string;
  helper?: string;
  error?: string;
  inputId?: string;
  helperId?: string;
  errorId?: string;
  children: ReactNode;
}

export function InputField({
  label,
  helper,
  error,
  inputId,
  helperId,
  errorId,
  children,
}: InputFieldProps) {
  return (
    <div className="space-y-1.5">
      {label ? <Label htmlFor={inputId}>{label}</Label> : null}
      {children}
      {helper && !error ? (
        <p id={helperId} className="text-xs text-muted">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-primary" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
