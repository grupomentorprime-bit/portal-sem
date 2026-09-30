"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type TouchEvent } from "react";
import { SEM_ISOTIPO_ON_DARK_SRC } from "@/lib/portal/sem-identity-v7";
import "@/styles/home-premium/hero-slider-prototype.css";

const DURATION_MS = 7000;

const STUDY = [
  "100% online",
  "Clases en vivo cada lunes",
  "Plataforma académica",
  "Estudio durante la semana",
] as const;

interface SlideLink {
  href: string;
  label: string;
}

interface Slide {
  id: string;
  kicker: string;
  title: string;
  highlight?: string;
  lead?: string;
  note?: string;
  links: SlideLink[];
  study?: boolean;
}

const SLIDES: Slide[] = [
  {
    id: "llamado",
    kicker: "Seminario Eclesiástico Mayor",
    title: "Tu llamado merece preparación.",
    highlight: "preparación.",
    lead: "Formación bíblica para un servicio real.",
    note: "Somos parte de IPN Chile — Iglesia Pentecostal Nazareth.",
    links: [
      { href: "/admision", label: "Admisión 2027" },
      { href: "/como-estudiamos", label: "Cómo estudiamos" },
    ],
  },
  {
    id: "estudio",
    kicker: "Modalidad",
    title: "Cómo estudiamos",
    lead: "100% online. Clases en vivo cada lunes. Plataforma académica durante la semana.",
    links: [{ href: "/como-estudiamos", label: "Cómo estudiamos" }],
    study: true,
  },
  {
    id: "admision",
    kicker: "Convocatoria vigente",
    title: "Admisión 2027",
    lead: "Más que aprender, servir mejor.",
    note: "Somos parte de IPN Chile — Iglesia Pentecostal Nazareth.",
    links: [{ href: "/admision", label: "Admisión 2027" }],
  },
];

function Title({ title, highlight }: { title: string; highlight?: string }) {
  if (!highlight || !title.includes(highlight)) return <>{title}</>;
  const at = title.indexOf(highlight);
  return (
    <>
      {title.slice(0, at)}
      <span>{highlight}</span>
    </>
  );
}

export function HeroSliderPrototype({
  initialIndex = 0,
  still = false,
}: {
  initialIndex?: number;
  still?: boolean;
}) {
  const count = SLIDES.length;
  const start = ((initialIndex % count) + count) % count;
  const [index, setIndex] = useState(start);
  const [cycle, setCycle] = useState(0);
  const [paused, setPaused] = useState(still);
  const [reduced, setReduced] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const go = useCallback(
    (next: number) => {
      setIndex(((next % count) + count) % count);
      setCycle((value) => value + 1);
    },
    [count]
  );

  useEffect(() => {
    if (paused || reduced || still) return;
    const timer = window.setTimeout(() => go(index + 1), DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [go, index, paused, reduced, still]);

  const onTouchStart = (event: TouchEvent<HTMLElement>) => {
    touchX.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (touchX.current === null) return;
    const end = event.changedTouches[0]?.clientX ?? touchX.current;
    const delta = end - touchX.current;
    if (Math.abs(delta) >= 48) go(delta > 0 ? index - 1 : index + 1);
    touchX.current = null;
  };

  return (
    <section
      className={[
        "sem-slider-proto",
        paused ? "sem-slider-proto--paused" : "",
        reduced ? "sem-slider-proto--reduced" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--sem-slider-ms": `${DURATION_MS}ms` } as CSSProperties}
      aria-roledescription="carrusel"
      aria-label="Prototipo del slider institucional"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(still)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(still);
        }
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") go(index - 1);
        if (event.key === "ArrowRight") go(index + 1);
      }}
    >
      <div className="sem-slider-proto__stage">
        {SLIDES.map((slide, slideIndex) => {
          const active = slideIndex === index;
          return (
            <article
              key={slide.id}
              className={
                active
                  ? "sem-slider-proto__slide sem-slider-proto__slide--active"
                  : "sem-slider-proto__slide"
              }
              aria-hidden={active ? undefined : true}
            >
              <div className="sem-slider-proto__wrap sem-slider-proto__layout">
                <div className="sem-slider-proto__copy">
                  <img
                    src={SEM_ISOTIPO_ON_DARK_SRC}
                    alt=""
                    width={56}
                    height={64}
                    className="sem-slider-proto__mark"
                  />
                  <p className="sem-slider-proto__kicker">{slide.kicker}</p>
                  {active ? (
                    <h1 className="sem-slider-proto__title">
                      <Title title={slide.title} highlight={slide.highlight} />
                    </h1>
                  ) : (
                    <p className="sem-slider-proto__title">
                      <Title title={slide.title} highlight={slide.highlight} />
                    </p>
                  )}
                  {slide.lead ? <p className="sem-slider-proto__lead">{slide.lead}</p> : null}
                  {slide.note ? <p className="sem-slider-proto__note">{slide.note}</p> : null}
                  <div className="sem-slider-proto__actions">
                    {slide.links.map((link) => (
                      <Link key={link.href + link.label} href={link.href} className="sem-slider-proto__link">
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {slide.study ? (
                  <ol className="sem-slider-proto__study">
                    {STUDY.map((item, itemIndex) => (
                      <li key={item}>
                        <span>{String(itemIndex + 1).padStart(2, "0")}</span>
                        {item}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="sem-slider-proto__seal" aria-hidden="true" />
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="sem-slider-proto__chrome">
        <div className="sem-slider-proto__wrap sem-slider-proto__controls">
          <button type="button" className="sem-slider-proto__arrow" onClick={() => go(index - 1)} aria-label="Slide anterior">
            ←
          </button>
          <div className="sem-slider-proto__pips" role="tablist" aria-label="Slides">
            {SLIDES.map((slide, slideIndex) => {
              const active = slideIndex === index;
              return (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`${slideIndex + 1}. ${slide.title}`}
                  className={
                    active
                      ? "sem-slider-proto__pip sem-slider-proto__pip--active"
                      : "sem-slider-proto__pip"
                  }
                  onClick={() => go(slideIndex)}
                >
                  <span className="sem-slider-proto__pip-track">
                    {active ? <span key={cycle} className="sem-slider-proto__pip-fill" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
          <button type="button" className="sem-slider-proto__arrow" onClick={() => go(index + 1)} aria-label="Slide siguiente">
            →
          </button>
          <p className="sem-slider-proto__count" aria-hidden="true">
            {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </p>
        </div>
      </div>
    </section>
  );
}
