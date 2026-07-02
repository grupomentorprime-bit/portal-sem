"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { iconSizes } from "@/design";
import { focusRing } from "@/components/ui/shared";
import { TestimonialAvatar } from "@/components/portal/institution/TestimonialAvatar";
import { cn } from "@/lib/utils";
import type { TestimonialItem } from "@/types/content";

const AUTOPLAY_MS = 7000;

interface TestimonialsCarouselProps {
  items: TestimonialItem[];
  className?: string;
}

function isGenericPlaceholderImage(src?: string): boolean {
  if (!src?.trim()) return true;
  return /gallery-4\.svg|placeholder/i.test(src);
}

function RatingStars({ rating }: { rating: number }) {
  const value = Math.min(5, Math.max(0, Math.round(rating)));

  return (
    <div className="testimonials-carousel__stars" role="img" aria-label={`Calificación: ${value} de 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={iconSizes.sm}
          strokeWidth={2}
          className={index < value ? "fill-current" : "opacity-35"}
          aria-hidden
        />
      ))}
    </div>
  );
}

interface CarouselSlideProps {
  testimonial: TestimonialItem;
  isActive: boolean;
  onSelect: () => void;
}

function CarouselSlide({ testimonial, isActive, onSelect }: CarouselSlideProps) {
  const avatarSrc = isGenericPlaceholderImage(testimonial.image) ? undefined : testimonial.image;
  const rating = testimonial.rating ?? 5;

  const card = (
    <div className="testimonials-carousel__slide-card">
      <blockquote className="testimonials-carousel__quote">
        <p>&ldquo;{testimonial.quote}&rdquo;</p>
      </blockquote>
      {isActive && rating > 0 ? <RatingStars rating={rating} /> : null}
      <footer className="testimonials-carousel__author">
        <TestimonialAvatar
          src={avatarSrc}
          name={testimonial.author}
          className="testimonials-carousel__avatar"
        />
        <div className="testimonials-carousel__author-text">
          <cite>{testimonial.author}</cite>
          {testimonial.role ? <span className="testimonials-carousel__role">{testimonial.role}</span> : null}
          {testimonial.program ? (
            <span className="testimonials-carousel__meta">{testimonial.program}</span>
          ) : null}
        </div>
      </footer>
    </div>
  );

  return (
    <article
      className={cn(
        "testimonials-carousel__slide",
        isActive && "testimonials-carousel__slide--active"
      )}
      aria-current={isActive ? "true" : undefined}
    >
      {isActive ? (
        card
      ) : (
        <button
          type="button"
          className="testimonials-carousel__slide-btn"
          onClick={onSelect}
          aria-label={`Ver testimonio de ${testimonial.author}`}
        >
          {card}
        </button>
      )}
    </article>
  );
}

export function TestimonialsCarousel({ items, className }: TestimonialsCarouselProps) {
  const count = items.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (direction: -1 | 1) => {
      setActive((index) => (index + direction + count) % count);
    },
    [count]
  );

  const visibleIndices = useMemo(() => {
    if (count <= 1) return [0];
    if (count === 2) return [0, 1];
    return [
      (active - 1 + count) % count,
      active,
      (active + 1) % count,
    ];
  }, [active, count]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    const timer = window.setInterval(() => go(1), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [count, go, paused]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (count === 0) return null;

  return (
    <div
      className={cn("testimonials-carousel", className)}
      role="region"
      aria-roledescription="carrusel"
      aria-label="Testimonios de la comunidad"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="testimonials-carousel__stage">
        {count > 1 ? (
          <button
            type="button"
            className={cn("testimonials-carousel__nav testimonials-carousel__nav--prev", focusRing)}
            onClick={() => go(-1)}
            aria-label="Testimonio anterior"
          >
            <ChevronLeft size={22} strokeWidth={2} aria-hidden />
          </button>
        ) : null}

        <div className="testimonials-carousel__track" aria-live="polite">
          {visibleIndices.map((itemIndex, slot) => {
            const item = items[itemIndex];
            const isActive = itemIndex === active;
            return (
              <CarouselSlide
                key={`${item.id}-${slot}`}
                testimonial={item}
                isActive={isActive}
                onSelect={() => setActive(itemIndex)}
              />
            );
          })}
        </div>

        {count > 1 ? (
          <button
            type="button"
            className={cn("testimonials-carousel__nav testimonials-carousel__nav--next", focusRing)}
            onClick={() => go(1)}
            aria-label="Testimonio siguiente"
          >
            <ChevronRight size={22} strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="testimonials-carousel__dots" role="tablist" aria-label="Seleccionar testimonio">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`Testimonio ${index + 1}: ${item.author}`}
              className={cn(
                "testimonials-carousel__dot",
                index === active && "testimonials-carousel__dot--active"
              )}
              onClick={() => setActive(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
