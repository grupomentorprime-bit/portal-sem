"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  ChevronLeft,
  Clock,
  ExternalLink,
  Phone,
  StickyNote,
  UserRound,
} from "lucide-react";
import { aek } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatRecordedWhen, formatStageWhen } from "@/core/growth/commercial-dates";
import {
  GROWTH_NEXT_ACTION_SECTION_LABEL,
  GROWTH_NO_NEXT_ACTION_LABEL,
  GROWTH_TIMELINE_SECTION_LABEL,
  GROWTH_VENTAS_CLEAR_NEXT_ACTION_LABEL,
  GROWTH_VENTAS_OPEN_PERSONA_LABEL,
  GROWTH_VENTAS_REGISTER_CONTACT_LABEL,
  GROWTH_VENTAS_SAVE_NOTE_LABEL,
  growthPriorityBandLabel,
} from "@/lib/growth/labels";
import type { GrowthPriorityBand } from "@/core/growth/priority";
import type { GrowthActivityView } from "@/lib/growth/persona-view";
import type {
  GrowthVentasOpportunityOperateView,
  GrowthVentasQueueItemView,
} from "@/lib/growth/ventas-view";
import { cn } from "@/lib/utils";
import { OwnerSelect } from "./OwnerSelect";

const BAND_PILL: Record<GrowthPriorityBand, string> = {
  overdue: "bg-[var(--admin-band-overdue-bg)] text-[var(--admin-band-overdue-fg)]",
  unfollowed: "bg-[var(--admin-band-unfollowed-bg)] text-[var(--admin-band-unfollowed-fg)]",
  stale: "bg-[var(--admin-band-stale-bg)] text-[var(--admin-band-stale-fg)]",
  current: "bg-[var(--admin-band-current-bg)] text-[var(--admin-band-current-fg)]",
};

const cardClass =
  "min-w-0 rounded-2xl border border-[var(--admin-border-subtle)] bg-white shadow-[var(--admin-shadow-panel)]";

const fieldClass =
  "h-10 w-full rounded-lg border border-[var(--admin-border-subtle)] bg-white px-3 text-sm text-foreground outline-none transition focus-visible:border-[var(--growth-os-primary)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--growth-os-primary)_28%,transparent)] disabled:cursor-not-allowed disabled:opacity-60";

type HistoryState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; item: GrowthVentasOpportunityOperateView };

function compareQueue(a: GrowthVentasQueueItemView, b: GrowthVentasQueueItemView): number {
  if (a.priorityRank !== b.priorityRank) return a.priorityRank - b.priorityRank;
  const aKey = a.priorityKey ?? Number.MAX_SAFE_INTEGER;
  const bKey = b.priorityKey ?? Number.MAX_SAFE_INTEGER;
  if (aKey !== bKey) return aKey - bKey;
  return b.updatedAt.localeCompare(a.updatedAt);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function countLabel(count: number): string {
  return count === 1 ? "1 oportunidad" : `${count} oportunidades`;
}

function duePhrase(dueAt: string | undefined, overdue: boolean): string | null {
  if (!dueAt) return null;
  const when = formatStageWhen(dueAt);
  return overdue ? `Venció ${when}` : `Vence ${when}`;
}

type WorkTab = "contact" | "note" | "follow";

const WORK_TABS: Array<{
  id: WorkTab;
  label: string;
  hint: string;
  icon: typeof Phone;
}> = [
  {
    id: "contact",
    label: GROWTH_VENTAS_REGISTER_CONTACT_LABEL,
    hint: "Conversación con la persona. Queda en el historial.",
    icon: Phone,
  },
  {
    id: "note",
    label: GROWTH_VENTAS_SAVE_NOTE_LABEL,
    hint: "Nota interna. No registra un contacto.",
    icon: StickyNote,
  },
  {
    id: "follow",
    label: "Programar seguimiento",
    hint: "Define la próxima acción. No escribe en el historial.",
    icon: CalendarClock,
  },
];

function recordedContact(live: GrowthVentasOpportunityOperateView | null): {
  email: string;
  phone: string;
  organization: string;
} {
  return {
    email: live?.email?.trim() ?? "",
    phone: live?.phone?.trim() ?? "",
    organization: live?.organizationName?.trim() ?? "",
  };
}

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? "No se pudo completar la acción.";
  } catch {
    return "No se pudo completar la acción.";
  }
}

