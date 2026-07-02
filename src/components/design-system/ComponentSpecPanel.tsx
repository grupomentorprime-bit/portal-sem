import { cn } from "@/lib/utils";
import type { ComponentSpec } from "./component-specs";

interface ComponentSpecPanelProps {
  spec: ComponentSpec;
  className?: string;
}

export function ComponentSpecPanel({ spec, className }: ComponentSpecPanelProps) {
  return (
    <div
      className={cn(
        "mt-4 rounded-lg border border-border bg-background-soft p-4 text-sm",
        className
      )}
    >
      <p className="text-muted">
        <span className="font-medium text-foreground">Cuándo usar: </span>
        {spec.whenToUse}
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {spec.variants?.length ? (
          <SpecList label="Variants" items={spec.variants} />
        ) : null}
        {spec.sizes?.length ? <SpecList label="Sizes" items={spec.sizes} /> : null}
        {spec.states?.length ? <SpecList label="States" items={spec.states} /> : null}
      </div>

      <SpecList className="mt-3" label="Tokens" items={spec.tokens} mono />
      <SpecList className="mt-2" label="Accessibility" items={spec.accessibility} />
      <SpecList className="mt-2" label="Props" items={spec.props} mono />

      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Código recomendado</p>
        <pre className="mt-1 overflow-x-auto rounded-md bg-gray-900 p-3 font-mono text-xs text-gray-50 dark:bg-gray-950">
          {spec.example}
        </pre>
        <p className="mt-2 font-mono text-xs text-muted">{spec.source}</p>
      </div>
    </div>
  );
}

function SpecList({
  label,
  items,
  mono,
  className,
}: {
  label: string;
  items: string[];
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <ul className={cn("mt-1 list-inside list-disc text-foreground", mono && "font-mono text-xs")}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
