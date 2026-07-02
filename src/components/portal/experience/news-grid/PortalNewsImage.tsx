"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { iconSizes } from "@/design";
import { cn } from "@/lib/utils";

interface PortalNewsImageProps {
  src?: string;
  alt: string;
  priority?: boolean;
  className?: string;
}

export function PortalNewsImage({
  src,
  alt,
  priority = false,
  className,
}: PortalNewsImageProps) {
  const [loaded, setLoaded] = useState(!src?.trim());
  const [error, setError] = useState(false);
  const showImage = Boolean(src?.trim()) && !error;

  return (
    <div className={cn("portal-news-card__media", className)}>
      {showImage ? (
        <>
          {!loaded ? (
            <div
              className="portal-news-card__media-skeleton absolute inset-0 animate-pulse"
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
              "portal-news-card__media-img object-cover",
              !loaded && "opacity-0"
            )}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            onLoad={() => setLoaded(true)}
            onError={() => {
              setError(true);
              setLoaded(true);
            }}
          />
          <div className="portal-news-card__media-overlay" aria-hidden />
        </>
      ) : (
        <div className="portal-news-card__media-placeholder" aria-hidden>
          <ImageIcon size={iconSizes.xl} className="text-secondary/30" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}
