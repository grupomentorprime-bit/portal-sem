import { Button } from "@/components/ui";
import { BlockIcon } from "@/components/portal/BlockIcon";
import { iconSizes } from "@/design";
import { PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalEmptyState } from "@/components/portal/PortalEmptyState";
import { PortalSectionHeader } from "@/components/portal/PortalSectionHeader";
import { PortalHeroMedia } from "@/components/portal/PortalHeroMedia";
import { FeatureCard, StatCard, TestimonialCard } from "@/components/portal/cards";
import { TestimonialsCarousel } from "@/components/portal/experience/testimonials/TestimonialsCarousel";
import { GalleryImage } from "@/components/portal/institution/GalleryImage";
import type { FeatureItem, StatItem } from "@/lib/portal/blocks";
import type { GalleryItem, TestimonialItem } from "@/types/content";
import { cn } from "@/lib/utils";

/* ─── Section 1: ¿Por qué estudiar? ─── */

interface WhyStudyContentProps {
  overline?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  highlights: FeatureItem[];
  error?: boolean;
}

export function WhyStudySectionContent({
  overline,
  title,
  subtitle,
  description,
  highlights,
  error = false,
}: WhyStudyContentProps) {
  const hasHeader = Boolean(title?.trim());
  const hasContent = highlights.length > 0;

  if (!hasHeader && !hasContent && !error) return null;

  return (
    <PortalSection id="por-que-estudiar">
      <PortalContainer>
        {hasHeader ? (
          <PortalSectionHeader
            overline={overline}
            title={title ?? ""}
            description={subtitle || description}
          />
        ) : null}

        {error ? (
          <PortalEmptyState
            title="No fue posible cargar la información"
            description="Intenta de nuevo más tarde."
          />
        ) : hasContent ? (
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4" role="list">
            {highlights.map((item) => (
              <li key={item.id} className="h-full">
                <FeatureCard
                  title={item.title}
                  description={item.description}
                  icon={item.icon}
                  className="trust-feature-card h-full"
                />
              </li>
            ))}
          </ul>
        ) : (
          <PortalEmptyState
            title="Contenido en preparación"
            description="Los puntos destacados se configurarán desde el CMS."
          />
        )}
      </PortalContainer>
    </PortalSection>
  );
}

/* ─── Section 2: Modalidad ─── */

interface ModalityContentProps {
  overline?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  items: FeatureItem[];
  image?: string;
  buttonLabel?: string;
  buttonHref?: string;
  error?: boolean;
}

