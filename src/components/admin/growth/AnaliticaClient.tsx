/**
 * OT-GROWTH-UX-ANALYTICS-004 — diseño final /admin/analitica.
 * Datos reales del endpoint; sin alterar semántica funcional.
 */

"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { AlertBanner, EmptyState, aek } from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsV1Response } from "@/lib/growth/analytics-aggregate";
import { formatConversionPercent } from "@/lib/growth/analytics-aggregate";
import {
  ANALYTICS_PERIOD_PRESETS,
  type AnalyticsPeriodPreset,
} from "@/lib/growth/analytics-period";
import {
  GROWTH_ANALITICA_EMPTY_CAMPAIGNS,
  GROWTH_ANALITICA_EMPTY_LOSSES,
  GROWTH_ANALITICA_EMPTY_MESSAGES,
  GROWTH_ANALITICA_EMPTY_OPPORTUNITIES,
  GROWTH_ANALITICA_EMPTY_ORIGINS,
  GROWTH_ANALITICA_ERROR_DESCRIPTION,
  GROWTH_ANALITICA_ERROR_TITLE,
  GROWTH_ANALITICA_LOADING_LABEL,
  GROWTH_ANALITICA_PAGE_DESCRIPTION,
  GROWTH_ANALITICA_PAGE_TITLE,
  GROWTH_ANALITICA_PERIOD_LABELS,
  GROWTH_ANALITICA_RETRY_LABEL,
} from "@/lib/growth/labels";
import { cn } from "@/lib/utils";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; data: AnalyticsV1Response };

const PRESET_OPTIONS = ANALYTICS_PERIOD_PRESETS.filter(
  (p) => p !== "custom"
) as Exclude<AnalyticsPeriodPreset, "custom">[];

/** Orden humano del estado de lo generado. */
const SALES_STATUS_ORDER = [
  "Abierta",
  "En seguimiento",
  "Ganada",
  "Perdida",
  "Traspasada",
] as const;

function formatCount(n: number): string {
  return new Intl.NumberFormat("es-CL").format(n);
}

