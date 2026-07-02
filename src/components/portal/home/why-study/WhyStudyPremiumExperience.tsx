import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { asString } from "@/lib/cms/block-utils";
import type { PortalFeatureGridSettings } from "@/types/feature-grid";
import { cn } from "@/lib/utils";
import { WhyStudyAboutPanel } from "./WhyStudyAboutPanel";
import { WhyStudyInstitutionalBanner } from "./WhyStudyAboutPanel";
import { WhyStudyPlatformShowcase } from "./WhyStudyPlatformShowcase";

interface WhyStudyPremiumExperienceProps {
  settings: PortalFeatureGridSettings;
  id?: string;
  muted?: boolean;
  className?: string;
}

export function WhyStudyPremiumExperience({
  settings,
  id = "por-que-estudiar",
  muted = false,
  className,
}: WhyStudyPremiumExperienceProps) {
  const overline = asString(settings.overline);
  const title = asString(settings.title);
  const description = asString(settings.description);

  return (
    <PortalSection id={id} muted={muted}>
      <PortalContainer>
        <div
          className={cn("why-study-premium animate-slide-up", className)}
          role="region"
          aria-label={title || "¿Por qué estudiar en el SEM?"}
        >
          {overline || title || description ? (
            <header className="why-study-premium__header">
              {overline ? (
                <p className="why-study-premium__eyebrow">{overline}</p>
              ) : null}
              {title ? (
                <h2 className="why-study-premium__title">{title}</h2>
              ) : null}
              {description ? (
                <p className="why-study-premium__description">{description}</p>
              ) : null}
            </header>
          ) : null}

          <WhyStudyAboutPanel className="why-study-premium__about" />
          <WhyStudyInstitutionalBanner className="why-study-premium__banner" />
          <WhyStudyPlatformShowcase className="why-study-premium__platform" />
        </div>
      </PortalContainer>
    </PortalSection>
  );
}
