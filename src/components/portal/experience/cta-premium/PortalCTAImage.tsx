"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { iconSizes } from "@/design";
import type { PortalCTAImageProps } from "@/types/cta-premium";
import { cn } from "@/lib/utils";

export function PortalCTAImage({
  src,
  alt,
  priority = false,
  className,
}: PortalCTAImageProps) {
  const [loaded, setLoaded] = useState(!src?.trim());
  const [error, setError] = useState(false);
  const showImage = Boolean(src?.trim()) && !error;

  return (
    <div className={cn("portal-cta-premium__media", className)}>
      {showImage ? (
        <>
          {!loaded ? (
            <div
              className="portal-cta-premium__media-skeleton absolute inset-0 animate-pulse"
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
              "portal-cta-premium__media-img object-cover",
              !loaded && "opacity-0"
            )}
            sizes="(max-width: 1024px) 100vw, 50vw"
            onLoad={() => setLoaded(true)}
            onError={() => {
              setError(true);
              setLoaded(true);
            }}
          />
        </>
      ) : (
        <div className="portal-cta-premium__media-placeholder" aria-hidden>
          <ImageIcon size={iconSizes.xl} className="text-secondary/30" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}
