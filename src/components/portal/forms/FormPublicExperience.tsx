import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  ClipboardCheck,
  Clock,
  DoorOpen,
  Heart,
  MapPin,
  MessageCircle,
  Shirt,
  Sparkles,
  Users,
  Utensils,
} from "lucide-react";
import type {
  ExperienceFormExperience,
  FormExperienceBlockType,
  FormExperienceInfoIcon,
} from "@/types/experience-form-experience";
import { toFormLandingConfig } from "@/lib/cms/form-experience-utils";
import {
  chileCalendarDaysUntil,
  normalizeChileEventTime,
  resolveChileEventStartMs,
} from "@/lib/experience/forms/convocatoria-event-datetime";
import { FormLandingCountdown } from "./FormLandingCountdown";

const INFO_ICONS: Record<FormExperienceInfoIcon, typeof Calendar> = {
  calendar: Calendar,
  "map-pin": MapPin,
  users: Users,
  book: BookOpen,
  heart: Heart,
  clock: Clock,
  sparkles: Sparkles,
  message: MessageCircle,
  shirt: Shirt,
  utensils: Utensils,
  "door-open": DoorOpen,
  "clipboard-check": ClipboardCheck,
};

interface FormPublicExperienceProps {
  experience: ExperienceFormExperience;
  breadcrumb?: ReactNode;
  children: ReactNode;
}

function counterText(experience: ExperienceFormExperience): string | null {
  const { counter } = experience;
  if (!counter.enabled) return null;

  if (counter.mode === "custom" && counter.customText) return counter.customText;

  if (counter.mode === "slots" && typeof counter.slotsRemaining === "number") {
    return `${counter.label} ${counter.slotsRemaining} cupos`;
  }

  if (counter.mode === "days_until" && counter.targetDate) {
    const targetMs = resolveChileEventStartMs(
      counter.targetDate,
      undefined,
      normalizeChileEventTime(counter.targetTime)
    );
    const calendarDays = chileCalendarDaysUntil(targetMs);
    if (calendarDays > 0) {
      return `${counter.label} ${calendarDays} día${calendarDays === 1 ? "" : "s"}`;
    }
    if (calendarDays === 0 && targetMs > Date.now()) {
      return `${counter.label} hoy`;
    }
    return null;
  }

  return null;
}

function isBlockEnabled(experience: ExperienceFormExperience, type: FormExperienceBlockType): boolean {
  return experience.blocks.find((block) => block.type === type)?.enabled ?? false;
}

