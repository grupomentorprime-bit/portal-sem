import { cn } from "@/lib/utils";
import { inspectorStyles } from "../inspector-styles";
import type { InspectorFieldBaseProps } from "../types";

interface InspectorLabelProps extends Pick<InspectorFieldBaseProps, "label" | "required"> {
  htmlFor?: string;
  className?: string;
}

export function InspectorLabel({ label, htmlFor, required, className }: InspectorLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("block text-sm font-medium text-foreground", className)}
    >
      {label}
      {required ? (
        <span className="ml-0.5 text-[var(--color-danger)]" aria-hidden>
          *
        </span>
      ) : null}
    </label>
  );
}

interface InspectorHintProps {
  id?: string;
  children: string;
  className?: string;
}

export function InspectorHint({ id, children, className }: InspectorHintProps) {
  return (
    <p id={id} className={cn("text-xs leading-relaxed text-muted", className)}>
      {children}
    </p>
  );
}

export function InspectorDivider({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-border", className)} aria-hidden />;
}

interface InspectorEmptyProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function InspectorEmpty({ title, description, action }: InspectorEmptyProps) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

interface InspectorFieldFrameProps extends InspectorFieldBaseProps {
  children: React.ReactNode;
  className?: string;
}

/** Envuelve label + hint + error + control */
export function InspectorFieldFrame({
  id,
  label,
  hint,
  error,
  required,
  disabled,
  children,
  className,
}: InspectorFieldFrameProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div
      className={cn(inspectorStyles.fieldGap, disabled && "opacity-60", className)}
      aria-disabled={disabled || undefined}
    >
      <InspectorLabel label={label} htmlFor={id} required={required} />
      {hint ? <InspectorHint id={hintId}>{hint}</InspectorHint> : null}
      <div aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}>
        {children}
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
