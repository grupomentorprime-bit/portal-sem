import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";
import { inputBase } from "./shared";
import { InputField } from "./input";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: string;
  error?: string;
}

export function Textarea({
  className,
  label,
  helper,
  error,
  id,
  ...props
}: TextareaProps) {
  const inputId =
    id ?? (label ? `textarea-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
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
      <textarea
        id={inputId}
        aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={error ? true : undefined}
        className={cn(inputBase, "min-h-24 py-2", error && "border-primary", className)}
        {...props}
      />
    </InputField>
  );
}
