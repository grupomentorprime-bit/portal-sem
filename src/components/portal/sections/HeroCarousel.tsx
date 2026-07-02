/**
 * @deprecated
 *
 * Reemplazado por:
 * HeroPremiumSection
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PortalContainer } from "@/components/portal/layout";
import { focusRing } from "@/components/ui/shared";
import { alignmentToObjectPosition } from "@/lib/cms/hero-portal-utils";
import { HOME_SECTION_ID } from "@/lib/navigation/home";
import { cn } from "@/lib/utils";
import type {
  HeroCarouselSettings,
  HeroPortalType,
  ResolvedHeroSlide,
} from "@/types/hero-portal";

interface HeroCarouselProps {
  slides: ResolvedHeroSlide[];
  type: HeroPortalType;
  carousel: HeroCarouselSettings;
}

function SlideContent({ slide }: { slide: ResolvedHeroSlide }) {
  const { content, multimedia, actions } = slide;
  const objectPosition = alignmentToObjectPosition(
    multimedia.alignment,
    multimedia.customAlignment
  );
  const desktopSrc = slide.imagenDesktopUrl;
  const mobileSrc = slide.imagenMobileUrl ?? desktopSrc;
  const title = content.title || "Hero institucional";

  return (
    <div className="hero-carousel__slide-inner">
      {desktopSrc ? (
        <>
          <Image
            src={desktopSrc}
            alt={multimedia.imageAlt || title}
            fill
            priority
            className="hero-carousel__image hero-carousel__image--desktop"
            style={{ objectPosition }}
            sizes="100vw"
          />
          {mobileSrc && mobileSrc !== desktopSrc ? (
            <Image
              src={mobileSrc}
              alt={multimedia.imageAlt || title}
              fill
              priority
              className="hero-carousel__image hero-carousel__image--mobile"
              style={{ objectPosition }}
              sizes="100vw"
            />
          ) : null}
        </>
      ) : (
        <div className="hero-carousel__placeholder" aria-hidden />
      )}

      {multimedia.overlay.enabled ? (
        <div
          className="hero-carousel__overlay"
          style={{
            backgroundColor: multimedia.overlay.color,
            opacity: multimedia.overlay.opacity / 100,
          }}
          aria-hidden
        />
      ) : null}

      <div className="hero-carousel__content">
        <PortalContainer size="full">
          <div className="hero-carousel__text animate-slide-up">
            {content.eyebrow ? (
              <p className="hero-carousel__eyebrow">{content.eyebrow}</p>
            ) : null}
            {content.subtitle ? (
              <p className="hero-carousel__subtitle">{content.subtitle}</p>
            ) : null}
            {content.title ? <h1 className="hero-carousel__title">{content.title}</h1> : null}
            {content.description ? (
              <p className="hero-carousel__description">{content.description}</p>
            ) : null}

            {actions.enabled &&
            ((actions.primary.text && actions.primary.url) ||
              (actions.secondary.text && actions.secondary.url)) ? (
              <div className="hero-carousel__actions">
                {actions.primary.text && actions.primary.url ? (
                  actions.primary.openInNewTab ? (
                    <a
                      href={actions.primary.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("hero-carousel__btn-primary", focusRing)}
                    >
                      {actions.primary.text}
                    </a>
                  ) : (
                    <Link
                      href={actions.primary.url}
                      className={cn("hero-carousel__btn-primary", focusRing)}
                    >
                      {actions.primary.text}
                    </Link>
                  )
                ) : null}
                {actions.secondary.text && actions.secondary.url ? (
                  actions.secondary.openInNewTab ? (
                    <a
                      href={actions.secondary.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("hero-carousel__btn-secondary", focusRing)}
                    >
                      {actions.secondary.text}
                    </a>
                  ) : (
                    <Link
                      href={actions.secondary.url}
                      className={cn("hero-carousel__btn-secondary", focusRing)}
                    >
                      {actions.secondary.text}
                    </Link>
                  )
                ) : null}
              </div>
            ) : null}
          </div>
        </PortalContainer>
      </div>
    </div>
  );
}

export function HeroCarousel({ slides, type, carousel }: HeroCarouselProps) {
  const isCarousel = type === "carousel" && slides.length > 1;
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (slides.length === 0) return;
      if (carousel.loop) {
        setCurrent(((index % slides.length) + slides.length) % slides.length);
      } else {
        setCurrent(Math.min(Math.max(index, 0), slides.length - 1));
      }
    },
    [carousel.loop, slides.length]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (!isCarousel || !carousel.autoplay || paused) return;
    const ms = carousel.interval * 1000;
    const timer = setInterval(next, ms);
    return () => clearInterval(timer);
  }, [carousel.autoplay, carousel.interval, isCarousel, next, paused]);

  if (slides.length === 0) return null;

  const transitionClass =
    carousel.transition === "slide" ? "hero-carousel--slide" : "hero-carousel--fade";
  const durationClass =
    carousel.transitionDuration === 1
      ? "hero-carousel--duration-1"
      : "hero-carousel--duration-05";

  return (
    <section
      id={HOME_SECTION_ID}
      className={cn("hero-carousel", transitionClass, durationClass)}
      aria-label="Hero institucional"
      aria-roledescription={isCarousel ? "carrusel" : undefined}
      onMouseEnter={() => carousel.pauseOnHover && setPaused(true)}
      onMouseLeave={() => carousel.pauseOnHover && setPaused(false)}
    >
      <div className="hero-carousel__track">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={cn(
              "hero-carousel__slide",
              index === current && "hero-carousel__slide--active",
              carousel.transition === "slide" &&
                index < current &&
                "hero-carousel__slide--past"
            )}
            aria-hidden={index !== current}
          >
            <SlideContent slide={slide} />
          </div>
        ))}
      </div>

      {isCarousel && carousel.showArrows ? (
        <>
          <button
            type="button"
            className={cn("hero-carousel__arrow hero-carousel__arrow--prev", focusRing)}
            onClick={prev}
            aria-label="Slide anterior"
          >
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <button
            type="button"
            className={cn("hero-carousel__arrow hero-carousel__arrow--next", focusRing)}
            onClick={next}
            aria-label="Slide siguiente"
          >
            <ChevronRight size={24} strokeWidth={2} />
          </button>
        </>
      ) : null}

      {isCarousel && carousel.showIndicators ? (
        <div className="hero-carousel__indicators" role="tablist" aria-label="Slides del hero">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={index === current}
              aria-label={`Slide ${index + 1}${slide.content.title ? `: ${slide.content.title}` : ""}`}
              className={cn(
                "hero-carousel__indicator",
                index === current && "hero-carousel__indicator--active"
              )}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
