import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";
import { focusRing } from "./shared";

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

export function Radio({
  className,
  label,
  description,
  id,
  ...props
}: RadioProps) {
  const inputId =
    id ?? (label ? `radio-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

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
          type="radio"
          id={inputId}
          className={cn("sr-only", focusRing)}
          {...props}
        />
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background transition-colors duration-[var(--transition-fast)]",
            "group-has-[:checked]:border-primary",
            "group-has-[:focus-visible]:shadow-[var(--focus-ring)]"
          )}
          aria-hidden
        >
          <span className="h-2.5 w-2.5 rounded-full bg-primary opacity-0 transition-opacity group-has-[:checked]:opacity-100" />
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

export interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; description?: string }>;
  legend?: string;
  className?: string;
}

export function RadioGroup({
  name,
  value,
  onChange,
  options,
  legend,
  className,
}: RadioGroupProps) {
  return (
    <fieldset className={cn("space-y-3", className)}>
      {legend ? (
        <legend className="mb-2 text-sm font-medium text-foreground">{legend}</legend>
      ) : null}
      {options.map((opt) => (
        <Radio
          key={opt.value}
          name={name}
          value={opt.value}
          label={opt.label}
          description={opt.description}
          checked={value === opt.value}
          onChange={() => onChange(opt.value)}
        />
      ))}
    </fieldset>
  );
}
