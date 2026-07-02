import { ArrowRight } from "lucide-react";
import { iconSizes } from "@/design";
import { Button } from "@/components/ui";
import { PortalContainer, PortalSection } from "@/components/portal/layout";

interface PortalSectionHeaderProps {
  overline?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}

export function PortalSectionHeader({
  overline,
  title,
  description,
  href,
  linkLabel = "Ver más",
}: PortalSectionHeaderProps) {
  return (
    <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {overline ? (
          <p className="text-caption font-semibold uppercase tracking-widest text-secondary">
            {overline}
          </p>
        ) : null}
        <h2 className="mt-2 text-display-l font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-3 text-body text-muted">{description}</p>
        ) : null}
      </div>
      {href ? (
        <Button href={href} variant="ghost" className="shrink-0 self-start sm:self-auto">
          {linkLabel}
          <ArrowRight size={iconSizes.sm} strokeWidth={2} aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}

interface PortalPageHeaderProps {
  title: string;
  description?: string;
}

export function PortalPageHeader({ title, description }: PortalPageHeaderProps) {
  return (
    <PortalSection padding="md" className="border-b border-border bg-background-soft">
      <PortalContainer>
        <h1 className="text-display-m font-semibold text-foreground">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-3xl text-body text-muted">{description}</p>
        ) : null}
      </PortalContainer>
    </PortalSection>
  );
}
