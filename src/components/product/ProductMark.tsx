import Link from "next/link";
import { PLATFORM_DISPLAY_NAME } from "@/core/branding/display";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface ProductMarkProps {
  href?: string;
  /** Compacto para topbar/sidebar colapsado. */
  size?: "sm" | "md";
  /**
   * Slot futuro de isotipo Growth OS.
   * Mientras no haya asset, omitir — solo wordmark tipográfico.
   */
  isotipo?: ReactNode;
  className?: string;
}

/**
 * Marca estable de Growth OS en el chrome.
 * Espacio no reemplaza este mark; su logo vive en contexto secundario.
 */
export function ProductMark({
  href,
  size = "md",
  isotipo,
  className,
}: ProductMarkProps) {
  const mark = (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-2",
        size === "sm" ? "gap-1.5" : "gap-2",
        className
      )}
    >
      {isotipo ? (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center",
            size === "sm" ? "h-6 w-6" : "h-7 w-7"
          )}
          data-product-mark-slot="isotipo"
        >
          {isotipo}
        </span>
      ) : null}
      <span
        className={cn(
          "truncate font-bold tracking-tight text-foreground",
          size === "sm" ? "text-sm" : "text-sm sm:text-[15px]"
        )}
      >
        {PLATFORM_DISPLAY_NAME}
      </span>
    </span>
  );

  if (!href) return mark;

  return (
    <Link href={href} className="min-w-0 transition hover:opacity-90">
      {mark}
    </Link>
  );
}
