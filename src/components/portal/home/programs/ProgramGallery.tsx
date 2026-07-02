"use client";

import Image from "next/image";
import { useState } from "react";
import { SEM_PROGRAM_ISOTYPE } from "@/lib/portal/program-demo-assets";
import { cn } from "@/lib/utils";

interface ProgramGalleryProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}

export function ProgramGallery({
  src,
  alt,
  priority = false,
  className,
}: ProgramGalleryProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <figure className={cn("program-gallery", className)}>
      <div className="program-gallery__frame">
        {!loaded ? (
          <div className="program-gallery__skeleton" aria-hidden />
        ) : null}
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          loading={priority ? undefined : "lazy"}
          placeholder="empty"
          className={cn(
            "program-gallery__image",
            !loaded && "program-gallery__image--loading"
          )}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 55vw, 720px"
          onLoad={() => setLoaded(true)}
        />
        <div className="program-gallery__overlay" aria-hidden />
        <div className="program-gallery__brand" aria-hidden>
          <Image
            src={SEM_PROGRAM_ISOTYPE}
            alt=""
            width={52}
            height={60}
            className="program-gallery__brand-img"
          />
        </div>
      </div>
    </figure>
  );
}
