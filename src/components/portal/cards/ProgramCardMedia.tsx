"use client";

import Image from "next/image";
import { useState } from "react";
import { iconSizes } from "@/design";
import { BlockIcon } from "@/components/portal/BlockIcon";
import { cn } from "@/lib/utils";

interface ProgramCardMediaProps {
  src?: string;
  alt: string;
  icon?: string;
  className?: string;
}

export function ProgramCardMedia({
  src,
  alt,
  icon = "BookOpen",
  className,
}: ProgramCardMediaProps) {
  const [error, setError] = useState(false);
  const showImage = Boolean(src?.trim()) && !error;

  return (
    <div className={cn("program-card-premium__media", className)}>
      {showImage ? (
        <>
          <Image
            src={src!}
            alt={alt}
            fill
            className="object-cover transition-transform duration-[var(--transition-slow)] group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 400px"
            onError={() => setError(true)}
          />
          <div className="program-card-premium__overlay" aria-hidden />
        </>
      ) : (
        <div className="program-card-premium__placeholder" aria-hidden>
          <div className="program-card-premium__placeholder-mesh" />
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
