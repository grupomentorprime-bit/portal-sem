import { Suspense } from "react";
import { Box, Building2, ChevronRight, Link2, Users } from "lucide-react";
import {
  listPlatformSpaces,
  summarizePlatformMetrics,
} from "@/lib/platform/spaces";
import {
  firstNameFromDisplayName,
  timeOfDayGreeting,
} from "@/lib/platform/space-labels";
import { PlatformSpacesCatalog } from "@/components/platform/PlatformSpacesCatalog";
import { PLATFORM_DISPLAY_NAME } from "@/core/branding/display";
import { resolvePlatformBaseDomain } from "@/core/tenant/hosts";
import { loadSessionContext } from "@/lib/identity/sessions";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const METRIC_ITEMS = [
  {
    key: "activeSpaces" as const,
    label: "Espacios activos",
    icon: Building2,
    card: "border-[color-mix(in_srgb,var(--growth-os-primary)_16%,white)] bg-[color-mix(in_srgb,var(--growth-os-primary)_7%,white)]",
    iconBg:
      "bg-[color-mix(in_srgb,var(--growth-os-primary)_14%,white)] text-[var(--growth-os-primary)]",
  },
  {
    key: "activeSites" as const,
    label: "Sitios activos",
    icon: Box,
    card: "border-[color-mix(in_srgb,var(--growth-os-success)_18%,white)] bg-[color-mix(in_srgb,var(--growth-os-success)_8%,white)]",
    iconBg:
      "bg-[color-mix(in_srgb,var(--growth-os-success)_16%,white)] text-[var(--growth-os-success)]",
  },
  {
    key: "peopleWithAccess" as const,
    label: "Personas con acceso",
    icon: Users,
    card: "border-[color-mix(in_srgb,var(--growth-os-accent)_16%,white)] bg-[color-mix(in_srgb,var(--growth-os-accent)_7%,white)]",
    iconBg:
      "bg-[color-mix(in_srgb,var(--growth-os-accent)_14%,white)] text-[var(--growth-os-accent)]",
  },
  {
    key: "activeDomains" as const,
    label: "Dominios activos",
    icon: Link2,
    card: "border-[color-mix(in_srgb,var(--growth-os-light)_22%,white)] bg-[color-mix(in_srgb,var(--growth-os-light)_10%,white)]",
    iconBg:
      "bg-[color-mix(in_srgb,var(--growth-os-light)_18%,white)] text-[var(--growth-os-light)]",
  },
];

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
 * Inicio de Platform Admin — resumen y catálogo de Espacios.
 * Solo datos reales del catálogo; sin tendencias inventadas.
 */
export default async function PlatformHomePage() {
  const [spaces, session] = await Promise.all([
    listPlatformSpaces(),
    loadSessionContext(),
  ]);
  const metrics = summarizePlatformMetrics(spaces);
  const platformBaseDomain = resolvePlatformBaseDomain();
  const displayName =
    session?.user.displayName?.trim() || session?.user.email || "operador";
  const firstName = firstNameFromDisplayName(displayName) || displayName;
  const greeting = timeOfDayGreeting();

  return (
    <div className="flex flex-col gap-4">
      <section className="relative overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-white">
        <HeroMountains />
        <div className="relative z-10 flex min-h-[132px] items-center justify-between gap-6 px-5 py-5 sm:px-7">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--growth-os-secondary)]">
              {PLATFORM_DISPLAY_NAME}
            </p>
            <h1 className="mt-1.5 text-[1.65rem] font-bold leading-none tracking-[-0.03em] text-[var(--gray-900)] sm:text-[1.85rem]">
              {greeting}, {firstName}{" "}
              <span aria-hidden>👋</span>
            </h1>
            <p className="mt-2 text-[14px] text-[var(--gray-500)]">
              Organizaciones que forman un mejor futuro.
            </p>
          </div>
          <blockquote className="hidden max-w-[15rem] shrink-0 text-right lg:block">
            <p className="text-[13px] leading-snug text-[var(--gray-500)]">
              “Más organizaciones.
              <br />
              Más personas. Mayor impacto.”
            </p>
            <footer className="mt-2 text-[12px] text-[var(--gray-400)]">
              — {PLATFORM_DISPLAY_NAME}
            </footer>
          </blockquote>
        </div>
      </section>

      <section aria-label="Resumen de plataforma">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {METRIC_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.key}
                href="#espacios"
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-3.5 py-3 shadow-[0_8px_20px_-18px_rgba(14,79,144,0.45)] transition hover:shadow-[0_10px_22px_-16px_rgba(14,79,144,0.4)]",
                  item.card
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80",
                    item.iconBg
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.1} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[1.35rem] font-semibold tabular-nums leading-none tracking-[-0.04em] text-[var(--gray-900)]">
                    {metrics[item.key]}
                  </span>
                  <span className="mt-1 block truncate text-[12px] text-[var(--gray-500)]">
                    {item.label}
                  </span>
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-[var(--gray-400)]"
                  aria-hidden
                />
              </a>
            );
          })}
        </div>
      </section>

      <div>
        <Suspense fallback={null}>
          <PlatformSpacesCatalog
            spaces={spaces}
            platformBaseDomain={platformBaseDomain}
          />
        </Suspense>
      </div>
    </div>
  );
}
