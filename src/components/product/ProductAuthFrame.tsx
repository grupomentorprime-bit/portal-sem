import Image from "next/image";
import { ProductMark } from "@/components/product/ProductMark";
import { PlatformNeutralTheme } from "@/components/product/PlatformNeutralTheme";
import { PLATFORM_DISPLAY_NAME } from "@/core/branding/display";
import { PLATFORM_OPERATOR_NAME } from "@/core/legal/platform";
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
 * Misma familia visual que la portada de Growth OS.
 */
export function ProductAuthFrame({
  title,
  description,
  children,
  actions,
  className,
}: ProductAuthFrameProps) {
  return (
    <PlatformNeutralTheme className="relative isolate flex min-h-screen flex-col overflow-hidden text-foreground">
      <div className="absolute inset-0" aria-hidden>
        <Image
          src="/images/platform/hero-landing.jpg"
          alt=""
          fill
          priority
          unoptimized
          className="object-cover object-[62%_40%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,var(--gray-900)_0%,var(--gray-900)_34%,color-mix(in_srgb,var(--growth-os-primary)_86%,var(--gray-900))_52%,color-mix(in_srgb,var(--growth-os-primary)_48%,transparent)_68%,color-mix(in_srgb,var(--gray-900)_22%,transparent)_82%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_18%,color-mix(in_srgb,var(--growth-os-secondary)_30%,transparent),transparent_52%)]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-10 px-5 py-10 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-10 lg:py-14">
        <aside className="hidden max-w-md animate-[fade-in_0.6s_ease-out_both] lg:block">
          <p className="text-[clamp(2.6rem,4.5vw,3.75rem)] font-bold leading-[0.95] tracking-[-0.05em] text-white">
            {PLATFORM_DISPLAY_NAME}
          </p>
          <p className="mt-5 text-lg font-medium leading-snug text-white/90">
            Entra a tu Espacio y opera con la identidad de tu organización.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/65">
            Plataforma operada por {PLATFORM_OPERATOR_NAME}. El sitio público de
            cada organización vive en su propia dirección.
          </p>
        </aside>

        <div
          className={cn(
            "w-full max-w-md animate-[slide-up_0.65s_ease-out_0.08s_both] space-y-6 rounded-2xl border border-white/20 bg-[color-mix(in_srgb,var(--color-surface-default)_94%,transparent)] p-7 shadow-[0_24px_60px_-28px_rgba(3,26,51,0.55)] backdrop-blur-md sm:p-8",
            className
          )}
        >
          <div className="space-y-3 text-left">
            <div className="flex items-center justify-between gap-3">
              <ProductMark href="/" size="md" />
              <span className="hidden text-[11px] font-medium uppercase tracking-[0.12em] text-muted sm:inline">
                Acceso
              </span>
            </div>
            <div className="h-px w-full bg-[color-mix(in_srgb,var(--growth-os-secondary)_22%,transparent)]" />
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--growth-os-primary)] sm:text-[1.65rem]">
              {title}
            </h1>
            {description ? (
              <div className="text-sm leading-relaxed text-muted">{description}</div>
            ) : null}
          </div>

          {children}

          {actions ? (
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-start">
              {actions}
            </div>
          ) : null}

          <p className="text-center text-[11px] text-muted sm:text-left">
            © {new Date().getFullYear()} {PLATFORM_DISPLAY_NAME}
            <span className="mx-1.5 text-border">·</span>
            {PLATFORM_OPERATOR_NAME}
          </p>
        </div>
      </div>
    </PlatformNeutralTheme>
  );
}
