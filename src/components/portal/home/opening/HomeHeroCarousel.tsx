"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { HOME_HERO_INTERVAL_MS } from "@/lib/cms/home-hero-photos";
import type { ResolvedHomeOpeningImage } from "@/lib/portal/home-opening";

interface HomeHeroCarouselProps {
  images: ResolvedHomeOpeningImage[];
}

function photoStyle(src: string): CSSProperties {
  const safe = src.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return { "--ho-photo": `url("${safe}")` } as CSSProperties;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

export function HomeHeroCarousel({ images }: HomeHeroCarouselProps) {
  const many = images.length > 1;
  const [index, setIndex] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [hiddenPaused, setHiddenPaused] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const active = images.length === 0 ? 0 : index % images.length;

  useEffect(() => {
    if (!many || hoverPaused || focusPaused || hiddenPaused || reducedMotion) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, HOME_HERO_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [many, hoverPaused, focusPaused, hiddenPaused, reducedMotion, images.length, index]);

  useEffect(() => {
    const onVisibility = () => setHiddenPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const section = stageRef.current?.closest("section");
    if (!section || !many) return;

    const fineHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onEnter = () => {
      if (fineHover) setHoverPaused(true);
    };
    const onLeave = () => setHoverPaused(false);
    let finish: ((event: Event) => void) | null = null;

    const onUp = (event: Event) => {
      if (finish) {
        window.removeEventListener("pointerup", finish);
        window.removeEventListener("pointercancel", finish);
        finish = null;
      }
      if (!tracking) return;
      tracking = false;
      if (event.type === "pointercancel") return;
      const pointer = event as PointerEvent;
      const dx = pointer.clientX - startX;
      const dy = pointer.clientY - startY;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      setIndex((current) => {
        const count = images.length;
        return dx < 0 ? (current + 1) % count : (current - 1 + count) % count;
      });
    };
    const onDown = (event: Event) => {
      if (tracking) return;
      const pointer = event as PointerEvent;
      const target = pointer.target;
      if (target instanceof Element && target.closest("a, button")) return;
      tracking = true;
      startX = pointer.clientX;
      startY = pointer.clientY;
      finish = onUp;
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    };

    section.addEventListener("mouseenter", onEnter);
    section.addEventListener("mouseleave", onLeave);
    section.addEventListener("pointerdown", onDown);
    return () => {
      section.removeEventListener("mouseenter", onEnter);
      section.removeEventListener("mouseleave", onLeave);
      section.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [many, images.length]);

  const go = (next: number) => {
    if (!many) return;
    const count = images.length;
    setIndex((next + count) % count);
  };

  return (
    <>
      <div ref={stageRef} className="home-opening__hero-stage">
        {images.map((image, imageIndex) => (
          <div
            key={image.mediaId ?? image.src}
            className="home-opening__hero-photo"
            style={photoStyle(image.src)}
            data-active={imageIndex === active ? "true" : undefined}
            data-provisional={image.provisional ? "true" : undefined}
            aria-hidden="true"
          />
        ))}
      </div>
      {many ? (
        <div
          className="home-opening__hero-ui"
          onFocus={() => setFocusPaused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setFocusPaused(false);
          }}
        >
          <button
            type="button"
            className="home-opening__hero-nav"
            aria-label="Fotografía anterior"
            onClick={() => go(active - 1)}
          >
            <ChevronLeft size={16} strokeWidth={2.25} aria-hidden />
          </button>
          <div className="home-opening__hero-dots" role="tablist" aria-label="Fotografías del inicio">
            {images.map((image, imageIndex) => {
              const label = image.alt
                ? `Fotografía ${imageIndex + 1} de ${images.length}: ${image.alt}`
                : `Fotografía ${imageIndex + 1} de ${images.length}`;
              return (
                <button
                  key={image.mediaId ?? image.src}
                  type="button"
                  role="tab"
                  className="home-opening__hero-dot"
                  aria-label={label}
                  aria-selected={imageIndex === active}
                  onClick={() => go(imageIndex)}
                />
              );
            })}
          </div>
          <button
            type="button"
            className="home-opening__hero-nav"
            aria-label="Fotografía siguiente"
            onClick={() => go(active + 1)}
          >
            <ChevronRight size={16} strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      ) : null}
    </>
  );
}
