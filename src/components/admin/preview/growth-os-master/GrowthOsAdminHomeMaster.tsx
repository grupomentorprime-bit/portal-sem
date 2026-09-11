import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  Handshake,
  MapPin,
  MessageSquare,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { EmptyState, aek } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import {
  GROWTH_NEXT_ACTION_SECTION_LABEL,
  GROWTH_ORIGIN_SECTION_LABEL,
  GROWTH_PERSONAS_EMPTY_DESCRIPTION,
  GROWTH_TIMELINE_SECTION_LABEL,
} from "@/lib/growth/labels";
import { formatRelativeTime } from "@/lib/admin/audit-labels";
import { cn } from "@/lib/utils";
import type { HomeActivityTone } from "./humanize-home-activity";
import type { GrowthOsHomeView } from "./project-home";

const cardClass = cn(
  aek.surface,
  "bg-white shadow-[var(--admin-shadow-card)]"
);

const ATTEND_CTA_LABEL = "Atender";
const ACTIVITY_LINK = "/admin/settings/activity";

const METRIC_ITEMS = [
  {
    key: "personas" as const,
    label: "Personas",
    icon: Users,
    accentBg: "bg-[color-mix(in_srgb,var(--growth-os-primary)_14%,white)]",
    accentFg: "text-[var(--growth-os-primary)]",
    mobileOrder: "order-2 xl:order-1",
  },
  {
    key: "oportunidades" as const,
    label: "Oportunidades",
    icon: Handshake,
    accentBg: "bg-[color-mix(in_srgb,var(--growth-os-accent)_14%,white)]",
    accentFg: "text-[var(--growth-os-accent)]",
    mobileOrder: "order-3 xl:order-2",
  },
  {
    key: "porAtender" as const,
    label: "Por atender",
    icon: UserRound,
    accentBg: "bg-[color-mix(in_srgb,var(--growth-os-light)_18%,white)]",
    accentFg: "text-[var(--growth-os-light)]",
    mobileOrder: "order-1 xl:order-3",
  },
  {
    key: "actividad" as const,
    label: "Actividad",
    icon: Activity,
    accentBg: "bg-[color-mix(in_srgb,var(--growth-os-success)_16%,white)]",
    accentFg: "text-[var(--growth-os-success)]",
    mobileOrder: "order-4 xl:order-4",
  },
];

function attentionSubtitle(pendingCount: number): string {
  if (pendingCount <= 0) return "Todo está al día.";
  if (pendingCount === 1) return "Tienes 1 cosa que necesita tu atención.";
  return `Tienes ${pendingCount} cosas que necesitan tu atención.`;
}

const TONE_STYLE: Record<
  HomeActivityTone,
  { bg: string; fg: string; Icon: typeof Activity }
> = {
  form: {
    bg: "bg-[color-mix(in_srgb,var(--growth-os-primary)_12%,white)]",
    fg: "text-[var(--growth-os-primary)]",
    Icon: MessageSquare,
  },
  opportunity: {
    bg: "bg-[color-mix(in_srgb,var(--growth-os-accent)_12%,white)]",
    fg: "text-[var(--growth-os-accent)]",
    Icon: Handshake,
  },
  followup: {
    bg: "bg-[color-mix(in_srgb,var(--growth-os-success)_14%,white)]",
    fg: "text-[var(--growth-os-success)]",
    Icon: Sparkles,
  },
  transfer: {
    bg: "bg-[color-mix(in_srgb,var(--growth-os-light)_16%,white)]",
    fg: "text-[var(--growth-os-light)]",
    Icon: ArrowRight,
  },
  note: {
    bg: "bg-[var(--gray-100)]",
    fg: "text-[var(--gray-600)]",
    Icon: MessageSquare,
  },
  other: {
    bg: "bg-[var(--gray-100)]",
    fg: "text-[var(--gray-600)]",
    Icon: Activity,
  },
};

