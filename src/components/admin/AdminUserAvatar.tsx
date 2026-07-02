import Image from "next/image";
import { cn } from "@/lib/utils";
import { PLATFORM_ASSET_FALLBACKS } from "@/lib/cms/asset-paths";

type AdminUserAvatarSize = "sm" | "md" | "lg";

const sizeMap: Record<AdminUserAvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 64,
};

interface AdminUserAvatarProps {
  name: string;
  photoUrl?: string;
  size?: AdminUserAvatarSize;
  className?: string;
}

export function AdminUserAvatar({
  name,
  photoUrl,
  size = "md",
  className,
}: AdminUserAvatarProps) {
  const pixels = sizeMap[size];

  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt={name}
        width={pixels}
        height={pixels}
        className={cn("rounded-full object-cover ring-2 ring-border", className)}
        style={{ width: pixels, height: pixels }}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-border",
        "bg-gradient-to-br from-primary/15 via-background to-secondary/20",
        className
      )}
      style={{ width: pixels, height: pixels }}
      aria-label={name}
    >
      <Image
        src={PLATFORM_ASSET_FALLBACKS.logo}
        alt=""
        width={Math.round(pixels * 0.62)}
        height={Math.round(pixels * 0.62)}
        className="object-contain opacity-90"
        aria-hidden
      />
    </span>
  );
}