export function OpportunityQueueDesk({
  items,
  canOperate,
  members,
  pending,
  onMove,
}: {
  items: GrowthVentasQueueItemView[];
  canOperate: boolean;
  members: Array<{ userId: string; label: string }>;
  pending: boolean;
  onMove: (id: string, toState: string, label: string) => Promise<boolean>;
}) {
  const queue = useMemo(() => items.slice().sort(compareQueue), [items]);
  const [selectedId, setSelectedId] = useState<string | null>(queue[0]?.id ?? null);
  const [mobilePane, setMobilePane] = useState<"queue" | "detail">("queue");
  const [desktop, setDesktop] = useState(false);
  const [tick, setTick] = useState(0);
  const [workTab, setWorkTab] = useState<WorkTab>("contact");
  const needsAttention = queue.some((item) => item.priorityRank < 3);
  const multipleFunnels = new Set(queue.map((item) => item.funnelKey)).size > 1;

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const apply = () => setDesktop(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (selectedId && queue.some((item) => item.id === selectedId)) return;
    setSelectedId(queue[0]?.id ?? null);
    setMobilePane("queue");
  }, [queue, selectedId]);

  const selected = queue.find((item) => item.id === selectedId) ?? null;

  const open = (id: string) => {
    setSelectedId(id);
    setMobilePane("detail");
  };

  return (
    <div
      className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(17.5rem,24rem)_minmax(0,1fr)]"
      data-opportunity-queue
    >
      <section
        className={cn(
          cardClass,
          "flex flex-col self-start lg:sticky lg:top-0 lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-hidden",
          mobilePane === "detail" && "max-lg:hidden"
        )}
        aria-label="Cola de trabajo"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--admin-border-subtle)] px-3.5 py-2.5">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Cola de trabajo</h3>
          <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--growth-os-primary)_10%,white)] px-2 py-0.5 text-[11px] font-semibold text-[var(--growth-os-primary)]">
            {countLabel(queue.length)}
          </span>
        </header>
        {needsAttention ? (
          <p className="flex shrink-0 items-center gap-2 border-b border-[var(--admin-border-subtle)] px-3.5 py-1.5 text-[11.5px] text-muted">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-danger)]" aria-hidden />
            Primero las que requieren atención
          </p>
        ) : null}
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-y-contain p-1.5">
          {queue.map((item) => (
            <li key={item.id}>
              <QueueRow
                item={item}
                selected={item.id === selected?.id}
                showFunnel={multipleFunnels}
                onSelect={() => open(item.id)}
              />
            </li>
          ))}
        </ul>
      </section>

      <section
        className={cn(
          cardClass,
          "flex flex-col self-start lg:sticky lg:top-0 lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-hidden",
          mobilePane === "queue" && "max-lg:hidden"
        )}
        aria-label="Gestión de la oportunidad"
      >
        {selected ? (
          <QueueDetail
            key={selected.id}
            item={selected}
            tick={tick}
            canOperate={canOperate}
            members={members}
            pending={pending}
            showBack={mobilePane === "detail"}
            workTab={workTab}
            onWorkTab={setWorkTab}
            onBack={() => setMobilePane("queue")}
            active={desktop || mobilePane === "detail"}
            onMove={onMove}
            onChanged={() => setTick((value) => value + 1)}
          />
        ) : (
          <div className="flex min-h-48 flex-1 flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-sm font-medium text-foreground">Selecciona una oportunidad</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              El seguimiento, la etapa y el historial se gestionan aquí, sin salir de la cola.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function QueueRow({
  item,
  selected,
  showFunnel,
  onSelect,
}: {
  item: GrowthVentasQueueItemView;
  selected: boolean;
  showFunnel: boolean;
  onSelect: () => void;
}) {
  const overdue = item.priorityBand === "overdue";
  const attention =
    item.priorityBand && item.priorityBand !== "current" ? item.priorityBand : null;
  const due = duePhrase(item.nextActionDueAt, overdue);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border px-2.5 py-2 text-left transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--growth-os-primary)]",
        selected
          ? "border-[color-mix(in_srgb,var(--growth-os-primary)_40%,white)] bg-[color-mix(in_srgb,var(--growth-os-primary)_7%,white)] shadow-[inset_3px_0_0_var(--growth-os-primary)]"
          : overdue
            ? "border-transparent bg-white shadow-[inset_3px_0_0_var(--color-danger)] hover:bg-[var(--admin-surface-muted)]"
            : "border-transparent bg-white hover:bg-[var(--admin-surface-muted)]"
      )}
    >
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[11px] font-semibold",
          selected
            ? "bg-[var(--growth-os-primary)] text-white"
            : "bg-[color-mix(in_srgb,var(--growth-os-primary)_12%,white)] text-[var(--growth-os-primary)]"
        )}
        aria-hidden
      >
        {initials(item.personaDisplayName)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-semibold tracking-tight text-foreground">
            {item.personaDisplayName}
          </span>
          <span className="inline-flex rounded-md bg-[color-mix(in_srgb,var(--growth-os-primary)_10%,white)] px-1.5 py-0.5 text-[10.5px] font-medium text-[var(--growth-os-primary)]">
            {item.stageLabel}
          </span>
          {attention ? (
            <span className={cn("inline-flex rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold", BAND_PILL[attention])}>
              {growthPriorityBandLabel(attention)}
            </span>
          ) : null}
          {!item.priorityBand ? (
            <span className="inline-flex rounded-md bg-[var(--admin-surface-muted)] px-1.5 py-0.5 text-[10.5px] font-medium text-muted">
              {item.statusLabel}
            </span>
          ) : null}
        </span>
        <span
          className={cn(
            "mt-1 block truncate text-[13px]",
            item.hasNextAction ? "text-foreground" : "text-muted"
          )}
          title={item.hasNextAction ? item.nextActionLabel : undefined}
        >
          {item.hasNextAction ? item.nextActionLabel : GROWTH_NO_NEXT_ACTION_LABEL}
        </span>
        <span className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--gray-700)]">
          <span className="inline-flex min-w-0 items-center gap-1">
            <UserRound className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{item.ownerLabel ?? "Sin responsable"}</span>
          </span>
          {due ? (
            <span className={cn("inline-flex items-center gap-1", overdue && "font-medium text-destructive")}>
              <Clock className="h-3 w-3 shrink-0" aria-hidden />
              {due}
            </span>
          ) : null}
          {showFunnel ? <span className="truncate">{item.funnelName}</span> : null}
        </span>
      </span>
    </button>
  );
}

