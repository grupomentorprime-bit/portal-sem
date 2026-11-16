"use client";

import Image from "next/image";
import type { DesktopAvatarView } from "@/lib/desktop/avatar-catalog";
import { cn } from "@/lib/utils";

export function DesktopAvatar({
  view,
  className,
}: {
  view: DesktopAvatarView;
  className?: string;
}) {
  if (view.kind === "photo") {
    return (
      <span className={cn("avatar has-image", className)} aria-hidden="true">
        <Image src={view.url} alt="" width={512} height={512} unoptimized />
      </span>
    );
  }

  if (view.kind === "preset") {
    return (
      <span className={cn("avatar has-image", className)} aria-hidden="true">
        <Image src={view.src} alt="" width={512} height={512} unoptimized />
      </span>
    );
  }

  return (
    <span className={cn("avatar", className)} aria-hidden="true">
      {view.text}
    </span>
  );
}
