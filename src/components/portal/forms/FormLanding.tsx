import type { ReactNode } from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  Heart,
  MapPin,
  MessageCircle,
  Sparkles,
  Users,
} from "lucide-react";
import type { FormLandingConfig, FormLandingHighlight } from "@/lib/admin/forms-center";

const HIGHLIGHT_ICONS: Record<FormLandingHighlight["icon"], typeof Calendar> = {
  calendar: Calendar,
  "map-pin": MapPin,
  users: Users,
  book: BookOpen,
  heart: Heart,
  clock: Clock,
  sparkles: Sparkles,
  message: MessageCircle,
};

interface FormLandingProps {
  config: FormLandingConfig;
  breadcrumb?: ReactNode;
  children: ReactNode;
}

export function FormLanding({ config, breadcrumb, children }: FormLandingProps) {
  return (
    <div className={`form-landing form-landing--${config.theme}`}>
      <section className="form-landing__hero" aria-labelledby="form-landing-headline">
        <div className="form-landing__hero-bg" aria-hidden="true">
          <div className="form-landing__orb form-landing__orb--1" />
          <div className="form-landing__orb form-landing__orb--2" />
          <div className="form-landing__orb form-landing__orb--3" />
        </div>

        <div className="form-landing__hero-inner">
          {breadcrumb ? <div className="form-landing__breadcrumb">{breadcrumb}</div> : null}

          <p className="form-landing__eyebrow">{config.eyebrow}</p>
          <h1 className="form-landing__headline" id="form-landing-headline">
            {config.headline}
          </h1>
          <p className="form-landing__subheadline">{config.subheadline}</p>

          {config.motivational ? (
            <blockquote className="form-landing__motivational">
              <Sparkles className="form-landing__motivational-icon" aria-hidden="true" />
              <p>{config.motivational}</p>
            </blockquote>
          ) : null}

          {config.highlights.length > 0 ? (
            <ul className="form-landing__highlights">
              {config.highlights.map((item) => {
                const Icon = HIGHLIGHT_ICONS[item.icon];
                return (
                  <li key={`${item.label}-${item.value}`} className="form-landing__highlight">
                    <span className="form-landing__highlight-icon" aria-hidden="true">
                      <Icon />
                    </span>
                    <span className="form-landing__highlight-text">
                      <span className="form-landing__highlight-label">{item.label}</span>
                      <span className="form-landing__highlight-value">{item.value}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </section>

      <section className="form-landing__form-section" aria-label="Formulario">
        <div className="form-landing__form-card">{children}</div>
      </section>
    </div>
  );
}
