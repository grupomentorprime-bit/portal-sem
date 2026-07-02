import { cn } from "@/lib/utils";
import { disabledStyles, focusRing } from "./shared";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  id,
}: SwitchProps) {
  const switchId =
    id ?? `switch-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-border p-4">
      <div>
        <label htmlFor={switchId} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {description ? (
          <p className="mt-1 text-sm text-muted">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        id={switchId}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-[var(--transition-fast)]",
          focusRing,
          disabledStyles,
          checked ? "bg-primary" : "bg-gray-200"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow-[var(--shadow-sm)] transition-transform duration-[var(--transition-fast)]",
            checked && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}