export function ModalitySectionContent({
  overline,
  title,
  subtitle,
  description,
  items,
  image,
  buttonLabel,
  buttonHref,
  error = false,
}: ModalityContentProps) {
  const hasHeader = Boolean(title?.trim());

  if (!hasHeader && items.length === 0 && !error) return null;

  return (
    <PortalSection muted id="modalidad">
      <PortalContainer>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            {hasHeader ? (
              <PortalSectionHeader
                overline={overline}
                title={title ?? ""}
                description={subtitle || description}
              />
            ) : null}

            {error ? (
              <PortalEmptyState
                title="No fue posible cargar la modalidad"
                description="Intenta de nuevo más tarde."
              />
            ) : items.length > 0 ? (
              <ul className="space-y-6" role="list">
                {items.map((item) => (
                  <li key={item.id} className="trust-modality-item flex gap-4">
                    <span className="portal-icon-badge shrink-0" aria-hidden>
                      <BlockIcon name={item.icon} size={iconSizes.sm} strokeWidth={2} />
                    </span>
                    <div>
                      <h3 className="text-heading text-foreground">{item.title}</h3>
                      <p className="mt-1 text-body text-muted">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <PortalEmptyState
                title="Modalidad en actualización"
                description="La información de modalidad se publicará desde el CMS."
              />
            )}

            {buttonHref && buttonLabel ? (
              <Button href={buttonHref} variant="primary" className="mt-8">
                {buttonLabel}
              </Button>
            ) : null}
          </div>

          <PortalHeroMedia src={image} variant="landscape" />
        </div>
      </PortalContainer>
    </PortalSection>
  );
}

/* ─── Section 3: Vida estudiantil (Galería) ─── */

interface GalleryContentProps {
  overline?: string;
  title?: string;
  description?: string;
  items: GalleryItem[];
  showButton?: boolean;
  buttonLabel?: string;
  buttonHref?: string;
  error?: boolean;
  errorTitle?: string;
  errorDescription?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function GallerySectionContent({
  overline,
  title,
  description,
  items,
  showButton = false,
  buttonLabel,
  buttonHref,
  error = false,
  errorTitle,
  errorDescription,
  emptyTitle,
  emptyDescription,
}: GalleryContentProps) {
  const hasHeader = Boolean(title?.trim());

  if (!hasHeader && items.length === 0 && !error) return null;

  return (
    <PortalSection id="vida-estudiantil">
      <PortalContainer>
        {hasHeader ? (
          <PortalSectionHeader
            overline={overline}
            title={title ?? ""}
            description={description}
            href={showButton ? buttonHref : undefined}
            linkLabel={buttonLabel}
          />
        ) : null}

        {error ? (
          errorTitle ? (
            <PortalEmptyState title={errorTitle} description={errorDescription} />
          ) : null
        ) : items.length > 0 ? (
          <div className="trust-gallery">
            {items.map((item, index) => (
              <GalleryImage
                key={item.id}
                src={item.src}
                alt={item.alt || item.id}
                priority={index === 0}
                className={cn(
                  "trust-gallery__cell",
                  index === 0 && "trust-gallery__cell--featured"
                )}
                sizes={
                  index === 0
                    ? "(max-width: 768px) 100vw, 50vw"
                    : "(max-width: 768px) 50vw, 25vw"
                }
              />
            ))}
          </div>
        ) : emptyTitle ? (
          <PortalEmptyState title={emptyTitle} description={emptyDescription} />
        ) : null}
      </PortalContainer>
    </PortalSection>
  );
}

/* ─── Section 4: Estadísticas ─── */

interface StatsContentProps {
  overline?: string;
  title?: string;
  stats: StatItem[];
  error?: boolean;
}

export function StatsSectionContent({
  overline,
  title,
  stats,
  error = false,
}: StatsContentProps) {
  if (stats.length === 0 && !error && !title?.trim()) return null;

  return (
    <PortalSection id="estadisticas" className="trust-stats-section bg-primary">
      <PortalContainer>
        {title?.trim() ? (
          <div className="mb-12 text-center">
            {overline ? (
              <p className="text-caption font-semibold uppercase tracking-widest text-accent">
                {overline}
              </p>
            ) : null}
            <h2 className="mt-2 text-display-l font-semibold text-text-inverse">{title}</h2>
          </div>
        ) : null}

        {error ? (
          <PortalEmptyState
            title="No fue posible cargar las estadísticas"
            description="Intenta de nuevo más tarde."
          />
        ) : stats.length > 0 ? (
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4" role="list">
            {stats.map((stat) => (
              <li key={stat.id}>
                <StatCard value={stat.value} label={stat.label} variant="inverse" />
              </li>
            ))}
          </ul>
        ) : (
          <PortalEmptyState
            title="Estadísticas próximamente"
            description="Los indicadores institucionales se configurarán desde el CMS."
          />
        )}
      </PortalContainer>
    </PortalSection>
  );
}

/* ─── Section 5: Testimonios ─── */

interface TestimonialsContentProps {
  overline?: string;
  title?: string;
  description?: string;
  items: TestimonialItem[];
  error?: boolean;
  errorTitle?: string;
  errorDescription?: string;
  editorialHome?: boolean;
}

export function TestimonialsSectionContent({
  overline,
  title,
  description,
  items,
  error = false,
  errorTitle,
  errorDescription,
  editorialHome = false,
}: TestimonialsContentProps) {
  const hasHeader = Boolean(title?.trim());

  if (!hasHeader && items.length === 0 && !error) return null;

  const header = hasHeader ? (
    <div className={editorialHome ? "testimonials-home__header" : undefined}>
      <PortalSectionHeader
        overline={overline}
        title={title ?? ""}
        description={description}
      />
    </div>
  ) : null;

  const body = error ? (
    errorTitle ? (
      <PortalEmptyState title={errorTitle} description={errorDescription} />
    ) : null
  ) : items.length > 0 ? (
    editorialHome ? (
      <TestimonialsCarousel items={items} />
    ) : (
      <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" role="list">
        {items.map((item) => (
          <li key={item.id} className="h-full">
            <TestimonialCard testimonial={item} />
          </li>
        ))}
      </ul>
    )
  ) : (
    <PortalEmptyState
      title="Testimonios en preparación"
      description="Las voces de nuestra comunidad se publicarán desde el CMS."
    />
  );

  return (
    <PortalSection
      muted
      id="testimonios"
      padding={editorialHome ? "sm" : "lg"}
      className={editorialHome ? "testimonials-home-section" : undefined}
    >
      {editorialHome ? (
        <div className="testimonials-home__band">
          <div className="testimonials-home__band-bg" aria-hidden />
          <PortalContainer className="testimonials-home__band-inner">
            {header}
            {body}
          </PortalContainer>
        </div>
      ) : (
        <PortalContainer>
          {header}
          {body}
        </PortalContainer>
      )}
    </PortalSection>
  );
}

/* ─── Section 6: Versículo ─── */

interface VerseContentProps {
  text?: string;
  reference?: string;
  background?: string;
  image?: string;
}

export function VerseSectionContent({
  text,
  reference,
  background = "gradient",
  image,
}: VerseContentProps) {
  if (!text?.trim()) return null;

  return (
    <PortalSection id="versiculo" className="trust-verse-section">
      <PortalContainer size="md">
        <figure
          className={cn(
            "trust-verse",
            background === "primary" && "trust-verse--primary",
            background === "soft" && "trust-verse--soft",
            background === "gradient" && "trust-verse--gradient",
            image && "trust-verse--image"
          )}
          style={image ? { backgroundImage: `url(${image})` } : undefined}
        >
          <blockquote className="trust-verse__quote">
            <p className="text-display-l font-medium text-foreground md:text-display-xl">
              &ldquo;{text}&rdquo;
            </p>
            {reference ? (
              <figcaption className="mt-6 text-caption font-semibold text-secondary">
                — {reference}
              </figcaption>
            ) : null}
          </blockquote>
        </figure>
      </PortalContainer>
    </PortalSection>
  );
}