export function FormPublicExperience({
  experience,
  breadcrumb,
  children,
}: FormPublicExperienceProps) {
  const landing = toFormLandingConfig(experience);
  const layoutClass = `form-landing--layout-${experience.appearance.layout}`;
  const widthClass = `form-landing--width-${experience.appearance.contentWidth}`;
  const spacingClass = `form-landing--spacing-${experience.appearance.spacing}`;
  const shadowClass = `form-landing--shadow-${experience.appearance.shadow}`;
  const radiusClass = `form-landing--radius-${experience.appearance.borderRadius}`;
  const counterLabel = counterText(experience);

  const visibleHeroCtas = experience.hero.secondaryCtas.filter((cta) => {
    if (!cta.visible) return false;
    if (experience.appearance.theme === "convocatoria") return false;
    if (cta.href === "#form-landing-form") return false;
    return true;
  });

  const showHeroCountdown =
    experience.counter.enabled &&
    experience.counter.mode === "days_until" &&
    Boolean(experience.counter.targetDate);

  const visibleCards = experience.infoCards.filter((card) => card.visible);
  const visibleBanners = experience.banners.filter((banner) => banner.visible);

  const heroStyle = experience.appearance.primaryColor
    ? ({ "--fl-hero-from": experience.appearance.primaryColor } as CSSProperties)
    : undefined;

  const sortedBlocks = [...experience.blocks].sort((a, b) => a.order - b.order);
  const heroBlockEnabled = isBlockEnabled(experience, "hero") && experience.hero.enabled;
  const showBreadcrumbInHero = heroBlockEnabled && experience.hero.showBreadcrumb;

  const renderMotivational = (className?: string) => {
    if (!experience.hero.motivational) return null;
    return (
      <blockquote className={["form-landing__motivational", className].filter(Boolean).join(" ")}>
        <Sparkles className="form-landing__motivational-icon" aria-hidden="true" />
        <p>{experience.hero.motivational}</p>
      </blockquote>
    );
  };

  const renderHeroInner = () => (
    <>
      {showBreadcrumbInHero && breadcrumb ? (
        <div className="form-landing__breadcrumb">{breadcrumb}</div>
      ) : null}

      <p className="form-landing__eyebrow">{experience.hero.eyebrow}</p>
      <h1 className="form-landing__headline" id="form-landing-headline">
        {experience.hero.headline}
      </h1>
      <p className="form-landing__subheadline">{experience.hero.subheadline}</p>

      {renderMotivational()}

      {showHeroCountdown && experience.counter.targetDate ? (
        <FormLandingCountdown
          targetDate={experience.counter.targetDate}
          targetTime={experience.counter.targetTime}
          label={experience.counter.label}
        />
      ) : null}

      {visibleHeroCtas.length > 0 ? (
        <div className="form-landing__hero-ctas">
          {visibleHeroCtas.map((cta) => {
            const isHashLink = cta.href.startsWith("#");
            const ctaClassName = [
              "form-landing__hero-cta",
              isHashLink ? "form-landing__hero-cta--primary" : "",
            ]
              .filter(Boolean)
              .join(" ");

            if (isHashLink) {
              return (
                <a key={cta.id} href={cta.href} className={ctaClassName}>
                  {cta.label}
                </a>
              );
            }

            return (
              <Link key={cta.id} href={cta.href} className={ctaClassName}>
                {cta.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </>
  );

  const renderBlock = (type: FormExperienceBlockType): ReactNode => {
    switch (type) {
      case "hero":
        if (!heroBlockEnabled) {
          return breadcrumb && !showBreadcrumbInHero ? (
            <div className="form-landing__breadcrumb-only">{breadcrumb}</div>
          ) : null;
        }
        return (
          <section
            className={`form-landing__hero form-landing__hero--${experience.hero.height}`}
            aria-labelledby="form-landing-headline"
          >
            <div className="form-landing__hero-bg" aria-hidden="true">
              <div className="form-landing__orb form-landing__orb--1" />
              <div className="form-landing__orb form-landing__orb--2" />
              <div className="form-landing__orb form-landing__orb--3" />
            </div>

            <div
              className="form-landing__hero-overlay"
              style={{ opacity: experience.hero.overlayOpacity / 100 }}
              aria-hidden="true"
            />

            <div className="form-landing__hero-inner">{renderHeroInner()}</div>
          </section>
        );

      case "info_cards":
        if (!isBlockEnabled(experience, "info_cards") || visibleCards.length === 0) return null;
        return (
          <section className="form-landing__info-cards" aria-label="Información">
            <ul className="form-landing__highlights form-landing__highlights--section">
              {visibleCards.map((item) => {
                const Icon = INFO_ICONS[item.icon];
                return (
                  <li key={item.id} className="form-landing__highlight">
                    <span className="form-landing__highlight-icon" aria-hidden="true">
                      <Icon />
                    </span>
                    <span className="form-landing__highlight-text">
                      <span className="form-landing__highlight-label">{item.label}</span>
                      {item.href ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="form-landing__highlight-value form-landing__highlight-link"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <span className="form-landing__highlight-value">{item.value}</span>
                      )}
                      {item.description ? (
                        <span className="form-landing__highlight-desc">{item.description}</span>
                      ) : item.href ? (
                        <span className="form-landing__highlight-desc">Abrir en mapa</span>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );

      case "editorial":
        if (!isBlockEnabled(experience, "editorial") || !experience.editorial.enabled) return null;
        return (
          <section className="form-landing__editorial" aria-labelledby="form-editorial-title">
            <div className="form-landing__editorial-inner">
              <h2 id="form-editorial-title" className="form-landing__editorial-title">
                {experience.editorial.title}
              </h2>
              <p className="form-landing__editorial-body">{experience.editorial.body}</p>
            </div>
          </section>
        );

      case "banners":
        if (!isBlockEnabled(experience, "banners") || visibleBanners.length === 0) return null;
        return (
          <div className="form-landing__banners" aria-label="Avisos">
            {visibleBanners.map((banner) => {
              const Icon = INFO_ICONS[banner.icon];
              return (
                <div
                  key={banner.id}
                  className={`form-landing__banner form-landing__banner--${banner.tone}`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="form-landing__banner-title">{banner.title}</p>
                    {banner.body ? <p className="form-landing__banner-body">{banner.body}</p> : null}
                  </div>
                </div>
              );
            })}
          </div>
        );

      case "counter":
        if (!isBlockEnabled(experience, "counter") || !counterLabel) return null;
        return (
          <div className="form-landing__counter" role="status">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span>{counterLabel}</span>
          </div>
        );

      case "form":
        if (!isBlockEnabled(experience, "form")) return children;
        return (
          <section
            id="form-landing-form"
            className="form-landing__form-section"
            aria-label="Formulario"
          >
            <div className="form-landing__form-card">{children}</div>
          </section>
        );

      case "faq":
        if (
          !isBlockEnabled(experience, "faq") ||
          !experience.faq.enabled ||
          experience.faq.items.length === 0
        ) {
          return null;
        }
        return (
          <section className="form-landing__faq" aria-labelledby="form-faq-title">
            <div className="form-landing__faq-inner">
              <h2 id="form-faq-title" className="form-landing__faq-title">
                {experience.faq.title}
              </h2>
              <dl className="form-landing__faq-list">
                {experience.faq.items
                  .filter((item) => item.visible)
                  .map((item) => (
                    <div key={item.id} className="form-landing__faq-item">
                      <dt>{item.question}</dt>
                      <dd>{item.answer}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          </section>
        );

      case "contact":
        if (!isBlockEnabled(experience, "contact") || !experience.contact.enabled) return null;
        return (
          <section className="form-landing__contact" aria-labelledby="form-contact-title">
            <div className="form-landing__contact-inner">
              <h2 id="form-contact-title">{experience.contact.title}</h2>
              <p>{experience.contact.body}</p>
              {experience.contact.email ? (
                <a href={`mailto:${experience.contact.email}`}>{experience.contact.email}</a>
              ) : null}
              {experience.contact.phone ? <p>{experience.contact.phone}</p> : null}
            </div>
          </section>
        );

      case "footer":
        if (!isBlockEnabled(experience, "footer") || !experience.footer.enabled) return null;
        return (
          <footer className="form-landing__footer">
            <div className="form-landing__footer-inner">
              {experience.footer.pastoralMessage ? (
                <p className="form-landing__footer-message">{experience.footer.pastoralMessage}</p>
              ) : null}
              {experience.footer.verse ? (
                <p className="form-landing__footer-verse">{experience.footer.verse}</p>
              ) : null}
              <div className="form-landing__footer-contacts">
                {experience.footer.contactEmail ? (
                  <a href={`mailto:${experience.footer.contactEmail}`}>
                    {experience.footer.contactEmail}
                  </a>
                ) : null}
                {experience.footer.contactPhone ? (
                  <span>{experience.footer.contactPhone}</span>
                ) : null}
                {experience.footer.whatsapp ? (
                  <a
                    href={`https://wa.me/${experience.footer.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp
                  </a>
                ) : null}
              </div>
              {experience.footer.socialLinks.filter((link) => link.visible).length > 0 ? (
                <div className="form-landing__footer-social">
                  {experience.footer.socialLinks
                    .filter((link) => link.visible)
                    .map((link) => (
                      <a key={link.id} href={link.href} target="_blank" rel="noopener noreferrer">
                        {link.label}
                      </a>
                    ))}
                </div>
              ) : null}
              {experience.footer.copyright ? (
                <p className="form-landing__footer-copy">{experience.footer.copyright}</p>
              ) : null}
            </div>
          </footer>
        );

      default:
        return null;
    }
  };

  const renderedBlocks = sortedBlocks
    .filter((block) => block.enabled)
    .map((block) => <div key={block.id}>{renderBlock(block.type)}</div>);

  const formBlockEnabled = isBlockEnabled(experience, "form");
  const hasFormInBlocks = sortedBlocks.some((block) => block.type === "form" && block.enabled);

  return (
    <div
      className={`form-landing form-landing--${landing.theme} ${layoutClass} ${widthClass} ${spacingClass} ${shadowClass} ${radiusClass}`}
      style={heroStyle}
    >
      {!heroBlockEnabled && breadcrumb ? (
        <div className="form-landing__breadcrumb-only">{breadcrumb}</div>
      ) : null}
      {renderedBlocks}
      {!hasFormInBlocks && formBlockEnabled ? renderBlock("form") : null}
      {!formBlockEnabled ? children : null}
    </div>
  );
}
