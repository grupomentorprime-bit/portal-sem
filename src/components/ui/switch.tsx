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
          "relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200",
          focusRing,
          disabledStyles,
          checked ? "bg-[#34C759]" : "bg-[#E5E5EA]"
        )}
      >
        <span
          className={cn(
            "absolute top-[2px] left-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,.15)] transition-transform duration-200",
            checked && "translate-x-[20px]"
          )}
        />
      </button>
    </div>
  );
}
