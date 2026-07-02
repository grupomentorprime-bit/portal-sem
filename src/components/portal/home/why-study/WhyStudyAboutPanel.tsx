import {
  SEM_INSTITUTIONAL_ABOUT,
  SEM_PLATFORM_SHOWCASE,
  SEM_WHY_STUDY_BANNER,
} from "@/lib/portal/sem-why-study-content";
import { cn } from "@/lib/utils";

interface WhyStudyAboutPanelProps {
  className?: string;
}

export function WhyStudyAboutPanel({ className }: WhyStudyAboutPanelProps) {
  const about = SEM_INSTITUTIONAL_ABOUT;

  return (
    <section
      className={cn("why-study-about", className)}
      aria-labelledby="why-study-about-heading"
    >
      <div className="why-study-about__copy">
        <p className="why-study-about__eyebrow">{about.overline}</p>
        <h2 id="why-study-about-heading" className="why-study-about__title">
          Sobre nosotros
        </h2>
        <div className="why-study-about__columns">
          <div className="why-study-about__block">
            <h3 className="why-study-about__label">{about.visionTitle}</h3>
            <p className="why-study-about__text">{about.vision}</p>
          </div>
          <div className="why-study-about__block">
            <h3 className="why-study-about__label">{about.missionTitle}</h3>
            <p className="why-study-about__text">{about.mission}</p>
          </div>
        </div>
      </div>
      <div className="why-study-about__stat" aria-label={`${about.enrolledValue} ${about.enrolledLabel}`}>
        <strong className="why-study-about__stat-value">{about.enrolledValue}</strong>
        <span className="why-study-about__stat-label">{about.enrolledLabel}</span>
      </div>
    </section>
  );
}

interface WhyStudyInstitutionalBannerProps {
  className?: string;
}

export function WhyStudyInstitutionalBanner({
  className,
}: WhyStudyInstitutionalBannerProps) {
  const banner = SEM_WHY_STUDY_BANNER;

  return (
    <div className={cn("why-study-banner", className)}>
      <h3 className="why-study-banner__title">{banner.title}</h3>
      <p className="why-study-banner__description">{banner.description}</p>
    </div>
  );
}
