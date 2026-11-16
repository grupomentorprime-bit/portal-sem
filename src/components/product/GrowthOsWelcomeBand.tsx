import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function HeroMountains() {
  return (
    <svg
      className="pointer-events-none absolute inset-y-0 right-0 h-full w-[min(62%,680px)]"
      viewBox="0 0 680 220"
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden
    >
      <path
        d="M40 168c70-48 130-28 190-62 54-30 96-18 150-46 48-25 96-8 150 6 40 10 90-6 150-28v182H40V168Z"
        fill="var(--gray-200)"
      />
      <path
        d="M120 188c62-36 118-52 176-36 58 16 96-22 156-40 52-16 96 8 148-10 28-10 52-8 80-18v136H120V188Z"
        fill="color-mix(in srgb, var(--gray-200) 80%, var(--growth-os-secondary))"
      />
      <path
        d="M250 196c48-28 96-16 140-40 46-25 88-8 140-22 42-12 78 6 150-8v94H250V196Z"
        fill="var(--gray-100)"
      />
    </svg>
  );
}

/**
 * Banda de bienvenida compartida por /platform y el inicio del Espacio.
 * Misma composición: ceja, saludo, línea y un lado derecho opcional.
 */
export function GrowthOsWelcomeBand({
  eyebrow,
  title,
  subtitle,
  aside,
  asideClassName,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  aside?: ReactNode;
  asideClassName?: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-white">
      <HeroMountains />
      <div className="relative z-10 flex min-h-[132px] flex-col justify-center gap-4 px-5 py-5 sm:px-7 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--growth-os-secondary)]">
            {eyebrow}
          </p>
          <h1 className="mt-1.5 text-[1.65rem] font-bold leading-none tracking-[-0.03em] text-[var(--gray-900)] sm:text-[1.85rem]">
            {title}
          </h1>
          <p className="mt-2 text-[14px] text-[var(--gray-500)]">{subtitle}</p>
        </div>
        {aside ? (
          <div className={cn("shrink-0", asideClassName)}>{aside}</div>
        ) : null}
      </div>
    </section>
  );
}
