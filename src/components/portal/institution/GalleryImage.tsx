"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { iconSizes } from "@/design";
import { cn } from "@/lib/utils";

interface GalleryImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function GalleryImage({
  src,
  alt,
  className,
  sizes = "(max-width: 768px) 50vw, 25vw",
  priority = false,
}: GalleryImageProps) {
  const [error, setError] = useState(false);
  const showImage = Boolean(src?.trim()) && !error;

  return (
    <div className={cn("trust-gallery__cell relative overflow-hidden bg-background-soft", className)}>
      {showImage ? (
        <>
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            className="object-cover transition-transform duration-[var(--transition-slow)] hover:scale-[1.03]"
            sizes={sizes}
            onError={() => setError(true)}
          />
          <div className="trust-gallery__caption" aria-hidden>
            <p className="text-caption font-medium text-text-inverse">{alt}</p>
          </div>
        </>
      ) : (
        <div className="flex h-full min-h-[10rem] items-center justify-center bg-primary/5">
          <ImageIcon size={iconSizes.xl} className="text-secondary/30" strokeWidth={1.5} aria-hidden />
          <span className="sr-only">{alt}</span>
        </div>
      )}
    </div>
  );
}
