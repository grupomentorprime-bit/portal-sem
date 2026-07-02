"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import type { PremiumHeroSlideView } from "@/core/hero/map-slide";

interface HeroPremiumImageProps {
  slide: Pick<
    PremiumHeroSlideView,
    | "id"
    | "imagenDesktopUrl"
    | "imagenMobileUrl"
    | "imageAlt"
    | "objectPosition"
    | "overlayEnabled"
    | "overlayColor"
    | "overlayOpacity"
  >;
  priority?: boolean;
}

function slideMediaKey(slide: HeroPremiumImageProps["slide"]): string {
  return `${slide.id}:${slide.imagenDesktopUrl ?? ""}:${slide.imagenMobileUrl ?? ""}`;
}

function HeroPremiumImageInner({ slide, priority = true }: HeroPremiumImageProps) {
  const [failed, setFailed] = useState(false);

  const desktopUrl = slide.imagenDesktopUrl && !failed ? slide.imagenDesktopUrl : undefined;
  const mobileUrl = slide.imagenMobileUrl && !failed ? slide.imagenMobileUrl : undefined;

  const hasDistinctMobile = Boolean(mobileUrl && mobileUrl !== desktopUrl);
  const mediaKey = slideMediaKey(slide);
  const imageStyle = {
    "--hero-img-position": slide.objectPosition,
  } as CSSProperties;

  return (
    <div className="hero-photo" aria-hidden={!desktopUrl && !mobileUrl}>
      <div className="hero-photo__fill">
        {desktopUrl && hasDistinctMobile ? (
          <Image
            key={`desktop-${mediaKey}`}
            src={desktopUrl}
            alt={slide.imageAlt}
            fill
            priority={priority}
            className="hero-photo__image hero-photo__image--desktop"
            style={imageStyle}
            sizes="(max-width: 767px) 100vw, 58vw"
            onError={() => setFailed(true)}
          />
        ) : null}
        {hasDistinctMobile && mobileUrl ? (
          <Image
            key={`mobile-${mediaKey}`}
            src={mobileUrl}
            alt={slide.imageAlt}
            fill
            priority={priority}
            className="hero-photo__image hero-photo__image--mobile"
            style={imageStyle}
            sizes="100vw"
            onError={() => setFailed(true)}
          />
        ) : null}
        {!hasDistinctMobile && (desktopUrl ?? mobileUrl) ? (
          <Image
            key={`single-${mediaKey}`}
            src={desktopUrl ?? mobileUrl!}
            alt={slide.imageAlt}
            fill
            priority={priority}
            className="hero-photo__image"
            style={imageStyle}
            sizes="(max-width: 767px) 100vw, 58vw"
            onError={() => setFailed(true)}
          />
        ) : null}
      </div>
      {slide.overlayEnabled ? (
        <div
          className="hero-premium__photo-overlay"
          style={{
            backgroundColor: slide.overlayColor,
            opacity: slide.overlayOpacity / 100,
          }}
          aria-hidden
        />
      ) : null}
    </div>
  );
}

export function HeroPremiumImage({ slide, priority }: HeroPremiumImageProps) {
  return <HeroPremiumImageInner key={slideMediaKey(slide)} slide={slide} priority={priority} />;
}
