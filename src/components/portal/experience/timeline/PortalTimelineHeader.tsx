import { asString } from "@/lib/cms/block-utils";
import type { PortalTimelineSettings } from "@/types/timeline";

interface PortalTimelineHeaderProps {
  settings: PortalTimelineSettings;
}

export function PortalTimelineHeader({ settings }: PortalTimelineHeaderProps) {
  const overline = asString(settings.overline);
  const title = asString(settings.title);
  const description = asString(settings.description);

  if (!overline && !title && !description) return null;

  return (
    <header className="portal-timeline__header mb-12 max-w-3xl">
      {overline ? (
        <p className="text-caption font-semibold uppercase tracking-widest text-secondary">
          {overline}
        </p>
      ) : null}
      {title ? (
        <h2 className="mt-2 text-display-l font-semibold text-foreground">{title}</h2>
      ) : null}
      {description ? (
        <p className="mt-4 text-body text-muted sm:text-lg">{description}</p>
      ) : null}
    </header>
  );
}
