"use client";

import Image from "next/image";
import { useState } from "react";
import { UserRound } from "lucide-react";
import { iconSizes } from "@/design";
import { nextImagePropsForSrc } from "@/lib/media/next-image-props";
import { cn } from "@/lib/utils";

interface PortalPersonImageProps {
  src?: string;
  alt: string;
  priority?: boolean;
  className?: string;
}

export function PortalPersonImage({
  src,
  alt,
  priority = false,
  className,
}: PortalPersonImageProps) {
  const [loaded, setLoaded] = useState(!src?.trim());
  const [error, setError] = useState(false);
  const showImage = Boolean(src?.trim()) && !error;

  return (
    <div className={cn("portal-person-card__media", className)}>
      {showImage ? (
        <>
          {!loaded ? (
            <div
              className="portal-person-card__media-skeleton absolute inset-0 animate-pulse"
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
              "portal-person-card__media-img object-cover object-top",
              "absolute inset-0 h-full w-full",
              !loaded && "opacity-0"
            )}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            onLoad={() => setLoaded(true)}
            onError={() => {
              setError(true);
              setLoaded(true);
            }}
            {...nextImagePropsForSrc(src!)}
          />
        </>
      ) : (
        <div className="portal-person-card__media-placeholder" aria-hidden>
          <UserRound size={iconSizes.xl} className="text-secondary/30" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}
