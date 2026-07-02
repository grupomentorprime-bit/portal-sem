import Image from "next/image";
import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { asString } from "@/lib/cms/block-utils";

interface AllianceSectionProps {
  title?: string;
  description?: string;
  organization?: string;
  logoSecondary?: string;
}

export function AllianceSection({
  title,
  description,
  organization,
  logoSecondary,
}: AllianceSectionProps) {
  const displayTitle = asString(title, organization ?? "");
  if (!displayTitle || !logoSecondary) return null;

  return (
    <PortalSection muted id="alianza-institucional">
      <PortalContainer>
        <div className="flex flex-col items-center gap-8 rounded-[var(--radius-2xl)] border border-border bg-background p-8 text-center sm:p-12 lg:flex-row lg:text-left">
          <Image
            src={logoSecondary}
            alt=""
            width={120}
            height={120}
            className="h-24 w-auto shrink-0"
          />
          <div className="flex-1">
            <h2 className="text-display-l font-semibold text-foreground">{displayTitle}</h2>
            {description ? (
              <p className="mt-4 text-body text-muted">{description}</p>
            ) : null}
          </div>
        </div>
      </PortalContainer>
    </PortalSection>
  );
}
