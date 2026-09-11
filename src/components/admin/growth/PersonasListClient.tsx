"use client";

import Link from "next/link";
import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, UserRound } from "lucide-react";
import {
  EmptyState,
  FilterBar,
  FilterSelect,
  StatusBadge,
  aek,
} from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import {
  GROWTH_NO_NEXT_ACTION_LABEL,
  GROWTH_OPPORTUNITY_STATUS_FILTER_OPTIONS,
  GROWTH_OPPORTUNITY_TYPE_FILTER_OPTIONS,
  GROWTH_NEXT_ACTION_SECTION_LABEL,
  GROWTH_PERSONAS_EMPTY_DESCRIPTION,
  GROWTH_PERSONAS_EMPTY_TITLE,
  GROWTH_PERSONAS_NO_MATCH_DESCRIPTION,
  GROWTH_PERSONAS_NO_MATCH_TITLE,
  GROWTH_SITUATION_SECTION_LABEL,
  GROWTH_VIEW_DETAIL_LABEL,
} from "@/lib/growth/labels";
import type { GrowthPersonaListItemView } from "@/lib/growth/persona-view";
import { cn } from "@/lib/utils";

export interface PersonasListClientProps {
  items: GrowthPersonaListItemView[];
  q: string;
  opportunityType: string;
  opportunityStatus: string;
}

function nextActionTone(label: string): "pending" | "neutral" {
  return label === GROWTH_NO_NEXT_ACTION_LABEL ? "neutral" : "pending";
}

function personaInitial(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

const personaCardClass = cn(
  aek.surface,
  "shadow-[var(--admin-shadow-panel)] transition duration-150",
  "hover:border-[color-mix(in_srgb,var(--color-primary)_20%,var(--admin-border-subtle))]"
);

export function PersonasListClient({
  items,
  q,
  opportunityType,
  opportunityStatus,
}: PersonasListClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const pushFilters = useCallback(
    (next: { q?: string; type?: string; status?: string }) => {
      const params = new URLSearchParams();
      const nextQ = next.q ?? q;
      const nextType = next.type ?? opportunityType;
      const nextStatus = next.status ?? opportunityStatus;
      if (nextQ.trim()) params.set("q", nextQ.trim());
      if (nextType) params.set("type", nextType);
      if (nextStatus) params.set("status", nextStatus);
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `/admin/personas?${qs}` : "/admin/personas");
      });
    },
    [opportunityStatus, opportunityType, q, router]
  );

  const hasFilters = Boolean(q || opportunityType || opportunityStatus);
  const isEmpty = items.length === 0;
  const isTrueEmpty = isEmpty && !hasFilters;
  const emptyTitle = hasFilters
    ? GROWTH_PERSONAS_NO_MATCH_TITLE
    : GROWTH_PERSONAS_EMPTY_TITLE;
  const emptyDescription = hasFilters
    ? GROWTH_PERSONAS_NO_MATCH_DESCRIPTION
    : GROWTH_PERSONAS_EMPTY_DESCRIPTION;

  const filterBar = (
    <FilterBar
      className={cn(
        isTrueEmpty &&
          "rounded-[var(--radius-lg)] border border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] px-3 py-2.5 shadow-[var(--admin-shadow-card)] opacity-90"
      )}
      search={{
        placeholder: "Buscar por nombre, correo o teléfono…",
        value: q,
        onChange: (value) => pushFilters({ q: value }),
      }}
      filters={
        <>
          <FilterSelect
            aria-label="Filtrar por tipo de oportunidad"
            className="w-[200px]"
            value={opportunityType}
            onChange={(e) => pushFilters({ type: e.target.value })}
            options={[
              { value: "", label: "Todas las oportunidades" },
              ...GROWTH_OPPORTUNITY_TYPE_FILTER_OPTIONS,
            ]}
          />
          <FilterSelect
            aria-label="Filtrar por estado"
            className="w-[160px]"
            value={opportunityStatus}
            onChange={(e) => pushFilters({ status: e.target.value })}
            options={[
              { value: "", label: "Todos los estados" },
              ...GROWTH_OPPORTUNITY_STATUS_FILTER_OPTIONS,
            ]}
          />
        </>
      }
      onReset={
        hasFilters
          ? () => {
              startTransition(() => router.push("/admin/personas"));
            }
          : undefined
      }
    />
  );

  const emptyBlock = (
    <EmptyState
      title={emptyTitle}
      description={emptyDescription}
      icon={<UserRound className="h-9 w-9" strokeWidth={1.5} />}
      className={cn(
        "border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] shadow-[var(--admin-shadow-panel)]",
        isTrueEmpty ? "px-8 py-16 sm:py-20" : "px-6 py-12"
      )}
    />
  );

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Personas" },
      ]}
      title="Personas"
      description="Quién es, de dónde llegó y qué hacer ahora."
    >
      <div className={cn(aek.sectionGap, pending && "opacity-70")}>
        {isTrueEmpty ? (
          <>
            {emptyBlock}
            {filterBar}
          </>
        ) : (
          <>
            {filterBar}
            {isEmpty ? (
              emptyBlock
            ) : (
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/admin/personas/${encodeURIComponent(item.id)}`}
                      className={cn(
                        personaCardClass,
                        "grid gap-3 px-3.5 py-3 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1.05fr)_minmax(12rem,0.9fr)] sm:items-center sm:gap-5 sm:px-4 sm:py-3"
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[color-mix(in_srgb,var(--color-primary)_10%,white)] text-xs font-bold tracking-tight text-[var(--color-primary)]"
                          aria-hidden
                        >
                          {personaInitial(item.displayName)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-semibold tracking-tight text-foreground sm:text-base">
                            {item.displayName}
                          </p>
                          <p className="mt-0.5 truncate text-sm text-muted">
                            {[item.email, item.phone].filter(Boolean).join(" · ") ||
                              "Sin correo ni teléfono"}
                          </p>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p className={aek.label}>{GROWTH_SITUATION_SECTION_LABEL}</p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {item.originLabel}
                        </p>
                        {item.opportunitySummary ? (
                          <p className="mt-0.5 text-sm text-muted">
                            {item.opportunitySummary}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex min-w-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:text-right">
                        <div className="min-w-0">
                          <p className={aek.label}>{GROWTH_NEXT_ACTION_SECTION_LABEL}</p>
                          <StatusBadge
                            tone={nextActionTone(item.nextActionLabel)}
                            label={item.nextActionLabel}
                            className="mt-1 max-w-[240px] truncate"
                          />
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary">
                          {GROWTH_VIEW_DETAIL_LABEL}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </AdminModulePage>
  );
}
