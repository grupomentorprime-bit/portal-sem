import { Inbox } from "lucide-react";
import { iconSizes } from "@/design";
import { Button } from "@/components/ui";

interface PortalEmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

export function PortalEmptyState({
  title = "Sin contenido disponible",
  description = "Esta sección se actualizará pronto desde el panel de administración.",
  actionLabel,
  actionHref,
}: PortalEmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-xl)] border border-dashed border-border bg-background-soft px-6 py-16 text-center">
      <Inbox size={iconSizes.xl} className="text-muted" strokeWidth={1.5} aria-hidden />
      <h3 className="mt-4 text-heading text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-body text-muted">{description}</p>
      {actionLabel && actionHref ? (
        <Button href={actionHref} variant="outline" className="mt-6">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
