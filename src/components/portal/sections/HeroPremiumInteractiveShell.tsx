"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  type TouchEvent,
} from "react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import { HOME_SECTION_ID } from "@/lib/navigation/home";
import { cn } from "@/lib/utils";

/** Isotipo oficial — solo para partículas del hero, no modifica el logo del header */
const HERO_FLAME_ISOTYPE = "/images/logo-sem-isotype.png";

interface FireParticle {
  id: string;
  x: number;
  y: number;
  drift: number;
  scale: number;
  duration: number;
  rotation: number;
  kind: "flame" | "ember" | "spark";
}

interface HeroPremiumInteractiveShellProps {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onTouchStart?: (event: TouchEvent<HTMLElement>) => void;
  onTouchEnd?: (event: TouchEvent<HTMLElement>) => void;
}

const FLAME_LIFETIME_MS = 2000;
const MAX_PARTICLES = 24;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function HeroPremiumInteractiveShell({
  children,
  className,
  "aria-label": ariaLabel,
  onMouseEnter,
  onMouseLeave,
  onTouchStart,
  onTouchEnd,
}: HeroPremiumInteractiveShellProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [motionReduced, setMotionReduced] = useState(false);
  const [particles, setParticles] = useState<FireParticle[]>([]);

  useDeferredEffect(() => {
    setMounted(true);

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotionReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const spawnFire = useCallback(
    (x: number, y: number) => {
      if (motionReduced) return;

      const burst: FireParticle[] = [
        ...Array.from({ length: 3 }, (_, index) => ({
          id: `flame-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
          x: x + (index - 1) * 14,
          y: y - index * 3,
          drift: randomBetween(-28, 28),
          scale: randomBetween(0.55, 0.95),
          duration: randomBetween(1.4, 1.9),
          rotation: randomBetween(-12, 12),
          kind: "flame" as const,
        })),
        ...Array.from({ length: 5 }, (_, index) => ({
          id: `ember-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
          x: x + randomBetween(-20, 20),
          y: y + randomBetween(-8, 8),
          drift: randomBetween(-40, 40),
          scale: randomBetween(0.35, 0.75),
          duration: randomBetween(0.9, 1.35),
          rotation: 0,
          kind: "ember" as const,
        })),
        {
          id: `spark-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          x,
          y,
          drift: 0,
          scale: 1,
          duration: 0.55,
          rotation: 0,
          kind: "spark" as const,
        },
      ];

      setParticles((current) => [...current, ...burst].slice(-MAX_PARTICLES));

      window.setTimeout(() => {
        setParticles((current) =>
          current.filter((particle) => !burst.some((item) => item.id === particle.id))
        );
      }, FLAME_LIFETIME_MS);
    },
    [motionReduced]
  );

  const handlePointerDown = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      spawnFire(event.clientX - rect.left, event.clientY - rect.top);
    },
    [spawnFire]
  );

  return (
    <section
      id={HOME_SECTION_ID}
      ref={sectionRef}
      className={cn(
        "hero-premium hero-premium--interactive",
        mounted && "hero-premium--mounted",
        className
      )}
      aria-label={ariaLabel}
      onPointerDown={handlePointerDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="hero-premium__fire-field" aria-hidden>
        {particles.map((particle) => (
          <span
            key={particle.id}
            className={cn(
              "hero-premium__fire-particle",
              particle.kind === "flame" && "hero-premium__fire-particle--flame",
              particle.kind === "ember" && "hero-premium__fire-particle--ember",
              particle.kind === "spark" && "hero-premium__fire-particle--spark"
            )}
            style={
              {
                left: `${particle.x}px`,
                top: `${particle.y}px`,
                "--fire-drift": `${particle.drift}px`,
                "--fire-scale": particle.scale,
                "--fire-duration": `${particle.duration}s`,
                "--fire-rotation": `${particle.rotation}deg`,
              } as CSSProperties
            }
          >
            {particle.kind === "flame" ? (
              <Image
                src={HERO_FLAME_ISOTYPE}
                alt=""
                width={48}
                height={58}
                className="hero-premium__fire-flame-img"
                aria-hidden
              />
            ) : null}
          </span>
        ))}
      </div>
      {children}
    </section>
  );
}
