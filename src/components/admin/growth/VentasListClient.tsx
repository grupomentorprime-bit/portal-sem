"use client";

import Link from "next/link";
import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Handshake } from "lucide-react";
import {
  EmptyState,
  FilterBar,
  FilterSelect,
  StatusBadge,
  aek,
} from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import {
  GROWTH_NEXT_ACTION_FILTER_OPTIONS,
  GROWTH_NO_NEXT_ACTION_LABEL,
  GROWTH_OPPORTUNITY_STATUS_FILTER_OPTIONS,
  GROWTH_OPPORTUNITY_TYPE_FILTER_OPTIONS,
  GROWTH_VENTAS_EMPTY_DESCRIPTION,
  GROWTH_VENTAS_EMPTY_TITLE,
  GROWTH_VENTAS_LAST_ACTIVITY_LABEL,
  GROWTH_VENTAS_NO_MATCH_DESCRIPTION,
  GROWTH_VENTAS_NO_MATCH_TITLE,
  GROWTH_VENTAS_PAGE_DESCRIPTION,
  GROWTH_VENTAS_PAGE_TITLE,
  GROWTH_NEXT_ACTION_SECTION_LABEL,
} from "@/lib/growth/labels";
import type { GrowthVentasQueueItemView } from "@/lib/growth/ventas-view";
import { cn } from "@/lib/utils";

export interface VentasListClientProps {
  items: GrowthVentasQueueItemView[];
  q: string;
  status: string;
  type: string;
  nextAction: string;
}

function statusTone(status: string): "active" | "inactive" | "info" {
  if (status === "won" || status === "handed_off") return "active";
  if (status === "lost" || status === "archived") return "inactive";
  return "info";
}

const rowClass = cn(
  aek.surface,
  "shadow-[var(--admin-shadow-panel)] transition duration-150",
  "hover:border-[color-mix(in_srgb,var(--color-primary)_20%,var(--admin-border-subtle))]"
);

export function VentasListClient({
  items,
  q,
  status,
  type,
  nextAction,
}: VentasListClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const pushFilters = useCallback(
    (next: {
      q?: string;
      status?: string;
      type?: string;
      nextAction?: string;
    }) => {
      const params = new URLSearchParams();
      const nextQ = next.q ?? q;
      const nextStatus = next.status ?? status;
      const nextType = next.type ?? type;
      const nextNext = next.nextAction ?? nextAction;
      if (nextQ.trim()) params.set("q", nextQ.trim());
      if (nextStatus) params.set("status", nextStatus);
      if (nextType) params.set("type", nextType);
      if (nextNext) params.set("nextAction", nextNext);
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `/admin/ventas?${qs}` : "/admin/ventas");
      });
    },
    [nextAction, q, router, status, type]
  );

  const hasFilters = Boolean(q || status || type || nextAction);
  const isEmpty = items.length === 0;
  const isTrueEmpty = isEmpty && !hasFilters;

  const filterBar = (
    <FilterBar
      className={cn(
        isTrueEmpty &&
          "rounded-[var(--radius-lg)] border border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] px-3 py-2.5 shadow-[var(--admin-shadow-card)] opacity-90"
      )}
      search={{
        placeholder: "Buscar por Persona…",
        value: q,
        onChange: (value) => pushFilters({ q: value }),
      }}
      filters={
        <>
          <FilterSelect
            aria-label="Filtrar por estado"
            className="w-[160px]"
            value={status}
            onChange={(e) => pushFilters({ status: e.target.value })}
            options={[
              { value: "", label: "Todos los estados" },
              ...GROWTH_OPPORTUNITY_STATUS_FILTER_OPTIONS,
            ]}
          />
          <FilterSelect
            aria-label="Filtrar por tipo"
            className="w-[180px]"
            value={type}
            onChange={(e) => pushFilters({ type: e.target.value })}
            options={[
              { value: "", label: "Todos los tipos" },
              ...GROWTH_OPPORTUNITY_TYPE_FILTER_OPTIONS,
            ]}
          />
          <FilterSelect
            aria-label="Filtrar por próxima acción"
            className="w-[200px]"
            value={nextAction}
            onChange={(e) => pushFilters({ nextAction: e.target.value })}
            options={[...GROWTH_NEXT_ACTION_FILTER_OPTIONS]}
          />
        </>
      }
      onReset={
        hasFilters
          ? () =>
              startTransition(() => {
                router.push("/admin/ventas");
              })
          : undefined
      }
    />
  );

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: GROWTH_VENTAS_PAGE_TITLE },
      ]}
      title={GROWTH_VENTAS_PAGE_TITLE}
      description={GROWTH_VENTAS_PAGE_DESCRIPTION}
      actions={filterBar}
    >
      {isEmpty ? (
        <EmptyState
          title={
            hasFilters
              ? GROWTH_VENTAS_NO_MATCH_TITLE
              : GROWTH_VENTAS_EMPTY_TITLE
          }
          description={
            hasFilters
              ? GROWTH_VENTAS_NO_MATCH_DESCRIPTION
              : GROWTH_VENTAS_EMPTY_DESCRIPTION
          }
          icon={<Handshake className="h-8 w-8" />}
        />
      ) : (
        <ul
          className={cn(
            "flex flex-col gap-3",
            pending && "opacity-70 transition-opacity"
          )}
        >
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/admin/ventas/${encodeURIComponent(item.id)}`}
                className={cn(
                  rowClass,
                  "flex items-start gap-4 px-4 py-4 no-underline"
                )}
              >
                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[15px] font-semibold tracking-tight text-foreground">
                      {item.personaDisplayName}
                    </p>
                    <StatusBadge
                      tone={statusTone(item.status)}
                      label={item.statusLabel}
                    />
                  </div>

                  <div>
                    <p className={cn(aek.label, "mb-1")}>
                      {GROWTH_NEXT_ACTION_SECTION_LABEL}
                    </p>
                    <p
                      className={cn(
                        "text-[17px] font-semibold tracking-tight",
                        item.hasNextAction
                          ? "text-foreground"
                          : "text-muted"
                      )}
                    >
                      {item.hasNextAction
                        ? item.nextActionLabel
                        : GROWTH_NO_NEXT_ACTION_LABEL}
                    </p>
                  </div>

                  <p className="text-sm text-muted">
                    {item.originLabel}
                    <span className="mx-1.5 text-[var(--admin-border-subtle)]">
                      ·
                    </span>
                    {item.typeLabel}
                    <span className="mx-1.5 text-[var(--admin-border-subtle)]">
                      ·
                    </span>
                    {GROWTH_VENTAS_LAST_ACTIVITY_LABEL}:{" "}
                    {item.lastActivityLabel}
                  </p>
                </div>
                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminModulePage>
  );
}
