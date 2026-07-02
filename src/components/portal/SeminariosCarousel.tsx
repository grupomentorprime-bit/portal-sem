"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/ui/shared";
import type { SeminarioCard } from "@/lib/portal/institutional-demo";

const CARD_WIDTH = 280;
const GAP = 24;

interface SeminariosCarouselProps {
  seminarios: SeminarioCard[];
  className?: string;
}

export function SeminariosCarousel({ seminarios, className }: SeminariosCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [seminarios.length, updateScrollState]);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const step = CARD_WIDTH + GAP;
    el.scrollBy({ left: direction === "left" ? -step : step, behavior: "smooth" });
  }, []);

  if (seminarios.length === 0) return null;

  return (
    <div className={cn("seminarios-home__carousel-wrap", className)}>
      <button
          type="button"
          className={cn(
            "seminarios-home__nav seminarios-home__nav--prev",
            !canScrollLeft && "seminarios-home__nav--hidden",
            focusRing
          )}
          onClick={() => scroll("left")}
          aria-label="Seminarios anteriores"
          disabled={!canScrollLeft}
        >
          <ChevronLeft size={22} strokeWidth={2} aria-hidden />
        </button>

        <div ref={trackRef} className="seminarios-home__track" role="list">
          {seminarios.map((s) => (
            <article key={s.id} className="seminario-card" role="listitem">
              <div className="seminario-card__media">
                {s.imageUrl ? (
                  <Image
                    src={s.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="280px"
                  />
                ) : (
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-[var(--sem-primary)] to-[var(--sem-secondary)]"
                    aria-hidden
                  />
                )}
              </div>
              <div className="seminario-card__body">
                <h3 className="seminario-card__title">{s.title}</h3>
                <p className="seminario-card__meta">{s.metaLine}</p>
                <Link href={s.ctaHref} className="seminario-card__cta">
                  {s.ctaLabel}
                </Link>
              </div>
            </article>
          ))}
        </div>

        <button
          type="button"
          className={cn(
            "seminarios-home__nav seminarios-home__nav--next",
            !canScrollRight && "seminarios-home__nav--hidden",
            focusRing
          )}
          onClick={() => scroll("right")}
          aria-label="Seminarios siguientes"
          disabled={!canScrollRight}
        >
          <ChevronRight size={22} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
