import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BlockIcon } from "@/components/portal/BlockIcon";
import { PortalContainer, PortalSection } from "@/components/portal/layout";
import type { FeatureItem } from "@/lib/portal/blocks";
import { cn } from "@/lib/utils";

const WEEK_DAYS = [
  { id: "lun", label: "Lun", live: true },
  { id: "mar", label: "Mar", live: false },
  { id: "mie", label: "Mié", live: false },
  { id: "jue", label: "Jue", live: false },
  { id: "vie", label: "Vie", live: false },
  { id: "sab", label: "Sáb", live: false },
  { id: "dom", label: "Dom", live: false },
] as const;

interface MethodologyHomeExperienceProps {
  overline?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  items: FeatureItem[];
  /** Badge del último paso (p. ej. certificación). Vacío = no mostrar. */
  destinationBadge?: string;
  buttonLabel?: string;
  buttonHref?: string;
  /** Semana formativa: lunes en vivo y el resto en estudio. */
  layout?: "track" | "week";
  id?: string;
}

export function MethodologyHomeExperience({
  overline,
  title,
  subtitle,
  description,
  items,
  destinationBadge,
  buttonLabel,
  buttonHref,
  layout = "track",
  id = "metodologia",
}: MethodologyHomeExperienceProps) {
  if (layout === "week") {
    if (!title?.trim()) return null;
    const ctaLabel = buttonLabel?.trim();
    const ctaHref = buttonHref?.trim();

    return (
      <PortalSection id={id} padding="none" className="methodology-home-section">
        <PortalContainer>
          <div className="methodology-week animate-slide-up" role="region" aria-labelledby="methodology-home-heading">
            <header className="methodology-week__intro">
              {overline ? <p className="methodology-week__eyebrow">{overline}</p> : null}
              <h2 id="methodology-home-heading" className="methodology-week__title">
                {title}
              </h2>
            </header>

            <div className="methodology-week__board" aria-label="Ritmo de la semana">
              <article className="methodology-week__monday">
                <p className="methodology-week__day-name">Lunes</p>
                <p className="methodology-week__monday-label">Clase en vivo</p>
              </article>
              <article className="methodology-week__rest">
                <ol className="methodology-week__days">
                  {WEEK_DAYS.filter((day) => !day.live).map((day) => (
                    <li key={day.id} className="methodology-week__day">
                      <span>{day.label}</span>
                    </li>
                  ))}
                </ol>
                <p className="methodology-week__rest-label">
                  Estudio, materiales y actividades
                </p>
              </article>
            </div>

            {ctaLabel && ctaHref ? (
              <Link href={ctaHref} className="methodology-week__link">
                {ctaLabel}
                <ArrowRight size={16} strokeWidth={2} aria-hidden />
              </Link>
            ) : null}
          </div>
        </PortalContainer>
      </PortalSection>
    );
  }

  if (!title?.trim() && items.length === 0) return null;

  const destinationIndex = items.length - 1;
  const badge = destinationBadge?.trim() ?? "";

  return (
    <PortalSection id={id} padding="lg" className="methodology-home-section">
      <PortalContainer>
        <div className="methodology-home animate-slide-up" role="region" aria-labelledby="methodology-home-heading">
          <header className="methodology-home__masthead">
            <div className="methodology-home__intro">
              {overline ? <p className="methodology-home__eyebrow">{overline}</p> : null}
              {title ? (
                <h2 id="methodology-home-heading" className="methodology-home__title">
                  {title}
                </h2>
              ) : null}
              {subtitle ? <p className="methodology-home__subtitle">{subtitle}</p> : null}
            </div>
            <div className="methodology-home__masthead-accent" aria-hidden>
              <span className="methodology-home__masthead-line" />
              <span className="methodology-home__masthead-label">Ruta formativa</span>
            </div>
          </header>

          <ol className="methodology-home__track" aria-label="Pasos de la metodología">
            {items.map((item, index) => {
              const isDestination = index === destinationIndex && items.length > 1;

              return (
                <li
                  key={item.id}
                  className={cn(
                    "methodology-home__node",
                    isDestination && "methodology-home__node--destination",
                    index < destinationIndex && "methodology-home__node--linked",
                    `methodology-home__node--stagger-${Math.min(index + 1, 6)}`
                  )}
                >
                  <div className="methodology-home__node-marker">
                    <span className="methodology-home__node-index" aria-hidden>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="methodology-home__node-icon" aria-hidden>
                      <BlockIcon name={item.icon} size={22} strokeWidth={1.75} />
                    </span>
                  </div>
                  <div className="methodology-home__node-body">
                    <h3 className="methodology-home__node-title">{item.title}</h3>
                    <p className="methodology-home__node-description">{item.description}</p>
                    {isDestination && badge ? (
                      <span className="methodology-home__node-badge">{badge}</span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>

          {description ? <p className="methodology-home__footnote">{description}</p> : null}
        </div>
      </PortalContainer>
    </PortalSection>
  );
}
