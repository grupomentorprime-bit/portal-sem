import Image from "next/image";
import { cn } from "@/lib/utils";

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

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
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
        "bg-gradient-to-br from-primary/15 via-background to-secondary/20 text-xs font-semibold text-primary",
        className
      )}
      style={{ width: pixels, height: pixels }}
      aria-label={name}
    >
      {initialsFromName(name)}
    </span>
  );
}
