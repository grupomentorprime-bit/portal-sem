import { Suspense } from "react";
import Image from "next/image";
import {
  Building2,
  Globe2,
  Link2,
  Users,
} from "lucide-react";
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
import { loadSessionContext } from "@/lib/identity/sessions";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const METRIC_ITEMS = [
  {
    key: "activeSpaces" as const,
    label: "Espacios activos",
    icon: Building2,
    accentBg:
      "bg-[color-mix(in_srgb,var(--growth-os-primary)_14%,white)]",
    accentFg: "text-[var(--growth-os-primary)]",
  },
  {
    key: "activeSites" as const,
    label: "Sitios activos",
    icon: Globe2,
    accentBg:
      "bg-[color-mix(in_srgb,var(--growth-os-success)_16%,white)]",
    accentFg: "text-[var(--growth-os-success)]",
  },
  {
    key: "peopleWithAccess" as const,
    label: "Personas con acceso",
    icon: Users,
    accentBg:
      "bg-[color-mix(in_srgb,var(--growth-os-accent)_14%,white)]",
    accentFg: "text-[var(--growth-os-accent)]",
  },
  {
    key: "activeDomains" as const,
    label: "Dominios activos",
    icon: Link2,
    accentBg:
      "bg-[color-mix(in_srgb,var(--growth-os-light)_18%,white)]",
    accentFg: "text-[var(--growth-os-light)]",
  },
];

/**
 * Inicio de Platform Admin — resumen y catálogo de Espacios.
 * Solo datos reales del catálogo; sin tendencias inventadas.
 *
 * UX-SHELL-003B: hero abierto + planos translúcidos + recurso visual de maqueta.
 */
