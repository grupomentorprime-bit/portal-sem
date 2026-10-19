"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Clock,
  Handshake,
  LayoutGrid,
  List,
  MoreHorizontal,
} from "lucide-react";
import { EmptyState, StatusBadge, aek } from "@/components/admin/kit";
import { SearchBar } from "@/components/admin/kit/search/SearchBar";
import { useConfirmDialog } from "@/components/admin/kit/hooks/useConfirmDialog";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { isGrowthFunnelResultKey } from "@/core/growth/funnel-types";
import {
  GROWTH_BAND_FILTER_OPTIONS,
  GROWTH_NEXT_ACTION_FILTER_OPTIONS,
  growthPriorityBandLabel,
  GROWTH_NO_NEXT_ACTION_LABEL,
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
import type { GrowthPriorityBand } from "@/core/growth/priority";
import type {
  GrowthVentasBoardLane,
  GrowthVentasFunnelOption,
  GrowthVentasQueueItemView,
  GrowthVentasStatusOption,
} from "@/lib/growth/ventas-view";
import { cn } from "@/lib/utils";
import { OwnerSelect } from "./OwnerSelect";

export interface VentasListClientProps {
  items: GrowthVentasQueueItemView[];
  funnels: GrowthVentasFunnelOption[];
  lanes: GrowthVentasBoardLane[];
  statusOptions: GrowthVentasStatusOption[];
  q: string;
  status: string;
  type: string;
  funnel: string;
  nextAction: string;
  band: string;
  vista: "lista" | "kanban";
  canOperate: boolean;
  canManageFunnels: boolean;
  members: Array<{ userId: string; label: string }>;
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

function FilterPill({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="relative inline-flex h-10 shrink-0 items-center">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 appearance-none rounded-xl border border-[var(--admin-border-subtle)] bg-white pl-3 pr-8 text-[13px] text-foreground shadow-sm outline-none"
      >
        {options.map((option) => (
          <option key={option.value || "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-muted" aria-hidden />
    </label>
  );
}

const COLUMN_THEMES = [
  { surface: "bg-[#e7f1ff]", accent: "border-l-[#3b82f6]", badge: "bg-[#dbeafe] text-[#1d4ed8]" },
  { surface: "bg-[#f1eefe]", accent: "border-l-[#8b5cf6]", badge: "bg-[#ede9fe] text-[#6d28d9]" },
  { surface: "bg-[#fff6dc]", accent: "border-l-[#f59e0b]", badge: "bg-[#fef3c7] text-[#b45309]" },
  { surface: "bg-[#ffefe3]", accent: "border-l-[#f97316]", badge: "bg-[#ffedd5] text-[#c2410c]" },
  { surface: "bg-[#ffecee]", accent: "border-l-[#fb7185]", badge: "bg-[#ffe4e6] text-[#be123c]" },
] as const;

const BAND_PILL: Record<GrowthPriorityBand, string> = {
  overdue: "bg-[#fde8e8] text-[#b42318]",
  unfollowed: "bg-[#fff4e5] text-[#b54708]",
  stale: "bg-[#f4f3ff] text-[#6941c6]",
  current: "bg-[#e7f8ef] text-[#067647]",
};

const AVATAR_TONES = [
  "bg-sky-100 text-sky-800",
  "bg-violet-100 text-violet-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-emerald-100 text-emerald-800",
  "bg-orange-100 text-orange-800",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`;
  return letters.toUpperCase() || "—";
}

function avatarTone(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash + char.charCodeAt(0)) % AVATAR_TONES.length;
  return AVATAR_TONES[hash] ?? AVATAR_TONES[0];
}

function relativeActivity(iso?: string): string {
  if (!iso) return "Sin actividad";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Sin actividad";
  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return "Hace un momento";
  if (minutes < 60) return minutes === 1 ? "Hace 1 minuto" : `Hace ${minutes} minutos`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "Hace 1 hora" : `Hace ${hours} horas`;
  const days = Math.floor(hours / 24);
  if (days < 30) return days === 1 ? "Hace 1 día" : `Hace ${days} días`;
  const months = Math.floor(days / 30);
  return months === 1 ? "Hace 1 mes" : `Hace ${months} meses`;
}

async function requestOpportunityTransition(
  id: string,
  toState: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await fetch(
    `/api/growth/oportunidades/${encodeURIComponent(id)}/transition`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ toState }),
    }
  );
  if (response.ok) return { ok: true };
  try {
    const data = (await response.json()) as { error?: string };
    return { ok: false, error: data.error ?? "No se pudo mover la oportunidad." };
  } catch {
    return { ok: false, error: "No se pudo mover la oportunidad." };
  }
}

export function VentasListClient({
  items,
  funnels,
  lanes,
  statusOptions,
  q,
  status,
  type,
  funnel,
  nextAction,
  band,
  vista,
  canOperate,
  canManageFunnels,
  members,
}: VentasListClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirmDialog();

  const pushFilters = useCallback(
    (next: {
      q?: string;
      status?: string;
      type?: string;
      funnel?: string;
      nextAction?: string;
      band?: string;
      vista?: "lista" | "kanban";
    }) => {
      const params = new URLSearchParams();
      const nextQ = next.q ?? q;
      const nextStatus = next.status ?? status;
      const nextType = next.type ?? type;
      const nextFunnel = next.funnel ?? funnel;
      const nextNext = next.nextAction ?? nextAction;
      const nextBand = next.band ?? band;
      const nextVista = next.vista ?? vista;
      if (nextQ.trim()) params.set("q", nextQ.trim());
      if (nextStatus) params.set("status", nextStatus);
      if (nextType) params.set("type", nextType);
      if (nextFunnel) params.set("funnel", nextFunnel);
      if (nextNext) params.set("nextAction", nextNext);
      if (nextBand) params.set("banda", nextBand);
      if (nextVista === "lista") params.set("vista", "lista");
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `/admin/ventas?${qs}` : "/admin/ventas");
      });
    },
    [band, funnel, nextAction, q, router, status, type, vista]
  );

  const move = useCallback(
    (id: string, toState: string, label: string) => {
      void (async () => {
        if (isGrowthFunnelResultKey(toState)) {
          const ok = await confirm({
            title: `Marcar como ${label}`,
            description:
              "La oportunidad se cierra. Queda en el historial y se quita la próxima acción.",
            confirmLabel: label,
            destructive: toState === "lost" || toState === "archived",
          });
          if (!ok) return;
        }
        setMoveError(null);
        setMoving(true);
        try {
          const result = await requestOpportunityTransition(id, toState);
          if (!result.ok) setMoveError(result.error);
          router.refresh();
        } finally {
          setMoving(false);
        }
      })();
    },
    [confirm, router]
  );

  const hasFilters = Boolean(q || status || type || nextAction || funnel || band);
  const isEmpty = items.length === 0;
  const isTrueEmpty = isEmpty && !hasFilters;
  const knownStatus = statusOptions.some((option) => option.value === status);
  const statusChoices = !status || knownStatus
    ? statusOptions
    : [{ value: status, label: status }, ...statusOptions];
  const activeFunnels = funnels.filter((item) => item.status === "active");
  const singleFunnelKey = activeFunnels.length === 1 ? activeFunnels[0].key : "";

  const filterBar = (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        isTrueEmpty && "opacity-90"
      )}
    >
      <SearchBar
        placeholder="Buscar por empresa, persona u oportunidad…"
        value={q}
        onChange={(value) => pushFilters({ q: value })}
        className="w-full shrink-0 sm:w-[240px]"
      />
      <FilterPill
        label="Filtrar por estado"
        value={status}
        onChange={(value) => pushFilters({ status: value })}
        options={[{ value: "", label: "Todos los estados" }, ...statusChoices]}
      />
      <FilterPill
        label="Filtrar por embudo"
        value={funnel}
        onChange={(value) => pushFilters({ funnel: value })}
        options={[
          { value: "", label: "Todos los embudos" },
          ...funnels.map((item) => ({ value: item.key, label: item.name })),
        ]}
      />
      <FilterPill
        label="Filtrar por tipo"
        value={type}
        onChange={(value) => pushFilters({ type: value })}
        options={[{ value: "", label: "Todos los tipos" }, ...GROWTH_OPPORTUNITY_TYPE_FILTER_OPTIONS]}
      />
      <FilterPill
        label="Filtrar por prioridad"
        value={band}
        onChange={(value) => pushFilters({ band: value })}
        options={[{ value: "", label: "Todas las prioridades" }, ...GROWTH_BAND_FILTER_OPTIONS]}
      />
      <FilterPill
        label="Filtrar por próxima acción"
        value={nextAction}
        onChange={(value) => pushFilters({ nextAction: value })}
        options={[...GROWTH_NEXT_ACTION_FILTER_OPTIONS]}
      />
      {hasFilters ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 shrink-0 rounded-xl"
          onClick={() =>
            startTransition(() => {
              router.push(vista === "lista" ? "/admin/ventas?vista=lista" : "/admin/ventas");
            })
          }
        >
          Limpiar
        </Button>
      ) : null}
    </div>
  );

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: GROWTH_VENTAS_PAGE_TITLE },
      ]}
      title={GROWTH_VENTAS_PAGE_TITLE}
      hideTitle
    >
      {dialog}
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[1.7rem] font-bold tracking-tight text-foreground">
            {GROWTH_VENTAS_PAGE_TITLE}
          </h1>
          <p className="mt-1 text-sm text-muted">{GROWTH_VENTAS_PAGE_DESCRIPTION}</p>
        </div>
        <label className="relative inline-flex h-10 max-w-full items-center gap-1.5 rounded-xl border border-[var(--admin-border-subtle)] bg-white pl-3 pr-9 text-sm shadow-sm">
          <span className="shrink-0 text-muted">Embudo:</span>
          <select
            aria-label="Embudo activo"
            className="max-w-[16rem] appearance-none truncate bg-transparent font-semibold text-foreground outline-none"
            value={funnel || singleFunnelKey}
            onChange={(event) => pushFilters({ funnel: event.target.value === singleFunnelKey ? "" : event.target.value })}
          >
            {activeFunnels.length !== 1 ? <option value="">Todos los embudos</option> : null}
            {funnels.map((item) => (
              <option key={item.key} value={item.key}>
                {item.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-muted" aria-hidden />
        </label>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div
          className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-[var(--admin-border-subtle)]"
          role="group"
          aria-label="Vista de oportunidades"
        >
          <button
            type="button"
            aria-pressed={vista === "kanban"}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition",
              vista === "kanban"
                ? "bg-[var(--growth-os-primary)] text-white"
                : "text-muted hover:text-foreground"
            )}
            onClick={() => pushFilters({ vista: "kanban" })}
          >
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
            Kanban
          </button>
          <button
            type="button"
            aria-pressed={vista === "lista"}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition",
              vista === "lista"
                ? "bg-[var(--growth-os-primary)] text-white"
                : "text-muted hover:text-foreground"
            )}
            onClick={() => pushFilters({ vista: "lista" })}
          >
            <List className="h-3.5 w-3.5" aria-hidden />
            Lista
          </button>
        </div>
        {canManageFunnels ? (
          <Link href="/admin/ventas/embudos" className="text-sm font-medium text-muted underline-offset-2 hover:text-foreground hover:underline">
            Embudos
          </Link>
        ) : null}
      </div>

      <div className="mb-5">{filterBar}</div>

      {moveError ? (
        <p
          role="alert"
          className="mb-4 rounded-[var(--radius-md)] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {moveError}
        </p>
      ) : null}
      {vista === "lista" && isEmpty ? (
        <EmptyState
          title={hasFilters ? GROWTH_VENTAS_NO_MATCH_TITLE : GROWTH_VENTAS_EMPTY_TITLE}
          description={
            hasFilters ? GROWTH_VENTAS_NO_MATCH_DESCRIPTION : GROWTH_VENTAS_EMPTY_DESCRIPTION
          }
          icon={<Handshake className="h-8 w-8" />}
        />
      ) : null}
      {vista === "lista" && !isEmpty ? (
        <ul className={cn("flex flex-col gap-3", (pending || moving) && "opacity-70 transition-opacity")}>
          {items.map((item) => (
            <li key={item.id} className={cn(rowClass, "px-4 py-4")}>
              <Link
                href={`/admin/ventas/${encodeURIComponent(item.id)}`}
                className="flex items-start gap-4 no-underline"
              >
                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[15px] font-semibold tracking-tight text-foreground">
                      {item.personaDisplayName}
                    </p>
                    <StatusBadge tone={statusTone(item.status)} label={item.statusLabel} />
                  </div>

                  <div>
                    <p className={cn(aek.label, "mb-1")}>{GROWTH_NEXT_ACTION_SECTION_LABEL}</p>
                    <p
                      className={cn(
                        "text-[17px] font-semibold tracking-tight",
                        item.hasNextAction ? "text-foreground" : "text-muted"
                      )}
                    >
                      {item.hasNextAction ? item.nextActionLabel : GROWTH_NO_NEXT_ACTION_LABEL}
                    </p>
                  </div>

                  <p className="text-sm text-muted">
                    {item.originLabel}
                    <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
                    {item.typeLabel}
                    <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
                    {item.funnelName}
                    <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
                    {item.stageLabel}
                    <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
                    {item.priorityBand ? growthPriorityBandLabel(item.priorityBand) : item.statusLabel}
                    <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
                    {item.ownerLabel ?? "Sin responsable"}
                    <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
                    {GROWTH_VENTAS_LAST_ACTIVITY_LABEL}: {item.lastActivityLabel}
                  </p>
                </div>
                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted" />
              </Link>
              <OpportunityMoveControl
                item={item}
                canOperate={canOperate}
                pending={pending || moving}
                onMove={move}
              />
            </li>
          ))}
        </ul>
      ) : null}
      {vista === "kanban" ? (
        <KanbanBoard
          items={items}
          lanes={lanes}
          canOperate={canOperate}
          members={members}
          pending={pending || moving}
          isEmpty={isEmpty}
          hasFilters={hasFilters}
          onMove={move}
          onReject={(message) => setMoveError(message)}
        />
      ) : null}
    </AdminModulePage>
  );
}

function KanbanBoard({
  items,
  lanes,
  canOperate,
  members,
  pending,
  isEmpty,
  hasFilters,
  onMove,
  onReject,
}: {
  items: GrowthVentasQueueItemView[];
  lanes: GrowthVentasBoardLane[];
  canOperate: boolean;
  members: Array<{ userId: string; label: string }>;
  pending: boolean;
  isEmpty: boolean;
  hasFilters: boolean;
  onMove: (id: string, toState: string, label: string) => void;
  onReject: (message: string) => void;
}) {
  const [overKey, setOverKey] = useState<string | null>(null);
  if (lanes.length === 0) {
    return (
      <EmptyState
        title={hasFilters ? GROWTH_VENTAS_NO_MATCH_TITLE : GROWTH_VENTAS_EMPTY_TITLE}
        description={
          hasFilters ? GROWTH_VENTAS_NO_MATCH_DESCRIPTION : GROWTH_VENTAS_EMPTY_DESCRIPTION
        }
        icon={<Handshake className="h-8 w-8" />}
      />
    );
  }

  return (
    <div className={cn("space-y-6", pending && "opacity-70 transition-opacity")}>
      <style>{`
        .kanban-lane { --kanban-col: min(86vw, 18.75rem); }
        @media (min-width: 768px) {
          .kanban-lane { --kanban-col: 17.25rem; }
        }
      `}</style>
      {isEmpty ? (
        <EmptyState
          title={hasFilters ? GROWTH_VENTAS_NO_MATCH_TITLE : GROWTH_VENTAS_EMPTY_TITLE}
          description={
            hasFilters
              ? GROWTH_VENTAS_NO_MATCH_DESCRIPTION
              : "El tablero muestra las etapas del embudo. Las oportunidades aparecerán en su columna."
          }
          icon={<Handshake className="h-8 w-8" />}
        />
      ) : null}
      {lanes.map((lane) => {
        const laneItems = items.filter((item) => item.funnelKey === lane.funnelKey);
        const openItems = laneItems.filter((item) => !isGrowthFunnelResultKey(item.status));
        const closedItems = laneItems.filter((item) => isGrowthFunnelResultKey(item.status));
        return (
          <section key={lane.funnelKey} aria-label={lane.funnelName}>
            {lanes.length > 1 ? (
              <h2 className="mb-3 text-sm font-semibold text-foreground">
                {lane.funnelName}
                {lane.isDefault ? " · Predeterminado" : ""}
              </h2>
            ) : null}
            <div className="kanban-lane -mx-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain px-1 pb-2 md:snap-none">
              <div
                className="grid w-max min-w-full gap-3"
                style={{
                  gridAutoFlow: "column",
                  gridAutoColumns: "minmax(var(--kanban-col), 1fr)",
                }}
              >
              {lane.columns.map((column, index) => {
                const theme = COLUMN_THEMES[index % COLUMN_THEMES.length];
                const dropId = `${lane.funnelKey}:${column.key}`;
                const cards = openItems
                  .filter((item) => item.status === column.key)
                  .slice()
                  .sort(
                    (a, b) =>
                      a.priorityRank - b.priorityRank ||
                      (a.priorityKey ?? 0) - (b.priorityKey ?? 0)
                  );
                return (
                  <section
                    key={column.key}
                    aria-label={`${column.label}, ${cards.length}`}
                    className={cn(
                      "flex min-h-64 snap-start flex-col rounded-2xl border-l-4 p-2.5 sm:p-3",
                      theme.surface,
                      theme.accent,
                      overKey === dropId && "ring-2 ring-[var(--growth-os-primary)]",
                      !column.active && "opacity-80"
                    )}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      setOverKey(dropId);
                    }}
                    onDragLeave={() => setOverKey((current) => (current === dropId ? null : current))}
                    onDrop={(event) => {
                      event.preventDefault();
                      setOverKey(null);
                      const id =
                        event.dataTransfer.getData("text/opportunity-id") ||
                        event.dataTransfer.getData("text/plain");
                      const item = items.find((entry) => entry.id === id);
                      if (!item || !canOperate || item.status === column.key) return;
                      if (item.funnelKey !== lane.funnelKey) {
                        onReject("Una oportunidad no cambia de embudo.");
                        return;
                      }
                      if (!column.active) {
                        onReject(`${column.label} está inactiva y no admite oportunidades.`);
                        return;
                      }
                      if (
                        !item.availableTransitions.some(
                          (transition) => transition.toState === column.key
                        )
                      ) {
                        onReject(`No se puede mover a ${column.label}.`);
                        return;
                      }
                      onMove(item.id, column.key, column.label);
                    }}
                  >
                    <h3 className="mb-3 flex items-start justify-between gap-2 px-0.5">
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold leading-snug text-foreground">
                          {index + 1}. {column.label}
                        </span>
                        {!column.active ? (
                          <span className="mt-1 inline-flex rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium text-muted">
                            Inactiva
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          "inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums",
                          theme.badge
                        )}
                      >
                        {cards.length}
                      </span>
                    </h3>
                    {cards.length === 0 ? (
                      <p className="flex flex-1 items-center justify-center px-3 py-8 text-center text-xs text-muted">
                        Sin oportunidades
                      </p>
                    ) : (
                      <ul className="flex flex-1 flex-col gap-2.5">
                        {cards.map((item) => (
                          <KanbanCard
                            key={item.id}
                            item={item}
                            accent={theme.accent}
                            canOperate={canOperate}
                            members={members}
                            pending={pending}
                            onMove={onMove}
                          />
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}
              </div>
            </div>
            {closedItems.length > 0 ? (
              <div className="mt-3 border-t border-[var(--admin-border-subtle)] pt-3">
                <p className={cn(aek.label, "mb-2")}>Resultados</p>
                <ul className="flex flex-wrap gap-2 pb-1">
                  {closedItems.map((item) => (
                    <li
                      key={item.id}
                      className="min-w-[min(100%,16rem)] flex-1 rounded-xl border border-[var(--admin-border-subtle)] bg-white p-3 shadow-sm"
                    >
                      <Link
                        href={`/admin/ventas/${encodeURIComponent(item.id)}`}
                        className="font-medium text-foreground"
                      >
                        {item.personaDisplayName}
                      </Link>
                      <div className="mt-2">
                        <StatusBadge tone={statusTone(item.status)} label={item.statusLabel} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function KanbanCard({
  item,
  accent,
  canOperate,
  members,
  pending,
  onMove,
}: {
  item: GrowthVentasQueueItemView;
  accent: string;
  canOperate: boolean;
  members: Array<{ userId: string; label: string }>;
  pending: boolean;
  onMove: (id: string, toState: string, label: string) => void;
}) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const draggable = canOperate && item.availableTransitions.length > 0;
  const band = item.priorityBand;
  const canAssign = canOperate && members.length > 0;
  const showActions = draggable || canAssign;
  const owner = item.ownerLabel?.trim();

  return (
    <li
      draggable={draggable}
      onDragStart={(event) => {
        if ((event.target as HTMLElement).closest("[data-kanban-actions]")) {
          event.preventDefault();
          return;
        }
        event.dataTransfer.setData("text/opportunity-id", item.id);
        event.dataTransfer.setData("text/plain", item.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "rounded-xl border border-black/[0.04] border-l-[3px] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.06)]",
        accent,
        draggable && "cursor-grab active:cursor-grabbing"
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <Link
            href={`/admin/ventas/${encodeURIComponent(item.id)}`}
            className="block truncate text-[13.5px] font-semibold tracking-tight text-foreground"
          >
            {item.personaDisplayName}
          </Link>
          <p className="mt-0.5 truncate text-xs text-muted">{item.typeLabel}</p>
        </div>
        {showActions ? (
          <button
            type="button"
            data-kanban-actions
            aria-expanded={actionsOpen}
            aria-label={`Acciones de ${item.personaDisplayName}`}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted hover:bg-[var(--gray-50)]"
            onClick={() => setActionsOpen((open) => !open)}
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {band ? (
        <p className="mt-2.5">
          <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold", BAND_PILL[band])}>
            {growthPriorityBandLabel(band)}
          </span>
        </p>
      ) : null}

      <p className="mt-2.5 flex min-w-0 items-center gap-2 text-xs text-foreground">
        <span
          className={cn(
            "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold",
            owner ? avatarTone(owner) : "bg-[var(--gray-100)] text-muted"
          )}
          aria-hidden
        >
          {owner ? initials(owner) : "—"}
        </span>
        <span className="truncate">{owner ?? "Sin responsable"}</span>
      </p>

      <p className={cn("mt-2 flex items-start gap-1.5 text-[12.5px] leading-snug", item.hasNextAction ? "text-foreground" : "text-muted")}>
        <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
        <span className="min-w-0">{item.hasNextAction ? item.nextActionLabel : GROWTH_NO_NEXT_ACTION_LABEL}</span>
      </p>
      <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted">
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="truncate">{relativeActivity(item.lastActivityAt)}</span>
      </p>

      {actionsOpen && showActions ? (
        <div data-kanban-actions className="mt-3 space-y-3 border-t border-[var(--admin-border-subtle)] pt-3">
          {draggable ? (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Mover a</p>
              <div className="flex flex-col gap-1">
                {item.availableTransitions.map((transition) => (
                  <button
                    key={transition.id}
                    type="button"
                    disabled={pending}
                    className="min-h-9 rounded-md px-2 text-left text-sm text-foreground hover:bg-[var(--gray-50)] disabled:opacity-60"
                    onClick={() => {
                      setActionsOpen(false);
                      onMove(item.id, transition.toState, transition.label);
                    }}
                  >
                    {transition.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {canAssign ? (
            <OwnerSelect
              opportunityId={item.id}
              ownerUserId={item.ownerUserId}
              members={members}
              disabled={pending}
            />
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function OpportunityMoveControl({
  item,
  canOperate,
  pending,
  onMove,
}: {
  item: GrowthVentasQueueItemView;
  canOperate: boolean;
  pending: boolean;
  onMove: (id: string, toState: string, label: string) => void;
}) {
  const [toState, setToState] = useState("");
  if (!canOperate || item.availableTransitions.length === 0) return null;
  return (
    <form
      className="mt-2 flex flex-wrap gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!toState) return;
        const transition = item.availableTransitions.find((entry) => entry.toState === toState);
        onMove(item.id, toState, transition?.label ?? toState);
        setToState("");
      }}
    >
      <select
        aria-label={`Mover ${item.personaDisplayName}`}
        className="h-8 min-w-0 flex-1 rounded-md border border-[var(--admin-border-subtle)] bg-transparent px-2 text-sm"
        value={toState}
        onChange={(event) => setToState(event.target.value)}
      >
        <option value="">Mover a…</option>
        {item.availableTransitions.map((transition) => (
          <option key={transition.id} value={transition.toState}>
            {transition.label}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="outline" disabled={pending || !toState}>
        Mover
      </Button>
    </form>
  );
}
