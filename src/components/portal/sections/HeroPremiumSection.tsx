"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Play,
  User,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import { iconSizes } from "@/design";
import { PortalContainer } from "@/components/portal/layout";
import { focusRing } from "@/components/ui/shared";
import { createDefaultCarouselSettings } from "@/lib/cms/hero-portal-defaults";
import { cn } from "@/lib/utils";
import type { HeroFeature, HeroGenerationCard } from "@/types/hero";
import type { HeroCarouselSettings, HeroPortalType } from "@/types/hero-portal";
import type { PremiumHeroSlideView } from "@/core/hero/map-slide";
import { buildHeroSlidesSignature } from "@/core/hero/slide-signature";
import { HeroPremiumImage } from "./HeroPremiumImage";
import { HeroPremiumInteractiveShell } from "./HeroPremiumInteractiveShell";

const FEATURE_ICONS: Record<string, LucideIcon> = {
  video: Video,
  book: BookOpen,
  award: Award,
  users: Users,
  user: User,
};

export interface HeroPremiumSectionProps {
  slides: PremiumHeroSlideView[];
  type?: HeroPortalType;
  carousel?: HeroCarouselSettings;
}

function CtaLink({
  href,
  className,
  openInNewTab,
  children,
}: {
  href: string;
  className: string;
  openInNewTab?: boolean;
  children: React.ReactNode;
}) {
  if (openInNewTab) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function HeroTitle({ title, highlight }: { title: string; highlight?: string }) {
  const lines = title.split("\n");

  return (
    <h1 className="hero-premium__title">
      {lines.map((line, lineIndex) => (
        <span key={lineIndex} className="hero-premium__title-line">
          {highlight && line.includes(highlight) ? (
            <>
              {line.slice(0, line.indexOf(highlight))}
              <span className="hero-premium__highlight">{highlight}</span>
              {line.slice(line.indexOf(highlight) + highlight.length)}
            </>
          ) : (
            line
          )}
        </span>
      ))}
    </h1>
  );
}

function GenerationCard({ card }: { card: HeroGenerationCard }) {
  if (!card.enabled) return null;

  const descriptionLines = card.description.split("\n");

  return (
    <aside className="hero-premium__generation-card" aria-label="Próximo evento académico">
      <div className="hero-premium__generation-card-icon" aria-hidden>
        <Calendar size={iconSizes.md} strokeWidth={2} />
      </div>
      <div className="hero-premium__generation-card-body">
        <p className="hero-premium__generation-card-label">{card.label}</p>
        <p className="hero-premium__generation-card-year">{card.year}</p>
        <p className="hero-premium__generation-card-desc">
          {descriptionLines.map((line, index) => (
            <span key={index} className="block">
              {line}
            </span>
          ))}
        </p>
        {card.ctaLabel && card.ctaHref ? (
          <Link href={card.ctaHref} className={cn("hero-premium__generation-card-cta", focusRing)}>
            {card.ctaLabel}
            <ArrowRight size={iconSizes.sm} strokeWidth={2} aria-hidden />
          </Link>
        ) : null}
      </div>
    </aside>
  );
}

function HeroCarouselIndicators({
  slides,
  currentIndex,
  onSelect,
  className,
}: {
  slides: PremiumHeroSlideView[];
  currentIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}) {
  return (
    <div
      className={cn("hero-premium__indicators", className)}
      role="tablist"
      aria-label="Slides del hero"
    >
      {slides.map((slide, index) => (
        <button
          key={slide.id}
          type="button"
          role="tab"
          aria-selected={index === currentIndex}
          aria-label={`Slide ${index + 1}${slide.title ? `: ${slide.title.replace(/\n/g, " ")}` : ""}`}
          className={cn(
            "hero-premium__indicator",
            index === currentIndex && "hero-premium__indicator--active"
          )}
          onClick={() => onSelect(index)}
        />
      ))}
    </div>
  );
}

function HeroFeatures({ features }: { features: HeroFeature[] }) {
  if (features.length === 0) return null;

  return (
    <div
      className="hero-premium__features hero-premium__animate-item hero-premium__animate-item--features"
      aria-label="Beneficios del seminario"
    >
      {features.map((feature, index) => {
        const Icon = FEATURE_ICONS[feature.icon] ?? GraduationCap;

        return (
          <div
            key={`${feature.title}-${index}`}
            className={cn(
              "hero-premium__feature",
              index < features.length - 1 && "hero-premium__feature--divider"
            )}
          >
            <span className="hero-premium__feature-icon" aria-hidden>
              <Icon size={18} strokeWidth={1.75} />
            </span>
            <div className="hero-premium__feature-copy">
              <p className="hero-premium__feature-title">{feature.title}</p>
              <p className="hero-premium__feature-desc">{feature.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HeroSlideCopy({ slide }: { slide: PremiumHeroSlideView }) {
  return (
    <div className="hero-content">
      {slide.eyebrow ? (
        <p className="hero-premium__eyebrow hero-premium__animate-item hero-premium__animate-item--eyebrow">
          {slide.eyebrow}
        </p>
      ) : null}

      <HeroTitle title={slide.title} highlight={slide.highlight} />

      {slide.description ? (
        <p className="hero-premium__description hero-premium__animate-item hero-premium__animate-item--desc">
          {slide.description}
        </p>
      ) : null}

      {slide.showCta &&
      ((slide.primaryLabel && slide.primaryHref) ||
        (slide.secondaryLabel && slide.secondaryHref)) ? (
        <div className="hero-premium__actions hero-premium__animate-item hero-premium__animate-item--actions">
          {slide.primaryLabel && slide.primaryHref ? (
            <CtaLink
              href={slide.primaryHref}
              openInNewTab={slide.primaryOpenInNewTab}
              className={cn("hero-premium__btn-primary", focusRing)}
            >
              <span data-cursor-magnet>{slide.primaryLabel.replace(/\s*→\s*$/, "")}</span>
              <ArrowRight size={18} strokeWidth={2.5} aria-hidden />
            </CtaLink>
          ) : null}
          {slide.secondaryLabel && slide.secondaryHref ? (
            <CtaLink
              href={slide.secondaryHref}
              openInNewTab={slide.secondaryOpenInNewTab}
              className={cn("hero-premium__btn-secondary", focusRing)}
            >
              <span className="hero-premium__btn-secondary-icon" aria-hidden>
                <Play size={iconSizes.sm} strokeWidth={2.5} />
              </span>
              <span data-cursor-magnet>{slide.secondaryLabel}</span>
            </CtaLink>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function HeroPremiumSection({
  slides,
  type = "image",
  carousel = createDefaultCarouselSettings(),
}: HeroPremiumSectionProps) {
  const displaySlides = type === "image" ? slides.slice(0, 1) : slides;
  const isCarousel = type === "carousel" && displaySlides.length > 1;

  const sharedGenerationCard = useMemo(
    () => displaySlides.find((slide) => slide.generationCard?.enabled)?.generationCard,
    [displaySlides]
  );

  const slidesSignature = useMemo(
    () => buildHeroSlidesSignature(displaySlides),
    [displaySlides]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- reiniciar slide activo cuando cambian los datos del CMS
  useEffect(() => {
    setCurrentIndex(0);
  }, [slidesSignature]);

  const goTo = useCallback(
    (index: number) => {
      if (displaySlides.length === 0) return;
      if (carousel.loop) {
        setCurrentIndex(
          ((index % displaySlides.length) + displaySlides.length) % displaySlides.length
        );
      } else {
        setCurrentIndex(Math.min(Math.max(index, 0), displaySlides.length - 1));
      }
    },
    [carousel.loop, displaySlides.length]
  );

  const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  useEffect(() => {
    if (!isCarousel || !carousel.autoplay || paused) return;
    const timer = setInterval(next, carousel.interval * 1000);
    return () => clearInterval(timer);
  }, [carousel.autoplay, carousel.interval, isCarousel, next, paused]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- ajustar índice si se elimina el slide activo
  useEffect(() => {
    if (currentIndex >= displaySlides.length) {
      setCurrentIndex(Math.max(0, displaySlides.length - 1));
    }
  }, [currentIndex, displaySlides.length]);

  const nextSlideIndex = isCarousel
    ? carousel.loop
      ? (currentIndex + 1) % displaySlides.length
      : Math.min(currentIndex + 1, displaySlides.length - 1)
    : -1;
  const nextSlide = nextSlideIndex >= 0 ? displaySlides[nextSlideIndex] : undefined;

  useEffect(() => {
    if (!isCarousel || !nextSlide || nextSlideIndex === currentIndex) return;

    const urls = [nextSlide.imagenDesktopUrl, nextSlide.imagenMobileUrl].filter(
      (url, index, list): url is string =>
        Boolean(url) && list.indexOf(url) === index
    );

    const images = urls.map((url) => {
      const img = new window.Image();
      img.src = url;
      return img;
    });

    return () => {
      for (const img of images) {
        img.src = "";
      }
    };
  }, [currentIndex, isCarousel, nextSlide, nextSlideIndex]);

  if (displaySlides.length === 0) return null;

  const activeSlide = displaySlides[currentIndex]!;
  const showInlineIndicators =
    Boolean(activeSlide.showBenefits) && isCarousel && carousel.showIndicators;

  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = useCallback((event: TouchEvent<HTMLElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback(
    (event: TouchEvent<HTMLElement>) => {
      if (!isCarousel || touchStartX.current === null) return;
      const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
      const delta = endX - touchStartX.current;
      if (Math.abs(delta) >= 48) {
        if (delta > 0) prev();
        else next();
      }
      touchStartX.current = null;
    },
    [isCarousel, next, prev]
  );

  const durationClass =
    carousel.transitionDuration === 1
      ? "hero-premium--duration-1"
      : "hero-premium--duration-05";
  const transitionClass =
    carousel.transition === "slide" ? "hero-premium--slide" : "hero-premium--fade";

  return (
    <HeroPremiumInteractiveShell
      aria-label="Presentación institucional"
      className={cn(
        "hero-premium--dynamic",
        isCarousel && "hero-premium--carousel",
        activeSlide.showBenefits && "hero-premium--with-benefits",
        transitionClass,
        durationClass
      )}
      onMouseEnter={isCarousel && carousel.pauseOnHover ? () => setPaused(true) : undefined}
      onMouseLeave={isCarousel && carousel.pauseOnHover ? () => setPaused(false) : undefined}
      onTouchStart={isCarousel ? handleTouchStart : undefined}
      onTouchEnd={isCarousel ? handleTouchEnd : undefined}
    >
      <div className="hero-premium__bg" aria-hidden />
      <div className="hero-premium__bg-glow hero-premium__bg-glow--left" aria-hidden />
      <div className="hero-premium__bg-glow hero-premium__bg-glow--right" aria-hidden />
      <div className="hero-premium__bg-glow hero-premium__bg-glow--text" aria-hidden />

      <div
        key={`photo-${activeSlide.id}-${currentIndex}`}
        className="hero-premium__region-fade"
      >
        <HeroPremiumImage slide={activeSlide} />
      </div>

      {sharedGenerationCard ? (
        <div className="hero-premium__generation-card-wrap hero-premium__animate-item hero-premium__animate-item--card">
          <GenerationCard card={sharedGenerationCard} />
        </div>
      ) : null}

      <div className="hero-premium__body">
        <div className="hero-premium__main">
          <PortalContainer size="full" className="hero-premium__container">
            <div
              key={`content-${activeSlide.id}-${currentIndex}`}
              className="hero-premium__slide-fade"
            >
              <div className="hero-premium__slide-content">
                <div className="hero-premium__left-stack">
                  <HeroSlideCopy slide={activeSlide} />
                  {activeSlide.showBenefits ? (
                    <HeroFeatures features={activeSlide.features} />
                  ) : null}
                  {showInlineIndicators ? (
                    <HeroCarouselIndicators
                      slides={displaySlides}
                      currentIndex={currentIndex}
                      onSelect={goTo}
                      className="hero-premium__indicators--inline"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </PortalContainer>
        </div>
      </div>

      {isCarousel && carousel.showArrows ? (
        <>
          <button
            type="button"
            className={cn("hero-premium__arrow hero-premium__arrow--prev", focusRing)}
            onClick={prev}
            aria-label="Slide anterior"
          >
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <button
            type="button"
            className={cn("hero-premium__arrow hero-premium__arrow--next", focusRing)}
            onClick={next}
            aria-label="Slide siguiente"
          >
            <ChevronRight size={24} strokeWidth={2} />
          </button>
        </>
      ) : null}

      {isCarousel && carousel.showIndicators && !showInlineIndicators ? (
        <HeroCarouselIndicators
          slides={displaySlides}
          currentIndex={currentIndex}
          onSelect={goTo}
        />
      ) : null}
    </HeroPremiumInteractiveShell>
  );
}
