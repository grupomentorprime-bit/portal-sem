import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { inputBase } from "./shared";
import { InputField } from "./input";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helper?: string;
  error?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export function Select({
  className,
  label,
  helper,
  error,
  options,
  placeholder,
  id,
  ...props
}: SelectProps) {
  const inputId =
    id ?? (label ? `select-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
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
        <select
          id={inputId}
          aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
          aria-invalid={error ? true : undefined}
          className={cn(
            inputBase,
            "h-10 appearance-none pr-10",
            error && "border-primary",
            className
          )}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted"
          strokeWidth={2}
          aria-hidden
        />
      </div>
    </InputField>
  );
}
