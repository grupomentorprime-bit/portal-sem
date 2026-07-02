import { BlockIcon } from "@/components/portal/BlockIcon";
import { PortalContainer, PortalSection } from "@/components/portal/layout";
import type { FeatureItem } from "@/lib/portal/blocks";
import { cn } from "@/lib/utils";

interface MethodologyHomeExperienceProps {
  overline?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  items: FeatureItem[];
  id?: string;
}

export function MethodologyHomeExperience({
  overline,
  title,
  subtitle,
  description,
  items,
  id = "metodologia",
}: MethodologyHomeExperienceProps) {
  if (!title?.trim() && items.length === 0) return null;

  const destinationIndex = items.length - 1;

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
                    {isDestination ? (
                      <span className="methodology-home__node-badge">IPN Chile</span>
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