export default async function PlatformHomePage() {
  const [spaces, session] = await Promise.all([
    listPlatformSpaces(),
    loadSessionContext(),
  ]);
  const metrics = summarizePlatformMetrics(spaces);
  const displayName =
    session?.user.displayName?.trim() || session?.user.email || "operador";
  const firstName = firstNameFromDisplayName(displayName) || displayName;
  const greeting = timeOfDayGreeting();

  return (
    <div>
      <div className="flex flex-col gap-1">
        {/*
          Hero abierto al fondo (sin card blanca).
          Cuña celeste desde ~47% + foto solo en extremo derecho.
        */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-y-0 left-[46%] right-0 hidden lg:block"
            aria-hidden
          >
            <div className="absolute inset-0 overflow-hidden rounded-br-[18px] rounded-tr-[18px]">
              {/*
                Solo la fotografía (persona/montaña/cielo + nota manuscrita del asset).
                object-position recorta los planos/slogan incrustados a la izquierda.
              */}
              <div
                className="absolute inset-y-[-14%] right-0 w-[64%]"
                style={{
                  WebkitMaskImage:
                    "linear-gradient(115deg, transparent 0%, transparent 26%, rgba(0,0,0,0.35) 40%, #000 58%, #000 100%)",
                  maskImage:
                    "linear-gradient(115deg, transparent 0%, transparent 26%, rgba(0,0,0,0.35) 40%, #000 58%, #000 100%)",
                }}
              >
                <Image
                  src="/images/platform/hero-summit.jpg"
                  alt=""
                  fill
                  priority
                  className="object-cover object-[76%_38%]"
                  sizes="500px"
                />
              </div>

              <svg
                className="absolute inset-0 z-[1] h-full w-full"
                viewBox="0 0 600 210"
                preserveAspectRatio="none"
                aria-hidden
              >
                <defs>
                  <linearGradient id="shell003b-fade" x1="0" y1="0" x2="1" y2="0.12">
                    <stop offset="0" stopColor="#fff" stopOpacity="1" />
                    <stop offset="0.03" stopColor="#fff" stopOpacity="0.85" />
                    <stop offset="0.1" stopColor="#fff" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="shell003b-wedge" x1="0.05" y1="0" x2="1" y2="0.08">
                    <stop offset="0" stopColor="rgb(186 216 240)" stopOpacity="0.95" />
                    <stop offset="0.45" stopColor="rgb(176 212 240)" stopOpacity="0.75" />
                    <stop offset="0.7" stopColor="rgb(168 208 238)" stopOpacity="0.28" />
                    <stop offset="1" stopColor="rgb(168 208 238)" stopOpacity="0" />
                  </linearGradient>
                  <clipPath id="shell003b-diag">
                    <polygon points="42,0 600,0 600,210 2,210" />
                  </clipPath>
                  <filter
                    id="shell003b-soft"
                    x="-10%"
                    y="-10%"
                    width="120%"
                    height="120%"
                  >
                    <feGaussianBlur stdDeviation="2.8" />
                  </filter>
                </defs>
                {/* Diagonal principal clara + 1 plano secundario suave (sin rayas) */}
                <g clipPath="url(#shell003b-diag)">
                  <polygon
                    points="42,0 600,0 600,210 2,210"
                    fill="url(#shell003b-wedge)"
                  />
                  <g filter="url(#shell003b-soft)">
                    <polygon
                      points="55,-10 265,4 185,235 18,235"
                      fill="rgb(214 234 249)"
                      opacity="0.42"
                    />
                  </g>
                </g>
                <rect width="600" height="210" fill="url(#shell003b-fade)" />
              </svg>

              {/* Texto en zona de transición (~centro), no sobre la fotografía */}
              <div className="absolute left-[14%] top-0 z-10 max-w-[13rem] pt-0.5">
                <p className="text-[15px] font-semibold leading-snug tracking-tight text-[var(--growth-os-primary)]">
                  Organizaciones que forman un mejor futuro.
                </p>
                <div className="mt-2 h-px w-9 bg-[color-mix(in_srgb,var(--growth-os-primary)_35%,transparent)]" />
                <p className="mt-1.5 text-[13px] font-semibold tracking-tight text-[var(--growth-os-primary)]">
                  {PLATFORM_DISPLAY_NAME}
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex min-h-[176px] flex-col justify-center py-5 pr-3 sm:min-h-[188px] sm:py-6 lg:max-w-[45%] lg:py-7 lg:pr-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--growth-os-secondary)]">
              Plataforma
            </p>
            <h1 className="mt-2 text-[1.95rem] font-bold leading-[1.08] tracking-[-0.045em] text-[var(--gray-900)] sm:text-[2.2rem]">
              {greeting}, {firstName}{" "}
              <span aria-hidden>👋</span>
            </h1>
            <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed text-[var(--gray-700)] sm:text-[15px]">
              Administra las organizaciones que usan {PLATFORM_DISPLAY_NAME} y
              sigue de cerca su crecimiento. Más educación. Más personas. Mayor
              impacto.
            </p>
          </div>

          <div
            className="relative mb-1 overflow-hidden rounded-[14px] lg:hidden"
            aria-hidden
          >
            <div className="relative flex min-h-[112px] items-end overflow-hidden bg-[linear-gradient(135deg,color-mix(in_srgb,var(--growth-os-secondary)_14%,white),color-mix(in_srgb,var(--growth-os-primary)_16%,white))] px-4 pb-4 pt-8">
              <div className="absolute inset-y-0 right-0 w-[44%]">
                <Image
                  src="/images/platform/hero-summit.jpg"
                  alt=""
                  fill
                  className="object-contain object-right"
                  sizes="180px"
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,color-mix(in_srgb,var(--growth-os-secondary)_50%,white)_0%,transparent_50%)]" />
              </div>
              <div className="relative z-10 max-w-[58%]">
                <p className="text-[14px] font-semibold leading-snug text-[var(--growth-os-primary)]">
                  Organizaciones que forman un mejor futuro.
                </p>
                <p className="mt-1 text-[12px] font-semibold text-[var(--growth-os-primary)]">
                  {PLATFORM_DISPLAY_NAME}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Resumen de plataforma">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {METRIC_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className="flex h-[100px] items-center justify-center rounded-[14px] border border-[var(--color-border-default)] bg-white px-6 shadow-[var(--shadow-sm)]"
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={cn(
                        "flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px]",
                        item.accentBg,
                        item.accentFg
                      )}
                    >
                      <Icon
                        className="h-6 w-6"
                        strokeWidth={2.05}
                        aria-hidden
                      />
                    </span>
                    <div>
                      <p className="text-[2rem] font-bold tabular-nums leading-none tracking-[-0.05em] text-[var(--gray-900)]">
                        {metrics[item.key]}
                      </p>
                      <p className="mt-1.5 text-[13px] font-medium leading-snug text-[var(--gray-500)]">
                        {item.label}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mt-5">
        <Suspense fallback={null}>
          <PlatformSpacesCatalog spaces={spaces} />
        </Suspense>
      </div>
    </div>
  );
}
