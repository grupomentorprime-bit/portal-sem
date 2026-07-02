"use client";

import Image from "next/image";
import { useState } from "react";
import { SEM_PROGRAM_ISOTYPE } from "@/lib/portal/program-demo-assets";
import { cn } from "@/lib/utils";

interface ProgramCardMediaProps {
  src: string;
  alt?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  showBrandMark?: boolean;
}

export function ProgramCardMedia({
  src,
  alt = "",
  priority = false,
  sizes = "(max-width: 768px) 100vw, 480px",
  className,
  showBrandMark = true,
}: ProgramCardMediaProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn("program-card-media relative overflow-hidden", className)}>
      {!loaded ? (
        <div className="program-card-media__skeleton" aria-hidden />
      ) : null}
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        loading={priority ? undefined : "lazy"}
        className={cn(
          "program-card-media__image",
          !loaded && "program-card-media__image--loading"
        )}
        sizes={sizes}
        onLoad={() => setLoaded(true)}
      />
      <div className="program-card-media__overlay" aria-hidden />
      {showBrandMark ? (
        <div className="program-card-media__brand" aria-hidden>
          <Image
            src={SEM_PROGRAM_ISOTYPE}
            alt=""
            width={48}
            height={56}
            className="program-card-media__brand-img"
          />
        </div>
      ) : null}
    </div>
  );
}
