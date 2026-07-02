"use client";

import Image from "next/image";
import { GraduationCap } from "lucide-react";
import { useState } from "react";
import { iconSizes } from "@/design";
import { cn } from "@/lib/utils";

interface PortalHeroMediaProps {
  src?: string;
  alt?: string;
  overlayOpacity?: number;
  variant?: "portrait" | "landscape";
  className?: string;
}

export function PortalHeroMedia({
  src,
  alt = "",
  overlayOpacity = 75,
  variant = "portrait",
  className,
}: PortalHeroMediaProps) {
  const [error, setError] = useState(false);
  const showImage = Boolean(src?.trim()) && !error;
  const overlayAlpha = Math.min(90, Math.max(35, overlayOpacity)) / 100;

  return (
    <div
      className={cn(
        "portal-hero-media group",
        variant === "landscape" && "portal-hero-media--landscape",
        className
      )}
    >
      <div className="portal-hero-media__glow" aria-hidden />
      {showImage ? (
        <>
          <Image
            src={src!}
            alt={alt}
            fill
            priority
            className="object-cover transition-transform duration-[var(--transition-slow)] group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px"
            onError={() => setError(true)}
          />
          <div
            className="absolute inset-0 bg-primary transition-opacity duration-[var(--transition-normal)]"
            style={{ opacity: overlayAlpha * 0.55 }}
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/20 to-transparent"
            aria-hidden
          />
        </>
      ) : (
        <div className="portal-hero-media__placeholder" aria-hidden>
          <div className="portal-hero-media__placeholder-mesh" />
          <GraduationCap
            size={iconSizes.xl}
            className="relative z-[1] text-text-inverse/25"
            strokeWidth={1.5}
          />
        </div>
      )}
      <div className="portal-hero-media__frame" aria-hidden />
    </div>
  );
}
