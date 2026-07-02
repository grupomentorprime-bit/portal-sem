"use client";

import Image from "next/image";
import { useState } from "react";
import { iconSizes } from "@/design";
import { BlockIcon } from "@/components/portal/BlockIcon";
import { cn } from "@/lib/utils";

interface PortalCatalogImageProps {
  src?: string;
  alt: string;
  icon?: string;
  priority?: boolean;
  variant?: "default" | "featured" | "compact" | "horizontal" | "minimal";
  className?: string;
}

export function PortalCatalogImage({
  src,
  alt,
  icon = "BookOpen",
  priority = false,
  variant = "default",
  className,
}: PortalCatalogImageProps) {
  const [loaded, setLoaded] = useState(!src?.trim());
  const [error, setError] = useState(false);
  const showImage = Boolean(src?.trim()) && !error;

  return (
    <div
      className={cn(
        "portal-catalog-card__media",
        variant !== "default" && `portal-catalog-card__media--${variant}`,
        className
      )}
    >
      {showImage ? (
        <>
          {!loaded ? (
            <div
              className="portal-catalog-card__media-skeleton absolute inset-0 animate-pulse"
              aria-hidden
            />
          ) : null}
          <Image
            src={src!}
            alt={alt}
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            placeholder="empty"
            className={cn(
              "portal-catalog-card__media-img object-cover",
              !loaded && "opacity-0"
            )}
            sizes={
              variant === "horizontal"
                ? "(max-width: 768px) 100vw, 200px"
                : "(max-width: 768px) 100vw, (max-width: 1280px) 300px, 320px"
            }
            onLoad={() => setLoaded(true)}
            onError={() => {
              setError(true);
              setLoaded(true);
            }}
          />
          <div className="portal-catalog-card__media-overlay" aria-hidden />
        </>
      ) : (
        <div className="portal-catalog-card__media-placeholder" aria-hidden>
          <div className="portal-catalog-card__media-placeholder-mesh" />
          <BlockIcon
            name={icon}
            size={iconSizes.xl}
            className="relative z-[1] text-text-inverse/30"
            strokeWidth={1.5}
          />
        </div>
      )}
    </div>
  );
}
