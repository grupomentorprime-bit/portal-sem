import { cn } from "@/lib/utils";
import Image from "next/image";

type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  src?: string;
  alt?: string;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const sizePixels: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({
  name,
  size = "md",
  className,
  src,
  alt,
}: AvatarProps) {
  const pixels = sizePixels[size];

  if (src) {
    return (
      <Image
        src={src}
        alt={alt ?? name}
        width={pixels}
        height={pixels}
        className={cn(
          "rounded-full object-cover ring-2 ring-border",
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={name}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-secondary font-medium text-text-inverse ring-2 ring-border",
        sizeClasses[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
