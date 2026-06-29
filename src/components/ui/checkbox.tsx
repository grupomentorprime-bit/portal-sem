import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { focusRing } from "./shared";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

export function Checkbox({
  className,
  label,
  description,
  id,
  ...props
}: CheckboxProps) {
  const inputId =
    id ?? (label ? `checkbox-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "group flex cursor-pointer items-start gap-3",
        props.disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          id={inputId}
          className={cn("sr-only", focusRing)}
          {...props}
        />
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-background transition-colors duration-[var(--transition-fast)]",
            "group-has-[:checked]:border-primary group-has-[:checked]:bg-primary",
            "group-has-[:focus-visible]:shadow-[var(--focus-ring)]"
          )}
          aria-hidden
        >
          <Check
            className="h-3.5 w-3.5 text-text-inverse opacity-0 group-has-[:checked]:opacity-100"
            strokeWidth={2}
          />
        </span>
      </span>
      {(label || description) && (
        <span className="min-w-0">
          {label ? (
            <span className="block text-sm font-medium text-foreground">{label}</span>
          ) : null}
          {description ? (
            <span className="mt-0.5 block text-sm text-muted">{description}</span>
          ) : null}
        </span>
      )}
    </label>
  );
}