function toDatetimeLocalValue(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

function StorySection({
  id,
  eyebrow,
  question,
  children,
}: {
  id: string;
  eyebrow: string;
  question: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-6 space-y-5"
      data-analitica-section={id}
    >
      <header className="space-y-1">
        <p className={aek.label}>{eyebrow}</p>
        <h2
          id={`${id}-title`}
          className="text-xl font-semibold tracking-tight text-foreground sm:text-[1.35rem]"
        >
          {question}
        </h2>
      </header>
      {children}
    </section>
  );
}

function HeroMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "danger" | "attention" | "snapshot";
}) {
  const valueClass =
    tone === "success"
      ? "text-[var(--growth-os-success)]"
      : tone === "danger"
        ? "text-[var(--color-danger)]"
        : tone === "attention"
          ? "text-[var(--growth-os-light)]"
          : tone === "snapshot"
            ? "text-[var(--growth-os-primary)]"
            : "text-foreground";

  return (
    <div className="min-w-0">
      <p
        className={cn(
          "text-[1.75rem] font-semibold tracking-tight tabular-nums sm:text-[2rem]",
          valueClass
        )}
      >
        {formatCount(value)}
      </p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}

function ProportionBars({
  rows,
  empty,
  barClassName,
}: {
  rows: Array<{ label: string; count: number }>;
  empty: string;
  barClassName?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">{empty}</p>;
  }
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <ul className="space-y-3" role="list">
      {rows.map((row) => {
        const pct = Math.round((row.count / max) * 100);
        return (
          <li key={row.label} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-sm font-medium text-foreground">
                {row.label}
              </span>
              <span className="shrink-0 text-sm tabular-nums text-muted">
                {formatCount(row.count)}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-[var(--gray-100)]"
              role="img"
              aria-label={`${row.label}: ${formatCount(row.count)}`}
            >
              <div
                className={cn(
                  "h-full rounded-full bg-[var(--growth-os-primary)] transition-[width] duration-300",
                  barClassName
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function mergeSalesStatus(
  rows: Array<{ label: string; count: number }>
): Array<{ label: string; count: number }> {
  const map = new Map(rows.map((r) => [r.label, r.count]));
  return SALES_STATUS_ORDER.map((label) => ({
    label,
    count: map.get(label) ?? 0,
  }));
}

function statusTone(label: string): string {
  if (label === "Ganada") return "text-[var(--growth-os-success)]";
  if (label === "Perdida") return "text-[var(--color-danger)]";
  if (label === "En seguimiento") return "text-[var(--growth-os-primary)]";
  if (label === "Traspasada") return "text-[var(--growth-os-accent)]";
  return "text-foreground";
}

function AnaliticaSkeleton() {
  return (
    <div
      className="space-y-10"
      role="status"
      aria-live="polite"
      aria-label={GROWTH_ANALITICA_LOADING_LABEL}
      data-analitica-loading
    >
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-2 w-[85%]" />
        <Skeleton className="h-2 w-[60%]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

function PeriodSelector({
  preset,
  customFrom,
  customTo,
  pending,
  onPresetChange,
  onCustomFrom,
  onCustomTo,
  onApplyCustom,
}: {
  preset: AnalyticsPeriodPreset;
  customFrom: string;
  customTo: string;
  pending: boolean;
  onPresetChange: (value: AnalyticsPeriodPreset) => void;
  onCustomFrom: (value: string) => void;
  onCustomTo: (value: string) => void;
  onApplyCustom: () => void;
}) {
  return (
    <div className="space-y-3" data-analitica-period>
      <nav
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Período"
      >
        {PRESET_OPTIONS.map((p) => {
          const active = preset === p;
          return (
            <button
              key={p}
              type="button"
              disabled={pending && active}
              aria-pressed={active}
              onClick={() => onPresetChange(p)}
              className={cn(
                "shrink-0 rounded-[10px] px-3.5 py-2 text-sm font-medium transition duration-150",
                aek.focus,
                active
                  ? "bg-[var(--growth-os-primary)] text-white shadow-sm"
                  : "bg-[var(--gray-100)] text-[var(--gray-700)] hover:bg-[color-mix(in_srgb,var(--growth-os-primary)_10%,var(--gray-100))] hover:text-[var(--growth-os-primary)]"
              )}
            >
              {GROWTH_ANALITICA_PERIOD_LABELS[p]}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={preset === "custom"}
          onClick={() => onPresetChange("custom")}
          className={cn(
            "shrink-0 rounded-[10px] px-3.5 py-2 text-sm font-medium transition duration-150",
            aek.focus,
            preset === "custom"
              ? "bg-[var(--growth-os-primary)] text-white shadow-sm"
              : "bg-[var(--gray-100)] text-[var(--gray-700)] hover:bg-[color-mix(in_srgb,var(--growth-os-primary)_10%,var(--gray-100))] hover:text-[var(--growth-os-primary)]"
          )}
        >
          {GROWTH_ANALITICA_PERIOD_LABELS.custom}
        </button>
      </nav>

      {preset === "custom" ? (
        <div className="flex flex-wrap items-end gap-3 rounded-[var(--radius-lg)] border border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] px-3.5 py-3">
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Desde</span>
            <input
              type="datetime-local"
              value={toDatetimeLocalValue(customFrom)}
              onChange={(e) => onCustomFrom(fromDatetimeLocalValue(e.target.value))}
              className="rounded-[10px] border border-[var(--admin-border-subtle)] bg-white px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Hasta</span>
            <input
              type="datetime-local"
              value={toDatetimeLocalValue(customTo)}
              onChange={(e) => onCustomTo(fromDatetimeLocalValue(e.target.value))}
              className="rounded-[10px] border border-[var(--admin-border-subtle)] bg-white px-3 py-2 text-sm text-foreground"
            />
          </label>
          <Button
            type="button"
            size="sm"
            onClick={onApplyCustom}
            disabled={pending || !customFrom || !customTo}
            className="h-9 rounded-[10px]"
          >
            Aplicar
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function AnaliticaClient({
  initial,
  initialPreset,
}: {
  initial: AnalyticsV1Response | null;
  initialPreset: AnalyticsPeriodPreset;
}) {
  const [preset, setPreset] = useState<AnalyticsPeriodPreset>(initialPreset);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [state, setState] = useState<FetchState>(
    initial ? { status: "ok", data: initial } : { status: "loading" }
  );
  const [pending, startTransition] = useTransition();

  const load = useCallback(
    async (nextPreset: AnalyticsPeriodPreset) => {
      const params = new URLSearchParams();
      params.set("preset", nextPreset);
      if (nextPreset === "custom") {
        if (customFrom) params.set("from", customFrom);
        if (customTo) params.set("to", customTo);
      }
      const res = await fetch(`/api/growth/analytics?${params.toString()}`, {
        method: "GET",
        credentials: "same-origin",
      });
      const body = (await res.json()) as
        | ({ ok: true } & AnalyticsV1Response)
        | { ok: false; error?: string };
      if (!res.ok || !body.ok) {
        setState({
          status: "error",
          message:
            !body.ok && body.error
              ? body.error
              : GROWTH_ANALITICA_ERROR_DESCRIPTION,
        });
        return;
      }
      const { ok: _ok, ...data } = body;
      setState({ status: "ok", data });
    },
    [customFrom, customTo]
  );

  useEffect(() => {
    if (initial && preset === initialPreset && preset !== "custom") return;
    if (preset === "custom") return;
    startTransition(() => {
      void load(preset);
    });
  }, [preset]); // eslint-disable-line react-hooks/exhaustive-deps -- carga al cambiar preset

  function onPresetChange(value: AnalyticsPeriodPreset) {
    setPreset(value);
  }

  function onApplyCustom() {
    setPreset("custom");
    startTransition(() => {
      void load("custom");
    });
  }

  function onRetry() {
    startTransition(() => {
      void load(preset);
    });
  }

  const data = state.status === "ok" ? state.data : null;
  const showSkeleton =
    state.status === "loading" || (pending && state.status !== "error");

  const salesStatuses = data ? mergeSalesStatus(data.sales.byStatus) : [];
  const hasLosses =
    data != null &&
    (data.sales.losses.byType.length > 0 ||
      data.sales.losses.byOrigin.length > 0 ||
      data.sales.losses.byCampaign.length > 0);

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: GROWTH_ANALITICA_PAGE_TITLE },
      ]}
      title={GROWTH_ANALITICA_PAGE_TITLE}
      description={GROWTH_ANALITICA_PAGE_DESCRIPTION}
    >
      <div
        className="mx-auto w-full max-w-4xl space-y-8"
        data-analitica-page
      >
        <PeriodSelector
          preset={preset}
          customFrom={customFrom}
          customTo={customTo}
          pending={pending}
          onPresetChange={onPresetChange}
          onCustomFrom={setCustomFrom}
          onCustomTo={setCustomTo}
          onApplyCustom={onApplyCustom}
        />

        {state.status === "error" ? (
          <div data-analitica-error>
            <AlertBanner
              variant="warning"
              title={GROWTH_ANALITICA_ERROR_TITLE}
              compact
            >
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm">
                  {state.message || GROWTH_ANALITICA_ERROR_DESCRIPTION}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onRetry}
                  className="h-8 rounded-[10px]"
                >
                  {GROWTH_ANALITICA_RETRY_LABEL}
                </Button>
              </div>
            </AlertBanner>
          </div>
        ) : null}

        {showSkeleton && !data ? <AnaliticaSkeleton /> : null}

        {data ? (
          <div
            className={cn(
              "space-y-12 sm:space-y-14",
              pending ? "opacity-70 transition-opacity" : undefined
            )}
            data-analitica-content
            aria-busy={pending || undefined}
          >
            {/* 1. Resumen */}
            <StorySection
              id="resumen"
              eyebrow="Resumen"
              question="¿Qué está pasando?"
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-5 sm:gap-6">
                <HeroMetric
                  label="Personas nuevas"
                  value={data.summary.personasNuevas}
                />
                <HeroMetric
                  label="Oportunidades generadas"
                  value={data.summary.oportunidadesGeneradas}
                />
                <HeroMetric
                  label="En seguimiento ahora"
                  value={data.summary.enSeguimiento}
                  tone="snapshot"
                />
                <HeroMetric
                  label="Ganadas"
                  value={data.summary.ganadas}
                  tone="success"
                />
                <HeroMetric
                  label="Perdidas"
                  value={data.summary.perdidas}
                  tone="danger"
                />
              </div>
            </StorySection>

            {/* 2. Captación */}
            <StorySection
              id="captacion"
              eyebrow="Captación"
              question="¿De dónde llegan?"
            >
              <div className="space-y-5">
                <div>
                  <p className="text-[1.75rem] font-semibold tracking-tight tabular-nums text-foreground sm:text-[2rem]">
                    {formatCount(data.acquisition.total)}
                  </p>
                  <p className="mt-1 text-sm text-muted">Personas nuevas</p>
                </div>
                {data.acquisition.total === 0 ? (
                  <p className="text-sm text-muted">
                    {GROWTH_ANALITICA_EMPTY_ORIGINS}
                  </p>
                ) : (
                  <ProportionBars
                    rows={data.acquisition.byOrigin}
                    empty={GROWTH_ANALITICA_EMPTY_ORIGINS}
                  />
                )}
              </div>
            </StorySection>

            {/* 3. Ventas */}
            <StorySection
              id="ventas"
              eyebrow="Ventas"
              question="¿Qué pasa con las oportunidades?"
            >
              <div className="space-y-8">
                <div className="flex flex-wrap items-end justify-between gap-6">
                  <div>
                    <p className="text-[1.75rem] font-semibold tracking-tight tabular-nums text-foreground sm:text-[2rem]">
                      {formatCount(data.sales.generadas)}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Oportunidades generadas
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[1.75rem] font-semibold tracking-tight tabular-nums text-[var(--growth-os-primary)] sm:text-[2rem]">
                      {formatConversionPercent(data.sales.conversion.rate)}
                    </p>
                    <p className="mt-1 text-sm text-muted">Conversión</p>
                    <p className="mt-0.5 text-xs text-muted">
                      De las oportunidades generadas
                    </p>
                  </div>
                </div>

                {data.sales.generadas === 0 ? (
                  <p className="text-sm text-muted">
                    {GROWTH_ANALITICA_EMPTY_OPPORTUNITIES}
                  </p>
                ) : (
                  <div>
                    <p className="mb-3 text-sm font-medium text-foreground">
                      Estado actual de lo generado
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {salesStatuses.map((row) => (
                        <div
                          key={row.label}
                          className={cn(aek.surfaceMuted, "px-3.5 py-3")}
                        >
                          <p
                            className={cn(
                              "text-xl font-semibold tracking-tight tabular-nums",
                              statusTone(row.label)
                            )}
                          >
                            {formatCount(row.count)}
                          </p>
                          <p className="mt-1 text-xs text-muted sm:text-sm">
                            {row.label === "Abierta"
                              ? "Abiertas"
                              : row.label === "Ganada"
                                ? "Ganadas"
                                : row.label === "Perdida"
                                  ? "Perdidas"
                                  : row.label === "Traspasada"
                                    ? "Traspasadas"
                                    : row.label}
                          </p>
                        </div>
                      ))}
                    </div>
                    {data.sales.conversion.handedOff > 0 ? (
                      <p className="mt-3 text-sm text-muted">
                        Traspasadas en la conversión:{" "}
                        <span className="font-medium text-foreground">
                          {formatCount(data.sales.conversion.handedOff)}
                        </span>
                        {" · "}
                        no cuentan como ganadas.
                      </p>
                    ) : null}
                  </div>
                )}

                <div className="space-y-4 border-t border-[var(--admin-border-subtle)] pt-6">
                  <div>
                    <p className={aek.label}>Pérdidas</p>
                    <h3 className="mt-1 text-base font-semibold text-foreground">
                      ¿Dónde estamos perdiendo?
                    </h3>
                  </div>
                  {!hasLosses ? (
                    <p className="text-sm text-muted">
                      {GROWTH_ANALITICA_EMPTY_LOSSES}
                    </p>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-3">
                      {data.sales.losses.byType.length > 0 ? (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-foreground">
                            Por tipo
                          </p>
                          <ProportionBars
                            rows={data.sales.losses.byType}
                            empty={GROWTH_ANALITICA_EMPTY_LOSSES}
                            barClassName="bg-[color-mix(in_srgb,var(--color-danger)_70%,white)]"
                          />
                        </div>
                      ) : null}
                      {data.sales.losses.byOrigin.length > 0 ? (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-foreground">
                            Por origen
                          </p>
                          <ProportionBars
                            rows={data.sales.losses.byOrigin}
                            empty={GROWTH_ANALITICA_EMPTY_LOSSES}
                            barClassName="bg-[color-mix(in_srgb,var(--color-danger)_70%,white)]"
                          />
                        </div>
                      ) : null}
                      {data.sales.losses.byCampaign.length > 0 ? (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-foreground">
                            Por campaña
                          </p>
                          <ProportionBars
                            rows={data.sales.losses.byCampaign}
                            empty={GROWTH_ANALITICA_EMPTY_LOSSES}
                            barClassName="bg-[color-mix(in_srgb,var(--color-danger)_70%,white)]"
                          />
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </StorySection>

            {/* 4. Campañas */}
            <StorySection
              id="campanas"
              eyebrow="Campañas"
              question="¿Qué está funcionando?"
            >
              {data.campaigns.length === 0 ? (
                <EmptyState
                  title={GROWTH_ANALITICA_EMPTY_CAMPAIGNS}
                  description="Cuando una campaña genere oportunidades en este período, aparecerá aquí."
                  className="border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] px-6 py-10 shadow-none"
                />
              ) : (
                <ul className="flex flex-col gap-3" data-analitica-campaigns>
                  {data.campaigns.map((c, index) => (
                    <li key={c.id}>
                      <Link
                        href={`/admin/campanas/${c.id}`}
                        className={cn(
                          aek.surface,
                          "flex flex-col gap-4 px-4 py-4 no-underline shadow-[var(--admin-shadow-panel)] transition duration-150",
                          "hover:border-[color-mix(in_srgb,var(--color-primary)_20%,var(--admin-border-subtle))]",
                          "sm:flex-row sm:items-center sm:gap-6 sm:px-5"
                        )}
                      >
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <span
                            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--growth-os-primary)_12%,white)] text-xs font-semibold text-[var(--growth-os-primary)]"
                            aria-hidden
                          >
                            {index + 1}
                          </span>
                          <div className="min-w-0 space-y-1">
                            <p className="truncate text-[15px] font-semibold tracking-tight text-foreground sm:text-base">
                              {c.name}
                            </p>
                            <p className="text-sm text-muted">
                              <span className="font-semibold text-foreground">
                                {formatConversionPercent(c.conversionRate)}
                              </span>{" "}
                              conversión
                            </p>
                          </div>
                        </div>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-5 sm:text-right">
                          <div>
                            <dt className="text-muted">Personas</dt>
                            <dd className="font-semibold tabular-nums text-foreground">
                              {formatCount(c.personasCaptadas)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted">Oportunidades</dt>
                            <dd className="font-semibold tabular-nums text-foreground">
                              {formatCount(c.oportunidades)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted">En seguimiento</dt>
                            <dd className="font-semibold tabular-nums text-foreground">
                              {formatCount(c.enSeguimiento)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted">Ganadas</dt>
                            <dd className="font-semibold tabular-nums text-[var(--growth-os-success)]">
                              {formatCount(c.ganadas)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted">Perdidas</dt>
                            <dd className="font-semibold tabular-nums text-[var(--color-danger)]">
                              {formatCount(c.perdidas)}
                            </dd>
                          </div>
                        </dl>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </StorySection>

            {/* 5. Mensajes */}
            <StorySection
              id="mensajes"
              eyebrow="Mensajes"
              question="¿Por dónde nos hablan?"
            >
              {data.messages.conversaciones === 0 &&
              data.messages.recibidos === 0 &&
              data.messages.enviados === 0 &&
              data.messages.conversacionesSinRespuesta === 0 ? (
                <EmptyState
                  title={GROWTH_ANALITICA_EMPTY_MESSAGES}
                  description="Cuando lleguen conversaciones, verás el canal y lo que necesita respuesta."
                  className="border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] px-6 py-10 shadow-none"
                />
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
                    <HeroMetric
                      label="Conversaciones"
                      value={data.messages.conversaciones}
                    />
                    <HeroMetric
                      label="Mensajes recibidos"
                      value={data.messages.recibidos}
                    />
                    <HeroMetric
                      label="Mensajes enviados"
                      value={data.messages.enviados}
                    />
                    <HeroMetric
                      label="Personas que escribieron"
                      value={data.messages.personasQueEscribieron}
                    />
                  </div>

                  <div
                    className={cn(
                      aek.surface,
                      "flex flex-wrap items-end justify-between gap-3 px-4 py-4 sm:px-5",
                      data.messages.conversacionesSinRespuesta > 0
                        ? "border-[color-mix(in_srgb,var(--growth-os-light)_35%,var(--admin-border-subtle))] bg-[color-mix(in_srgb,var(--growth-os-light)_8%,white)]"
                        : undefined
                    )}
                    data-analitica-unanswered
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Conversaciones sin respuesta
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        Necesitan atención ahora
                      </p>
                    </div>
                    <p
                      className={cn(
                        "text-[1.75rem] font-semibold tracking-tight tabular-nums",
                        data.messages.conversacionesSinRespuesta > 0
                          ? "text-[var(--growth-os-light)]"
                          : "text-foreground"
                      )}
                    >
                      {formatCount(data.messages.conversacionesSinRespuesta)}
                    </p>
                  </div>

                  {data.messages.byChannel.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-foreground">
                        Por canal
                      </p>
                      <ProportionBars
                        rows={data.messages.byChannel}
                        empty={GROWTH_ANALITICA_EMPTY_MESSAGES}
                        barClassName="bg-[var(--growth-os-secondary)]"
                      />
                    </div>
                  ) : null}
                </div>
              )}
            </StorySection>
          </div>
        ) : null}
      </div>
    </AdminModulePage>
  );
}