function QueueDetail({
  item,
  tick,
  canOperate,
  members,
  pending,
  active,
  showBack,
  workTab,
  onWorkTab,
  onBack,
  onMove,
  onChanged,
}: {
  item: GrowthVentasQueueItemView;
  tick: number;
  canOperate: boolean;
  members: Array<{ userId: string; label: string }>;
  pending: boolean;
  /** Evita pedir la ficha hasta que el panel es visible. */
  active: boolean;
  showBack: boolean;
  workTab: WorkTab;
  onWorkTab: (tab: WorkTab) => void;
  onBack: () => void;
  onMove: (id: string, toState: string, label: string) => Promise<boolean>;
  onChanged: () => void;
}) {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryState>({ status: "loading" });
  const [contact, setContact] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [nextSummary, setNextSummary] = useState("");
  const [nextDue, setNextDue] = useState("");
  const [nextError, setNextError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toState, setToState] = useState("");

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    let ignore = false;
    setHistory((current) =>
      current.status === "ready" && current.item.id === item.id
        ? current
        : { status: "loading" }
    );
    void (async () => {
      try {
        const response = await fetch(
          `/api/growth/oportunidades/${encodeURIComponent(item.id)}`,
          { signal: controller.signal, headers: { accept: "application/json" } }
        );
        const data = (await response.json().catch(() => null)) as {
          ok?: boolean;
          item?: GrowthVentasOpportunityOperateView;
          error?: string;
        } | null;
        if (ignore) return;
        if (!response.ok || !data?.ok || !data.item) {
          const message = data?.error ?? "No se pudo cargar la actividad.";
          setHistory((current) =>
            current.status === "ready" && current.item.id === item.id
              ? current
              : { status: "error", message }
          );
          return;
        }
        setHistory({ status: "ready", item: data.item });
      } catch (error) {
        if (ignore || (error instanceof DOMException && error.name === "AbortError")) return;
        setHistory((current) =>
          current.status === "ready" && current.item.id === item.id
            ? current
            : { status: "error", message: "No se pudo cargar la actividad." }
        );
      }
    })();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [active, item.id, tick]);

  const live = history.status === "ready" ? history.item : null;
  const hasNext = live ? Boolean(live.nextAction) : item.hasNextAction;
  const summary = live?.nextAction?.summary ?? (hasNext ? item.nextActionLabel : GROWTH_NO_NEXT_ACTION_LABEL);
  const dueAt = live?.nextAction?.dueAt ?? item.nextActionDueAt;
  const band = live?.priorityBand ?? item.priorityBand;
  const overdue = band === "overdue";
  const stageLabel = live?.stageLabel ?? item.stageLabel;
  const ownerUserId = live?.ownerUserId ?? item.ownerUserId;
  const ownerLabel = live?.ownerLabel ?? item.ownerLabel;
  const transitions = live?.availableTransitions ?? item.availableTransitions;
  const busy = pending || saving;
  const contactInfo = recordedContact(live);
  const activeWork = WORK_TABS.find((tab) => tab.id === workTab) ?? WORK_TABS[0];
  const fichaHref = `/admin/ventas/${encodeURIComponent(item.id)}`;
  const personaHref = `/admin/personas/${encodeURIComponent(item.personaId)}?oportunidad=${encodeURIComponent(item.id)}`;

  const refreshBoth = () => {
    router.refresh();
    onChanged();
  };

  const save = async (
    fn: () => Promise<void>,
    setError: (message: string | null) => void
  ) => {
    setSaving(true);
    setError(null);
    try {
      await fn();
      refreshBoth();
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const onFollowUp = (kind: "note" | "contact") => {
    const text = kind === "contact" ? contact : note;
    const setError = kind === "contact" ? setContactError : setNoteError;
    if (!text.trim()) {
      setError(kind === "contact" ? "Escribe qué se conversó." : "Escribe la nota.");
      return;
    }
    void save(async () => {
      const response = await fetch(
        `/api/growth/oportunidades/${encodeURIComponent(item.id)}/activities`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind, summary: text }),
        }
      );
      if (!response.ok) throw new Error(await readError(response));
      if (kind === "contact") setContact("");
      else setNote("");
    }, setError);
  };

  const onSetNext = () => {
    if (!nextSummary.trim()) {
      setNextError("Escribe qué hay que hacer.");
      return;
    }
    void save(async () => {
      const response = await fetch(
        `/api/growth/oportunidades/${encodeURIComponent(item.id)}/next-action`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            summary: nextSummary,
            ...(nextDue ? { dueAt: nextDue } : {}),
            ...(live?.nextAction?.kind ? { kind: live.nextAction.kind } : {}),
          }),
        }
      );
      if (!response.ok) throw new Error(await readError(response));
      setNextSummary("");
      setNextDue("");
    }, setNextError);
  };

  const onClearNext = () => {
    void save(async () => {
      const response = await fetch(
        `/api/growth/oportunidades/${encodeURIComponent(item.id)}/next-action`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error(await readError(response));
    }, setNextError);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="sticky top-0 z-10 shrink-0 border-b border-[var(--admin-border-subtle)] bg-white lg:static">
      <header className="px-4 pb-3 pt-3">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--growth-os-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--growth-os-primary)] lg:hidden"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Cola
          </button>
        ) : null}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold tracking-tight text-foreground">
              <Link href={personaHref} className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--growth-os-primary)]">
                {item.personaDisplayName}
              </Link>
            </h3>
            <p className="mt-0.5 truncate text-xs text-muted">
              {item.typeLabel}
              <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
              {item.funnelName}
              <span className="mx-1.5 text-[var(--admin-border-subtle)]">·</span>
              <span className="text-foreground">{ownerLabel ?? "Sin responsable"}</span>
            </p>
          </div>
          <span className="shrink-0 rounded-md bg-[color-mix(in_srgb,var(--growth-os-primary)_10%,white)] px-2 py-1 text-[11px] font-semibold text-[var(--growth-os-primary)]">
            {stageLabel}
          </span>
        </div>
        <div className="mt-2">
          <div className="flex items-center justify-between gap-2">
            <p className={cn("text-[11px] font-medium uppercase tracking-wide", overdue ? "text-destructive" : "text-muted")}>
              {overdue ? "Próxima acción vencida" : GROWTH_NEXT_ACTION_SECTION_LABEL}
            </p>
            {band && band !== "current" ? (
              <span className={cn("rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold", BAND_PILL[band])}>
                {live?.priorityLabel ?? growthPriorityBandLabel(band)}
              </span>
            ) : null}
          </div>
          <p
            className={cn(
              "line-clamp-2 text-sm font-semibold tracking-tight",
              overdue ? "text-destructive" : hasNext ? "text-foreground" : "text-muted"
            )}
            title={hasNext ? summary : undefined}
          >
            {hasNext ? summary : GROWTH_NO_NEXT_ACTION_LABEL}
          </p>
          <p className={cn("text-xs", overdue ? "font-medium text-destructive" : "text-muted")}>
            {dueAt ? duePhrase(dueAt, overdue) : "Sin vencimiento"}
          </p>
        </div>
        {contactInfo.organization || contactInfo.email || contactInfo.phone ? (
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-foreground">
            {contactInfo.organization ? <span>{contactInfo.organization}</span> : null}
            {contactInfo.email ? (
              <a className="text-[var(--growth-os-primary)] hover:underline" href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>
            ) : null}
            {contactInfo.phone ? (
              <a className="text-[var(--growth-os-primary)] hover:underline" href={`tel:${contactInfo.phone}`}>{contactInfo.phone}</a>
            ) : null}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium">
          <Link href={fichaHref} className="inline-flex items-center gap-1 text-[var(--growth-os-primary)] hover:underline">
            Ficha completa
            <ExternalLink className="h-3 w-3" aria-hidden />
          </Link>
          <Link href={personaHref} className="text-muted hover:text-foreground hover:underline">
            {GROWTH_VENTAS_OPEN_PERSONA_LABEL}
          </Link>
        </div>
      </header>

      {canOperate ? (
        <div className="grid gap-2 border-t border-[var(--admin-border-subtle)] px-4 py-2.5 sm:grid-cols-2">
            <form
              className="flex min-w-0 flex-col gap-1.5"
              onSubmit={(event) => {
                event.preventDefault();
                if (!toState) return;
                const transition = transitions.find((entry) => entry.toState === toState);
                void onMove(item.id, toState, transition?.label ?? toState).then((ok) => {
                  if (ok) {
                    setToState("");
                    onChanged();
                  }
                });
              }}
            >
              <span className="text-[11px] font-medium text-muted">Cambiar etapa</span>
              <div className="flex min-w-0 flex-wrap gap-2">
                <select
                  aria-label={`Cambiar etapa de ${item.personaDisplayName}`}
                  className={cn(fieldClass, "min-w-[8rem] flex-1")}
                  value={toState}
                  disabled={busy || transitions.length === 0}
                  onChange={(event) => setToState(event.target.value)}
                >
                  <option value="">
                    {transitions.length === 0 ? "Sin etapas disponibles" : "Elegir etapa…"}
                  </option>
                  {transitions.map((transition) => (
                    <option key={transition.id} value={transition.toState}>
                      {transition.label}
                    </option>
                  ))}
                </select>
                <Button type="submit" variant="outline" className="shrink-0" disabled={busy || !toState}>
                  Cambiar etapa
                </Button>
              </div>
            </form>
            <div className="min-w-0">
              <span className="mb-1.5 block text-[11px] font-medium text-muted">Responsable</span>
              <OwnerSelect
                opportunityId={item.id}
                ownerUserId={ownerUserId}
                members={members}
                disabled={!canOperate || busy}
                showLabel={false}
                className="h-10 rounded-lg px-3 outline-none focus-visible:border-[var(--growth-os-primary)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--growth-os-primary)_28%,transparent)]"
                onAssigned={onChanged}
              />
            </div>
        </div>
      ) : (
        <p className="border-t border-[var(--admin-border-subtle)] px-4 py-2.5 text-sm text-muted">
          Solo lectura: no tienes permiso para operar oportunidades.
        </p>
      )}
      </div>

      <div className="grid min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain xl:grid-cols-[minmax(0,1fr)_minmax(15rem,19rem)] xl:overflow-hidden">
        {canOperate ? (
          <div className="min-h-0 min-w-0 xl:overflow-y-auto xl:overscroll-y-contain">
            <WorkTabs value={workTab} onChange={onWorkTab} />
            <div
              role="tabpanel"
              id={`work-panel-${activeWork.id}`}
              aria-labelledby={`work-tab-${activeWork.id}`}
              className="px-4 py-3"
            >
              <p className="mb-2 text-xs leading-4 text-[var(--gray-700)]">{activeWork.hint}</p>
              {workTab === "contact" ? (
                <>
                  <Textarea
                    aria-label={GROWTH_VENTAS_REGISTER_CONTACT_LABEL}
                    value={contact}
                    onChange={(event) => setContact(event.target.value)}
                    placeholder="Qué se conversó"
                    rows={2}
                    className="min-h-16"
                  />
                  {contactError ? <p role="alert" className="mt-1.5 text-sm text-destructive">{contactError}</p> : null}
                  <Button type="button" className="mt-2" disabled={busy} onClick={() => onFollowUp("contact")}>
                    {GROWTH_VENTAS_REGISTER_CONTACT_LABEL}
                  </Button>
                </>
              ) : null}
              {workTab === "note" ? (
                <>
                  <Textarea
                    aria-label={GROWTH_VENTAS_SAVE_NOTE_LABEL}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Qué hay que recordar"
                    rows={2}
                    className="min-h-16"
                  />
                  {noteError ? <p role="alert" className="mt-1.5 text-sm text-destructive">{noteError}</p> : null}
                  <Button type="button" variant="outline" className="mt-2" disabled={busy} onClick={() => onFollowUp("note")}>
                    {GROWTH_VENTAS_SAVE_NOTE_LABEL}
                  </Button>
                </>
              ) : null}
              {workTab === "follow" ? (
                <>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10.5rem]">
                    <Input
                      aria-label="Qué hay que hacer"
                      value={nextSummary}
                      onChange={(event) => setNextSummary(event.target.value)}
                      placeholder="Qué hay que hacer"
                    />
                    <Input
                      type="date"
                      aria-label="Fecha del seguimiento"
                      value={nextDue}
                      onChange={(event) => setNextDue(event.target.value)}
                    />
                  </div>
                  {nextError ? <p role="alert" className="mt-1.5 text-sm text-destructive">{nextError}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button type="button" disabled={busy} onClick={onSetNext}>
                      Programar seguimiento
                    </Button>
                    {hasNext ? (
                      <Button type="button" variant="outline" disabled={busy} onClick={onClearNext}>
                        {GROWTH_VENTAS_CLEAR_NEXT_ACTION_LABEL}
                      </Button>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className={cn("min-h-0 min-w-0 px-4 py-4", canOperate && "border-t border-[var(--admin-border-subtle)] xl:overflow-y-auto xl:overscroll-y-contain xl:border-l xl:border-t-0")}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-foreground">{GROWTH_TIMELINE_SECTION_LABEL}</h4>
            {live && live.recentActivities.length > 5 ? (
              <Link href={fichaHref} className="text-xs font-medium text-muted hover:text-foreground hover:underline">
                Ver historial
              </Link>
            ) : null}
          </div>
          <HistoryBlock history={history} onRetry={onChanged} />
          {live?.assessment ? (
            <div className="mt-4 border-t border-[var(--admin-border-subtle)] pt-4">
              <p className={aek.label}>{live.assessment.title}</p>
              <p className="mt-1 text-sm text-foreground">{live.assessment.headline}</p>
              {live.assessment.reportPath ? (
                <a href={live.assessment.reportPath} className="mt-2 inline-block text-sm font-semibold text-foreground underline">
                  Ver informe
                </a>
              ) : null}
            </div>
          ) : null}
          {live && live.conversations.length > 0 ? (
            <ul className="mt-4 space-y-2 border-t border-[var(--admin-border-subtle)] pt-4">
              {live.conversations.slice(0, 3).map((conversation) => (
                <li key={conversation.id}>
                  <Link
                    href={`/admin/mensajes?c=${encodeURIComponent(conversation.id)}`}
                    className="text-sm font-medium text-foreground hover:underline"
                  >
                    {conversation.channelLabel}
                    {conversation.statusLabel ? ` · ${conversation.statusLabel}` : ""}
                  </Link>
                  <p className="truncate text-xs text-muted">
                    {conversation.lastMessagePreview || "Sin mensaje."}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function WorkTabs({
  value,
  onChange,
}: {
  value: WorkTab;
  onChange: (tab: WorkTab) => void;
}) {
  const refs = useRef<Partial<Record<WorkTab, HTMLButtonElement | null>>>({});

  const move = (current: WorkTab, key: string) => {
    const index = WORK_TABS.findIndex((tab) => tab.id === current);
    if (key === "ArrowRight") return WORK_TABS[(index + 1) % WORK_TABS.length].id;
    if (key === "ArrowLeft") return WORK_TABS[(index - 1 + WORK_TABS.length) % WORK_TABS.length].id;
    if (key === "Home") return WORK_TABS[0].id;
    if (key === "End") return WORK_TABS[WORK_TABS.length - 1].id;
    return null;
  };

  return (
    <div
      role="tablist"
      aria-label="Acciones de la oportunidad"
      aria-orientation="horizontal"
      className="flex gap-1 overflow-x-auto border-b border-[var(--admin-border-subtle)] px-2"
    >
      {WORK_TABS.map((tab) => {
        const selected = tab.id === value;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            ref={(node) => {
              refs.current[tab.id] = node;
            }}
            type="button"
            role="tab"
            id={`work-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`work-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => {
              const next = move(tab.id, event.key);
              if (!next) return;
              event.preventDefault();
              onChange(next);
              refs.current[next]?.focus();
            }}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2 text-[13px] font-medium",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--growth-os-primary)]",
              selected
                ? "border-[var(--growth-os-primary)] text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function HistoryBlock({
  history,
  onRetry,
}: {
  history: HistoryState;
  onRetry: () => void;
}) {
  if (history.status === "loading") {
    return <p className="text-sm text-muted">Cargando actividad…</p>;
  }
  if (history.status === "error") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">{history.message}</p>
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    );
  }
  return <ActivityList activities={history.item.recentActivities.slice(0, 5)} />;
}

function ActivityList({ activities }: { activities: GrowthActivityView[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted">Sin hechos registrados aún.</p>;
  }
  return (
    <ol className="space-y-3">
      {activities.map((activity) => (
        <li key={activity.id} className="flex gap-2.5">
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--growth-os-primary)_10%,white)] text-[var(--growth-os-primary)]">
            <Clock className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-foreground">
              {activity.summary || activity.kindLabel}
            </span>
            <span className="block text-xs text-muted">
              {activity.kindLabel !== activity.summary ? `${activity.kindLabel} · ` : ""}
              {activity.occurredAt ? formatRecordedWhen(activity.occurredAt) : "Sin fecha"}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
