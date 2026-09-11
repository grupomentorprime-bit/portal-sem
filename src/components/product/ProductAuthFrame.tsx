import { ProductMark } from "@/components/product/ProductMark";
import { PlatformNeutralTheme } from "@/components/product/PlatformNeutralTheme";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface ProductAuthFrameProps {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * Superficie centrada homologada: login, sin Espacio, acceso denegado.
 * Misma familia visual que /platform (Growth OS neutro).
 */
export function ProductAuthFrame({
  title,
  description,
  children,
  actions,
  className,
}: ProductAuthFrameProps) {
  return (
    <PlatformNeutralTheme className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div
        className={cn(
          "w-full max-w-md space-y-6 rounded-xl border border-border bg-surface p-8 text-center shadow-[var(--shadow-sm)]",
          className
        )}
      >
        <div className="space-y-3">
          <div className="flex justify-center">
            <ProductMark />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <div className="text-sm leading-relaxed text-muted">{description}</div>
          ) : null}
        </div>
        {children}
        {actions ? (
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {actions}
          </div>
        ) : null}
      </div>
    </PlatformNeutralTheme>
  );
}
