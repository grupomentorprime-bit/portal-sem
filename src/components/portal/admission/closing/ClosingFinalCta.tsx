import { BlockIcon } from "@/components/portal/BlockIcon";
import { Button } from "@/components/ui/button";
import { iconSizes } from "@/design";
import type { AdmissionClosingFinalCtaData } from "@/types/admission-closing";

interface ClosingFinalCtaProps {
  data: AdmissionClosingFinalCtaData;
}

export function ClosingFinalCta({ data }: ClosingFinalCtaProps) {
  if (!data.title.trim() && !data.buttonLabel.trim()) return null;

  const icon = data.icon ? (
    <BlockIcon name={data.icon} size={iconSizes.md} aria-hidden />
  ) : null;

  const external = data.openInNewTab || data.buttonHref.startsWith("http");

  return (
    <aside className="admission-closing__final-cta" aria-label="Llamado a la acción">
      {icon ? <span className="admission-closing__final-cta-icon">{icon}</span> : null}
      <div className="admission-closing__final-cta-copy">
        {data.title ? <p className="admission-closing__final-cta-title">{data.title}</p> : null}
        {data.description ? (
          <p className="admission-closing__final-cta-description">{data.description}</p>
        ) : null}
      </div>
      {data.buttonLabel ? (
        external ? (
          <a
            href={data.buttonHref}
            target={data.openInNewTab ? "_blank" : undefined}
            rel={data.openInNewTab ? "noopener noreferrer" : undefined}
            className="admission-closing__final-cta-btn"
          >
            {data.buttonLabel}
          </a>
        ) : (
          <Button href={data.buttonHref} size="lg" className="admission-closing__final-cta-btn">
            {data.buttonLabel}
          </Button>
        )
      ) : null}
    </aside>
  );
}
