"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  Activity,
  Handshake,
  MessageSquare,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  AlertBanner,
  EmptyState,
  aek,
} from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GROWTH_ACTIVIDAD_EMPTY_DESCRIPTION,
  GROWTH_ACTIVIDAD_EMPTY_TITLE,
  GROWTH_ACTIVIDAD_ERROR_DESCRIPTION,
  GROWTH_ACTIVIDAD_ERROR_TITLE,
  GROWTH_ACTIVIDAD_FILTER_ALL_LABEL,
  GROWTH_ACTIVIDAD_FILTER_AUTOMATIZACIONES_LABEL,
  GROWTH_ACTIVIDAD_FILTER_MENSAJES_LABEL,
  GROWTH_ACTIVIDAD_FILTER_PERSONAS_LABEL,
  GROWTH_ACTIVIDAD_FILTER_VENTAS_LABEL,
  GROWTH_ACTIVIDAD_LOAD_MORE_LABEL,
  GROWTH_ACTIVIDAD_LOADING_LABEL,
  GROWTH_ACTIVIDAD_NO_MATCH_DESCRIPTION,
  GROWTH_ACTIVIDAD_NO_MATCH_TITLE,
  GROWTH_ACTIVIDAD_PAGE_DESCRIPTION,
  GROWTH_ACTIVIDAD_PAGE_TITLE,
  GROWTH_ACTIVIDAD_RETRY_LABEL,
  GROWTH_ACTIVIDAD_VIEW_OPPORTUNITY_LABEL,
  GROWTH_ACTIVIDAD_VIEW_PERSONA_LABEL,
} from "@/lib/growth/labels";
import type {
  GrowthActividadFeedCategory,
  GrowthActividadFeedCategoryFilter,
  GrowthActividadFeedItem,
} from "@/lib/growth/actividad-view";
import { cn } from "@/lib/utils";

export interface ActividadFeedClientProps {
  items: GrowthActividadFeedItem[];
  category: GrowthActividadFeedCategoryFilter;
  nextCursor: string | null;
}

const FILTER_LINKS: Array<{
  category: GrowthActividadFeedCategoryFilter;
  label: string;
}> = [
  { category: "all", label: GROWTH_ACTIVIDAD_FILTER_ALL_LABEL },
  { category: "personas", label: GROWTH_ACTIVIDAD_FILTER_PERSONAS_LABEL },
  { category: "ventas", label: GROWTH_ACTIVIDAD_FILTER_VENTAS_LABEL },
  { category: "mensajes", label: GROWTH_ACTIVIDAD_FILTER_MENSAJES_LABEL },
  {
    category: "automatizaciones",
    label: GROWTH_ACTIVIDAD_FILTER_AUTOMATIZACIONES_LABEL,
  },
];

const CATEGORY_STYLE: Record<
  GrowthActividadFeedCategory,
  { bg: string; fg: string; Icon: typeof Activity; signal: string }
> = {
  personas: {
    bg: "bg-[color-mix(in_srgb,var(--growth-os-primary)_12%,white)]",
    fg: "text-[var(--growth-os-primary)]",
    Icon: UserRound,
    signal: "Personas",
  },
  ventas: {
    bg: "bg-[color-mix(in_srgb,var(--growth-os-accent)_12%,white)]",
    fg: "text-[var(--growth-os-accent)]",
    Icon: Handshake,
    signal: "Ventas",
  },
  mensajes: {
    bg: "bg-[color-mix(in_srgb,var(--growth-os-light)_16%,white)]",
    fg: "text-[var(--growth-os-light)]",
    Icon: MessageSquare,
    signal: "Mensajes",
  },
  automatizaciones: {
    bg: "bg-[color-mix(in_srgb,var(--growth-os-success)_14%,white)]",
    fg: "text-[var(--growth-os-success)]",
    Icon: Sparkles,
    signal: "Automatización",
  },
};

const ACTOR_SKIP = new Set([
  "Growth OS",
  "Formulario web",
  "Admisión",
  "Captación",
  "Equipo",
]);

function filterHref(category: GrowthActividadFeedCategoryFilter): string {
  return category === "all"
    ? "/admin/actividad"
    : `/admin/actividad?category=${category}`;
}

