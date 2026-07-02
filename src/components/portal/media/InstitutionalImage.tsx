"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { getPhotoAssetById } from "@/lib/media/institutional-catalog-data";
import {
  focalToObjectPosition,
  INSTITUTIONAL_IMAGE_VARIANTS,
  pickInstitutionalSrc,
} from "@/lib/media/institutional-image-variants";
import type { InstitutionalImageVariant } from "@/types/institutional-photo";
import { cn } from "@/lib/utils";

export interface InstitutionalImageProps {
  /** ID en public/media/catalog.json */
  assetId?: string;
  /** URL directa si no se usa catálogo */
  src?: string;
  alt: string;
  variant?: InstitutionalImageVariant;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  /** Ancho preferido para srcset (px) */
  preferredWidth?: number;
  overlay?: boolean;
}

export function InstitutionalImage({
  assetId,
  src: srcProp,
  alt,
  variant = "card",
  priority = false,
  className,
  imageClassName,
  preferredWidth = 1080,
  overlay = false,
}: InstitutionalImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const asset = assetId ? getPhotoAssetById(assetId) : undefined;
  const config = INSTITUTIONAL_IMAGE_VARIANTS[variant];

  const { src, srcSet, blurDataURL, objectPosition } = useMemo(() => {
    if (asset && !error) {
      const picked = pickInstitutionalSrc(asset.variants, preferredWidth);
      return {
        src: picked.src || asset.source,
        srcSet: picked.srcSet,
        blurDataURL: asset.blurDataURL,
        objectPosition: focalToObjectPosition(asset.focal_point, config.defaultFocal),
      };
    }
    return {
      src: srcProp ?? "",
      srcSet: undefined,
      blurDataURL: undefined,
      objectPosition: focalToObjectPosition(undefined, config.defaultFocal),
    };
  }, [asset, srcProp, preferredWidth, config.defaultFocal, error]);

  const showImage = Boolean(src) && !error;
  const isHero = variant === "hero";
  const effectivePriority = priority || isHero;

  return (
    <div
      className={cn(
        "institutional-image",
        `institutional-image--${variant}`,
        config.minHeight,
        config.rounded && "institutional-image--rounded",
        className
      )}
      style={{ aspectRatio: config.aspectRatio }}
    >
      {showImage ? (
        <>
          {!loaded ? (
            <div
              className="institutional-image__skeleton absolute inset-0 animate-pulse"
              aria-hidden
            />
          ) : null}
          <Image
            src={src}
            alt={alt}
            fill
            priority={effectivePriority}
            loading={effectivePriority ? undefined : "lazy"}
            placeholder={blurDataURL ? "blur" : "empty"}
            blurDataURL={blurDataURL}
            sizes={config.sizes}
            className={cn(
              "institutional-image__img object-cover",
              !loaded && "opacity-0",
              imageClassName
            )}
            style={{ objectPosition }}
            onLoad={() => setLoaded(true)}
            onError={() => {
              setError(true);
              setLoaded(true);
            }}
          />
          {overlay ? (
            <div className="institutional-image__overlay" aria-hidden />
          ) : null}
        </>
      ) : (
        <div className="institutional-image__fallback" aria-hidden>
          <div className="institutional-image__fallback-mesh" />
        </div>
      )}
    </div>
  );
}
