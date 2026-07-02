"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { iconSizes } from "@/design";
import { cn } from "@/lib/utils";

interface CardMediaProps {
  src?: string;
  alt: string;
  aspect?: "video" | "square" | "portrait";
  className?: string;
  sizes?: string;
  priority?: boolean;
}

const aspectClass = {
  video: "aspect-[16/10]",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
};

export function CardMedia({
  src,
  alt,
  aspect = "video",
  className,
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority = false,
}: CardMediaProps) {
  const [error, setError] = useState(false);
  const showImage = Boolean(src?.trim()) && !error;

  return (
    <div
      className={cn(
        "eco-card-media relative overflow-hidden bg-background-soft",
        aspectClass[aspect],
        className
      )}
    >
      {showImage ? (
        <>
          <Image
            src={src!}
            alt={alt}
            fill
            priority={priority}
            className="object-cover transition-transform duration-[var(--transition-slow)] group-hover:scale-[1.04]"
            sizes={sizes}
            onError={() => setError(true)}
          />
          <div className="eco-card-media__overlay" aria-hidden />
        </>
      ) : (
        <div className="flex h-full items-center justify-center bg-primary/5" aria-hidden>
          <ImageIcon size={iconSizes.xl} className="text-secondary/30" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}
