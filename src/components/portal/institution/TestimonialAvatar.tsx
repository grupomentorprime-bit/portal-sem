"use client";

import Image from "next/image";
import { useState } from "react";
import { User } from "lucide-react";
import { iconSizes } from "@/design";
import { cn } from "@/lib/utils";

interface TestimonialAvatarProps {
  src?: string;
  name: string;
  className?: string;
}

export function TestimonialAvatar({ src, name, className }: TestimonialAvatarProps) {
  const [error, setError] = useState(false);
  const showImage = Boolean(src?.trim()) && !error;
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className={cn(
        "relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-background-soft ring-2 ring-border",
        className
      )}
    >
      {showImage ? (
        <Image
          src={src!}
          alt=""
          fill
          className="object-cover"
          sizes="56px"
          onError={() => setError(true)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-secondary">
          {initials ? (
            <span className="text-sm font-semibold" aria-hidden>
              {initials}
            </span>
          ) : (
            <User size={iconSizes.lg} strokeWidth={2} aria-hidden />
          )}
        </span>
      )}
    </div>
  );
}
