import type { PortalContactHubViewModel } from "@/types/contact-hub";
import { cn } from "@/lib/utils";

interface PortalContactHeaderProps {
  overline?: string;
  title: string;
  description?: string;
  centered?: boolean;
  className?: string;
}

export function PortalContactHeader({
  overline,
  title,
  description,
  centered = false,
  className,
}: PortalContactHeaderProps) {
  return (
    <header
      className={cn(
        "portal-contact-hub__header",
        centered && "portal-contact-hub__header--center text-center",
        className
      )}
    >
      {overline ? (
        <p className="portal-contact-hub__eyebrow text-caption font-semibold uppercase tracking-widest text-secondary">
          {overline}
        </p>
      ) : null}
      <h2
        id="portal-contact-hub-title"
        className="portal-contact-hub__title mt-2 text-display-l font-semibold text-foreground"
      >
        {title}
      </h2>
      {description ? (
        <p className="portal-contact-hub__description mt-4 max-w-2xl text-body text-muted sm:text-lg">
          {description}
        </p>
      ) : null}
    </header>
  );
}

export function PortalContactHeaderFromView({
  viewModel,
  centered,
  className,
}: {
  viewModel: PortalContactHubViewModel;
  centered?: boolean;
  className?: string;
}) {
  return (
    <PortalContactHeader
      overline={viewModel.overline}
      title={viewModel.title}
      description={viewModel.description}
      centered={centered}
      className={className}
    />
  );
}