function groupByDay(
  items: GrowthActividadFeedItem[]
): Array<{ label: string; items: GrowthActividadFeedItem[] }> {
  const groups = new Map<string, GrowthActividadFeedItem[]>();
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toDateString();

  for (const item of items) {
    const date = new Date(item.occurredAt);
    const key = date.toDateString();
    let label: string;
    if (key === today) label = "Hoy";
    else if (key === yesterdayKey) label = "Ayer";
    else {
      const diffDays = Math.floor(
        (now.getTime() - date.getTime()) / 86400000
      );
      label =
        diffDays < 7
          ? `Hace ${diffDays} días`
          : date.toLocaleDateString("es", { dateStyle: "long" });
    }
    const bucket = groups.get(label) ?? [];
    bucket.push(item);
    groups.set(label, bucket);
  }

  return [...groups.entries()].map(([label, groupItems]) => ({
    label,
    items: groupItems,
  }));
}

/** Tiempo corto para escanear el historial (sin jerga técnica). */
function formatActividadWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const time = date.toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `ayer, ${time}`;
  }
  return (
    date.toLocaleDateString("es", { day: "numeric", month: "short" }) +
    `, ${time}`
  );
}

function categorySignal(item: GrowthActividadFeedItem): string {
  if (item.channel?.trim()) return item.channel.trim();
  return CATEGORY_STYLE[item.category].signal;
}

function shouldShowActor(item: GrowthActividadFeedItem): boolean {
  const actor = item.actorLabel?.trim();
  if (!actor) return false;
  if (ACTOR_SKIP.has(actor)) return false;
  if (actor === item.personaLabel.trim()) return false;
  return true;
}