function personaInitial(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function formatHomeDate(date = new Date()): string {
  const raw = date.toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex max-w-full truncate rounded-full bg-[color-mix(in_srgb,var(--growth-os-primary)_8%,white)] px-2.5 py-0.5 text-[11px] font-semibold tracking-tight text-[var(--growth-os-primary)]">
      {children}
    </span>
  );
}

export function GrowthOsAdminHomeMaster({
  greeting,
  firstName,
  spaceName,
  home,
}: {
  greeting: string;
  firstName: string;
  spaceName: string;
  home: GrowthOsHomeView;
}) {
  const pendingCount = home.metrics.porAtender;
  const maxOrigin = Math.max(...home.origins.map((item) => item.count), 1);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[1.75rem] font-bold leading-[1.15] tracking-[-0.04em] text-[var(--gray-900)] sm:text-[2rem]">
            {greeting}, {firstName}{" "}
            <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--gray-600)]">
            {attentionSubtitle(pendingCount)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <p className="text-sm text-[var(--gray-500)]">{formatHomeDate()}</p>
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--growth-os-success)_12%,white)] px-2.5 py-1 text-[11px] font-semibold text-[var(--growth-os-success)]"
            title={spaceName}
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-[var(--growth-os-success)]"
              aria-hidden
            />
            Espacio activo
          </span>
        </div>
      </header>

      <section aria-label="Resumen del Espacio">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {METRIC_ITEMS.map((item) => {
            const Icon = item.icon;
            const value = home.metrics[item.key];
            const showActionHint =
              item.key === "porAtender" && value > 0;
            return (
              <div
                key={item.key}
                className={cn(
                  cardClass,
                  item.mobileOrder,
                  "flex min-h-[92px] items-center px-4 py-3.5"
                )}
              >
                <div className="flex w-full items-center gap-3.5">
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]",
                      item.accentBg,
                      item.accentFg
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.05} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[1.7rem] font-bold tabular-nums leading-none tracking-[-0.05em] text-[var(--gray-900)]">
                      {value}
                    </p>
                    <p className="mt-1.5 text-[13px] font-medium leading-snug text-[var(--gray-500)]">
                      {item.label}
                    </p>
                    {showActionHint ? (
                      <p className="mt-1 text-[11px] font-semibold text-[var(--color-danger,#dc2626)]">
                        Requieren tu acción
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
        <section className={cn(cardClass, "order-1 p-5 lg:col-span-8 lg:row-span-3")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-base font-bold tracking-tight text-[var(--gray-900)]">
                {GROWTH_NEXT_ACTION_SECTION_LABEL}
              </h2>
              {pendingCount > 0 ? (
                <span className="inline-flex rounded-full bg-[color-mix(in_srgb,var(--color-danger,#dc2626)_12%,white)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-danger,#dc2626)]">
                  {pendingCount} pendiente{pendingCount === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
            <Link
              href="/admin/personas"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--growth-os-primary)] hover:underline"
            >
              Ver todas
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>

          {home.attention.length === 0 ? (
            <EmptyState
              title="Nada pide tu atención ahora"
              description={
                home.metrics.personas === 0
                  ? GROWTH_PERSONAS_EMPTY_DESCRIPTION
                  : "Cuando alguien necesite un próximo paso, aparecerá aquí."
              }
              icon={<UserRound className="h-8 w-8" strokeWidth={1.5} />}
              className="mt-4 border-dashed bg-[var(--gray-50)] py-10 shadow-none"
            />
          ) : (
            <ul className="mt-4 divide-y divide-[var(--color-border-default)]">
              {home.attention.map((item) => {
                const destination = `/admin/personas/${encodeURIComponent(item.id)}`;
                return (
                  <li key={item.id} className="py-4 first:pt-2 last:pb-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 flex-1 gap-3">
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--growth-os-primary)_12%,white)] text-xs font-bold tracking-tight text-[var(--growth-os-primary)]"
                          aria-hidden
                        >
                          {personaInitial(item.displayName)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <p className="truncate text-[15px] font-semibold tracking-tight text-[var(--gray-900)]">
                              {item.displayName}
                            </p>
                            <time className="text-[11px] text-[var(--gray-500)]">
                              {formatRelativeTime(item.updatedAt)}
                            </time>
                          </div>
                          {item.situationLabel ? (
                            <p className="mt-1 text-sm leading-snug text-[var(--gray-600)]">
                              {item.situationLabel}
                            </p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.typeLabel &&
                            !item.situationLabel
                              ?.toLowerCase()
                              .startsWith(item.typeLabel.toLowerCase()) ? (
                              <Chip>{item.typeLabel}</Chip>
                            ) : null}
                            {item.originLabel ? (
                              <Chip>{item.originLabel}</Chip>
                            ) : null}
                          </div>
                          <p className="mt-2.5 text-sm leading-snug text-[var(--gray-800)]">
                            <span className="font-medium text-[var(--gray-500)]">
                              Próximo paso:{" "}
                            </span>
                            <span className="font-semibold">
                              {item.nextActionLabel}
                            </span>
                          </p>
                        </div>
                      </div>
                      <Button
                        href={destination}
                        size="sm"
                        className="h-9 shrink-0 rounded-[10px] bg-[var(--growth-os-primary)] px-4 text-[13px] font-semibold text-white hover:bg-[var(--growth-os-primary)] hover:opacity-95"
                      >
                        {ATTEND_CTA_LABEL}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className={cn(cardClass, "order-2 p-5 lg:col-span-4")}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold tracking-tight text-[var(--gray-900)]">
              {GROWTH_TIMELINE_SECTION_LABEL}
            </h2>
            <Link
              href={ACTIVITY_LINK}
              className="text-xs font-semibold text-[var(--growth-os-primary)] hover:underline"
            >
              Ver toda la actividad
            </Link>
          </div>
          {home.activity.length === 0 ? (
            <EmptyState
              title="Aún no hay actividad"
              description="Los hechos de cada Persona aparecerán aquí cuando ocurran."
              icon={<Activity className="h-8 w-8" strokeWidth={1.5} />}
              className="mt-4 border-dashed bg-[var(--gray-50)] py-8 shadow-none"
            />
          ) : (
            <ul className="mt-4 space-y-3.5">
              {home.activity.map((item) => {
                const tone = TONE_STYLE[item.tone] ?? TONE_STYLE.other;
                const Icon = tone.Icon;
                return (
                  <li key={item.id} className="flex gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        tone.bg,
                        tone.fg
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug text-[var(--gray-800)]">
                        {item.story}
                      </p>
                      <time className="mt-0.5 block text-[11px] text-[var(--gray-500)]">
                        {formatRelativeTime(item.occurredAt)}
                      </time>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className={cn(cardClass, "order-3 p-5 lg:col-span-4")}>
          <h2 className="text-base font-bold tracking-tight text-[var(--gray-900)]">
            {GROWTH_ORIGIN_SECTION_LABEL.replace("llegó", "llegan")}
          </h2>
          {home.origins.length === 0 ? (
            <EmptyState
              title="Todavía no hay llegadas"
              description="Cuando alguien llegue desde un formulario u otro canal, el origen se verá aquí."
              icon={<MapPin className="h-8 w-8" strokeWidth={1.5} />}
              className="mt-4 border-dashed bg-[var(--gray-50)] py-8 shadow-none"
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {home.origins.map((item) => {
                const width = Math.max(8, Math.round((item.count / maxOrigin) * 100));
                return (
                  <li key={item.label}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-sm font-medium text-[var(--gray-800)]">
                        {item.label}
                      </span>
                      <span className="shrink-0 tabular-nums text-sm font-semibold text-[var(--gray-900)]">
                        {item.count}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--gray-100)]">
                      <div
                        className="h-full rounded-full bg-[var(--growth-os-primary)]/80"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
