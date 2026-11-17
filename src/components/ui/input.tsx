"use client";

import { cn } from "@/lib/utils";
import { Eye, EyeOff, Loader2, type LucideIcon } from "lucide-react";
import { useState, type InputHTMLAttributes, type ReactNode } from "react";
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
  type,
  ...props
}: InputProps) {
  const inputId = id ?? (label ? `input-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  const helperId = helper ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const isPassword = type === "password";
  const [revealed, setRevealed] = useState(false);
  const showReveal = isPassword && !loading;

  return (
    <InputField
      label={label}
      helper={helper}
      error={error}
      inputId={inputId}
      helperId={helperId}
      errorId={errorId}
    >
      <div className="relative text-muted">
        {Icon ? (
          <Icon
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            strokeWidth={2}
            aria-hidden
          />
        ) : null}
        <input
          id={inputId}
          type={isPassword && revealed ? "text" : type}
          aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
          aria-invalid={error ? true : undefined}
          className={cn(
            inputBase,
            "h-10",
            Icon && "pl-10",
            (loading || showReveal) && "pr-12",
            error && "border-primary",
            className
          )}
          {...props}
        />
        {showReveal ? (
          <button
            type="button"
            className="password-reveal absolute top-1/2 right-1 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#102033] transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={revealed}
          >
            {revealed ? (
              <EyeOff className="h-5 w-5" strokeWidth={2} aria-hidden />
            ) : (
              <Eye className="h-5 w-5" strokeWidth={2} aria-hidden />
            )}
          </button>
        ) : null}
        {loading ? (
          <Loader2
            className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin"
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