function TimelineSkeleton() {
  return (
    <div
      className="space-y-8"
      role="status"
      aria-live="polite"
      aria-label={GROWTH_ACTIVIDAD_LOADING_LABEL}
    >
      {[0, 1].map((section) => (
        <div key={section} className="space-y-4">
          <Skeleton className="h-3 w-16" />
          <div className="space-y-5">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex gap-3">
                <Skeleton className="mt-0.5 h-8 w-8 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-[80%] max-w-md" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActividadFeedClient({
  items: initialItems,
  category,
  nextCursor: initialNextCursor,
}: ActividadFeedClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialItems);
    setNextCursor(initialNextCursor);
    setError(null);
  }, [initialItems, initialNextCursor, category]);

  const pushCategory = useCallback(
    (next: GrowthActividadFeedCategoryFilter) => {
      setError(null);
      startTransition(() => {
        router.push(filterHref(next));
      });
    },
    [router]
  );

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      params.set("cursor", nextCursor);
      params.set("limit", "40");
      const res = await fetch(`/api/growth/actividad?${params.toString()}`, {
        credentials: "same-origin",
      });
      const payload = (await res.json()) as {
        ok?: boolean;
        items?: GrowthActividadFeedItem[];
        nextCursor?: string | null;
        error?: string;
      };
      if (!res.ok || !payload.ok || !Array.isArray(payload.items)) {
        throw new Error(payload.error || GROWTH_ACTIVIDAD_ERROR_DESCRIPTION);
      }
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        const appended = payload.items!.filter((item) => !seen.has(item.id));
        return [...prev, ...appended];
      });
      setNextCursor(payload.nextCursor ?? null);
    } catch {
      setError(GROWTH_ACTIVIDAD_ERROR_DESCRIPTION);
    } finally {
      setLoadingMore(false);
    }
  }, [category, loadingMore, nextCursor]);

  const retry = useCallback(() => {
    setError(null);
    if (nextCursor && items.length > 0) {
      void loadMore();
      return;
    }
    startTransition(() => {
      router.refresh();
    });
  }, [items.length, loadMore, nextCursor, router]);

  const isEmpty = items.length === 0;
  const hasFilter = category !== "all";
  const groups = groupByDay(items);

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: GROWTH_ACTIVIDAD_PAGE_TITLE },
      ]}
      title={GROWTH_ACTIVIDAD_PAGE_TITLE}
      description={GROWTH_ACTIVIDAD_PAGE_DESCRIPTION}
    >
      <div
        className="mx-auto w-full max-w-2xl space-y-6"
        data-actividad-feed
      >
        <nav
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Filtros de actividad"
        >
          {FILTER_LINKS.map((link) => {
            const active = link.category === category;
            return (
              <button
                key={link.category}
                type="button"
                onClick={() => pushCategory(link.category)}
                disabled={pending && active}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-[10px] px-3.5 py-2 text-sm font-medium transition duration-150",
                  aek.focus,
                  active
                    ? "bg-[var(--growth-os-primary)] text-white shadow-sm"
                    : "bg-[var(--gray-100)] text-[var(--gray-700)] hover:bg-[color-mix(in_srgb,var(--growth-os-primary)_10%,var(--gray-100))] hover:text-[var(--growth-os-primary)]"
                )}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {error ? (
          <AlertBanner
            variant="warning"
            title={GROWTH_ACTIVIDAD_ERROR_TITLE}
            compact
          >
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm">{error}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={retry}
                className="h-8 rounded-[10px]"
              >
                {GROWTH_ACTIVIDAD_RETRY_LABEL}
              </Button>
            </div>
          </AlertBanner>
        ) : null}

        {pending ? (
          <TimelineSkeleton />
        ) : isEmpty ? (
          <EmptyState
            title={
              hasFilter
                ? GROWTH_ACTIVIDAD_NO_MATCH_TITLE
                : GROWTH_ACTIVIDAD_EMPTY_TITLE
            }
            description={
              hasFilter
                ? GROWTH_ACTIVIDAD_NO_MATCH_DESCRIPTION
                : GROWTH_ACTIVIDAD_EMPTY_DESCRIPTION
            }
            icon={<Activity className="h-8 w-8" strokeWidth={1.5} />}
            className="border-dashed bg-[var(--gray-50)] py-12 shadow-none"
          />
        ) : (
          <div className="space-y-9">
            {groups.map((group) => (
              <section key={group.label} className="space-y-4">
                <h2 className={cn(aek.label, "text-[var(--gray-500)]")}>
                  {group.label}
                </h2>
                <ol className="relative space-y-0">
                  {group.items.map((item, index) => {
                    const style = CATEGORY_STYLE[item.category];
                    const Icon = style.Icon;
                    const isLast = index === group.items.length - 1;
                    const when = formatActividadWhen(item.occurredAt);
                    const signal = categorySignal(item);
                    const showActor = shouldShowActor(item);
                    const personaHref = item.personaId
                      ? `/admin/personas/${encodeURIComponent(item.personaId)}`
                      : null;
                    const oportunidadHref = item.oportunidadId
                      ? `/admin/ventas/${encodeURIComponent(item.oportunidadId)}`
                      : null;

                    return (
                      <li
                        key={item.id}
                        className="relative flex gap-3 pb-5 last:pb-0"
                      >
                        {!isLast ? (
                          <span
                            className="absolute left-[15px] top-9 h-[calc(100%-12px)] w-px bg-[var(--admin-border-subtle)]"
                            aria-hidden
                          />
                        ) : null}
                        <span
                          className={cn(
                            "relative z-[1] mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            style.bg,
                            style.fg
                          )}
                        >
                          <Icon
                            className="h-3.5 w-3.5"
                            strokeWidth={2.2}
                            aria-hidden
                          />
                        </span>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="text-[15px] font-medium leading-snug tracking-tight text-[var(--gray-900)]">
                            {item.story}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-[var(--gray-500)]">
                            <span>{signal}</span>
                            {when ? (
                              <>
                                <span aria-hidden> · </span>
                                <time dateTime={item.occurredAt}>{when}</time>
                              </>
                            ) : null}
                          </p>
                          {showActor ? (
                            <p className="mt-0.5 text-xs text-[var(--gray-500)]">
                              por {item.actorLabel}
                            </p>
                          ) : null}
                          {personaHref || oportunidadHref ? (
                            <div className="mt-2.5 flex flex-wrap gap-2">
                              {personaHref ? (
                                <Link
                                  href={personaHref}
                                  className={cn(
                                    "inline-flex min-h-9 items-center rounded-[10px] px-3 text-sm font-semibold text-[var(--growth-os-primary)]",
                                    "bg-[color-mix(in_srgb,var(--growth-os-primary)_8%,white)] hover:bg-[color-mix(in_srgb,var(--growth-os-primary)_14%,white)]",
                                    aek.focus
                                  )}
                                >
                                  {GROWTH_ACTIVIDAD_VIEW_PERSONA_LABEL}
                                </Link>
                              ) : null}
                              {oportunidadHref ? (
                                <Link
                                  href={oportunidadHref}
                                  className={cn(
                                    "inline-flex min-h-9 items-center rounded-[10px] px-3 text-sm font-semibold text-[var(--growth-os-primary)]",
                                    "bg-[color-mix(in_srgb,var(--growth-os-primary)_8%,white)] hover:bg-[color-mix(in_srgb,var(--growth-os-primary)_14%,white)]",
                                    aek.focus
                                  )}
                                >
                                  {GROWTH_ACTIVIDAD_VIEW_OPPORTUNITY_LABEL}
                                </Link>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}

            {nextCursor ? (
              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loadingMore}
                  onClick={() => void loadMore()}
                  className="h-10 w-full rounded-[10px] sm:w-auto"
                >
                  {loadingMore
                    ? GROWTH_ACTIVIDAD_LOADING_LABEL
                    : GROWTH_ACTIVIDAD_LOAD_MORE_LABEL}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </AdminModulePage>
  );
}
