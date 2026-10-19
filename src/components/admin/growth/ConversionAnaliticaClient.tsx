/**
 * Conversion Engine fase 3 — /admin/conversion/analitica.
 * Solo datos del endpoint; una columna.
 */

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { AlertBanner, EmptyState, aek } from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatConversionPercent } from "@/lib/growth/analytics-aggregate";
import type { AnalyticsPeriodPreset } from "@/lib/growth/analytics-period";
import {
  CONVERSION_DENOMINATORS,
  CONVERSION_LOSS_REASONS_NOTE,
  CONVERSION_RATE_NOTE,
  type ConversionAnalyticsResponse,
  type ConversionCohortRow,
} from "@/lib/growth/conversion-analytics";
import {
  GROWTH_ANALITICA_ERROR_DESCRIPTION,
  GROWTH_ANALITICA_ERROR_TITLE,
  GROWTH_ANALITICA_LOADING_LABEL,
  GROWTH_ANALITICA_RETRY_LABEL,
  GROWTH_CONVERSION_ANALITICA_EMPTY_DESCRIPTION,
  GROWTH_CONVERSION_ANALITICA_FUNNEL_ALL,
  GROWTH_CONVERSION_ANALITICA_FUNNEL_LABEL,
  GROWTH_CONVERSION_ANALITICA_PAGE_DESCRIPTION,
  GROWTH_CONVERSION_ANALITICA_PAGE_TITLE,
  GROWTH_CONVERSION_ANALITICA_QUALITY_LABELS,
  GROWTH_CONVERSION_ANALITICA_SECTION_LABELS,
} from "@/lib/growth/labels";
import { cn } from "@/lib/utils";
import {
  HeroMetric,
  PeriodSelector,
  ProportionBars,
  StorySection,
  formatCount,
} from "./analitica-visual";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; data: ConversionAnalyticsResponse };

const DAY_MS = 86_400_000;
const ALL_FUNNELS = "__all__";
const SECTION_EMPTY = "Sin datos en el período";

function formatDays(ms: number | null): string {
  if (ms === null) return "—";
  return `${new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(ms / DAY_MS)} d`;
}

function Denominator({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted">{children}</p>;
}

function EmptyLine() {
  return <p className="text-sm text-muted">{SECTION_EMPTY}</p>;
}

function funnelKeyOfExit(rowKey: string): string {
  const split = rowKey.indexOf(":");
  return split === -1 ? rowKey : rowKey.slice(0, split);
}

function LossExitStages({
  rows,
  funnelLabels,
  selectedFunnel,
}: {
  rows: Array<{ key: string; label: string; count: number }>;
  funnelLabels: Map<string, string>;
  selectedFunnel: string;
}) {
  const visible =
    selectedFunnel === ALL_FUNNELS
      ? rows
      : rows.filter((row) => funnelKeyOfExit(row.key) === selectedFunnel);
  const groups = new Map<string, typeof visible>();
  for (const row of visible) {
    const funnelKey = funnelKeyOfExit(row.key);
    const list = groups.get(funnelKey) ?? [];
    list.push(row);
    groups.set(funnelKey, list);
  }
  if (visible.length === 0) return <EmptyLine />;
  return (
    <div className="flex flex-col gap-5">
      {[...groups.entries()].map(([funnelKey, stages]) => (
        <div key={funnelKey} className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            {selectedFunnel === ALL_FUNNELS
              ? (funnelLabels.get(funnelKey) ?? funnelKey)
              : "Por etapa de salida"}
          </p>
          <ProportionBars
            rows={stages}
            empty={SECTION_EMPTY}
            barClassName="bg-[color-mix(in_srgb,var(--color-danger)_70%,white)]"
          />
        </div>
      ))}
    </div>
  );
}

function FunnelHeading({ label }: { label: string }) {
  return <h3 className="text-base font-semibold text-foreground">{label}</h3>;
}

function CohortTable({
  title,
  rows,
}: {
  title: string;
  rows: ConversionCohortRow[];
}) {
  if (rows.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead>
            <tr className="text-muted">
              <th className="py-2 pr-3 font-medium">Cohorte</th>
              <th className="px-3 py-2 text-right font-medium">Ganadas</th>
              <th className="px-3 py-2 text-right font-medium">Abiertas</th>
              <th className="px-3 py-2 text-right font-medium">Perdidas</th>
              <th className="px-3 py-2 text-right font-medium">Traspasadas</th>
              <th className="py-2 pl-3 text-right font-medium">Tasa</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                className="border-t border-[var(--admin-border-subtle)]"
              >
                <td className="py-2 pr-3 text-foreground">
                  {row.label}{" "}
                  <span className="text-muted">({formatCount(row.cohort)})</span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatCount(row.won)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatCount(row.open)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatCount(row.lost)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatCount(row.handedOff)}
                </td>
                <td className="py-2 pl-3 text-right font-semibold tabular-nums">
                  {formatConversionPercent(row.rate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConversionSkeleton() {
  return (
    <div
      className="flex flex-col gap-6"
      role="status"
      aria-live="polite"
      aria-label={GROWTH_ANALITICA_LOADING_LABEL}
      data-conversion-analitica-loading
    >
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-2 w-[85%]" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function ConversionAnaliticaClient({
  initial,
  initialPreset,
}: {
  initial: ConversionAnalyticsResponse | null;
  initialPreset: AnalyticsPeriodPreset;
}) {
  const [preset, setPreset] = useState<AnalyticsPeriodPreset>(initialPreset);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [funnel, setFunnel] = useState<string>(ALL_FUNNELS);
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
      try {
        const res = await fetch(
          `/api/growth/conversion-analytics?${params.toString()}`,
          { method: "GET", credentials: "same-origin" }
        );
        const body = (await res.json()) as
          | ({ ok: true } & ConversionAnalyticsResponse)
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
      } catch {
        setState({
          status: "error",
          message: GROWTH_ANALITICA_ERROR_DESCRIPTION,
        });
      }
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

  const funnelOptions = useMemo(() => {
    if (!data) return [] as Array<{ key: string; label: string }>;
    const map = new Map<string, string>();
    for (const f of data.stock.byFunnel) map.set(f.funnelKey, f.funnelLabel);
    for (const f of data.movement.byFunnel) map.set(f.funnelKey, f.funnelLabel);
    for (const f of data.dwell.byFunnel) map.set(f.funnelKey, f.funnelLabel);
    for (const c of data.cohorts.byFunnel) map.set(c.key, c.label);
    for (const row of data.losses.byExitStage) {
      const key = funnelKeyOfExit(row.key);
      if (!map.has(key)) map.set(key, key);
    }
    return [...map.entries()]
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [data]);

  const selectedFunnel =
    funnel === ALL_FUNNELS || funnelOptions.some((o) => o.key === funnel)
      ? funnel
      : ALL_FUNNELS;
  const pick = <T extends { funnelKey: string }>(rows: T[]): T[] =>
    selectedFunnel === ALL_FUNNELS
      ? rows
      : rows.filter((r) => r.funnelKey === selectedFunnel);

  const labels = GROWTH_CONVERSION_ANALITICA_SECTION_LABELS;

  const view = data
    ? (() => {
        const stockTotal = data.stock.byFunnel.reduce(
          (n, f) => n + f.stages.reduce((m, s) => m + s.count, 0),
          0
        );
        const movementRows = data.movement.byFunnel.reduce(
          (n, f) => n + f.stages.length,
          0
        );
        const closuresTotal =
          data.closures.won + data.closures.lost + data.closures.handedOff;
        const qualityEntries = (
          Object.keys(
            GROWTH_CONVERSION_ANALITICA_QUALITY_LABELS
          ) as Array<keyof typeof GROWTH_CONVERSION_ANALITICA_QUALITY_LABELS>
        )
          .map((key) => ({
            key,
            label: GROWTH_CONVERSION_ANALITICA_QUALITY_LABELS[key],
            count: data.quality[key],
          }))
          .filter((row) => row.count > 0);
        const noOpportunities =
          data.captacion.total === 0 &&
          stockTotal === 0 &&
          movementRows === 0 &&
          closuresTotal === 0 &&
          data.cohorts.byFunnel.length === 0 &&
          qualityEntries.length === 0;
        return { stockTotal, qualityEntries, noOpportunities };
      })()
    : null;

  const funnelSelector =
    data && funnelOptions.length > 0 ? (
      <label className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">{GROWTH_CONVERSION_ANALITICA_FUNNEL_LABEL}</span>
        <select
          value={selectedFunnel}
          onChange={(e) => setFunnel(e.target.value)}
          className="rounded-[10px] border border-[var(--admin-border-subtle)] bg-white px-3 py-2 text-sm text-foreground"
          data-conversion-funnel-select
        >
          <option value={ALL_FUNNELS}>{GROWTH_CONVERSION_ANALITICA_FUNNEL_ALL}</option>
          {funnelOptions.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    ) : null;

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: GROWTH_CONVERSION_ANALITICA_PAGE_TITLE },
      ]}
      title={GROWTH_CONVERSION_ANALITICA_PAGE_TITLE}
      description={GROWTH_CONVERSION_ANALITICA_PAGE_DESCRIPTION}
    >
      <div
        className="mx-auto flex w-full max-w-4xl flex-col gap-8"
        data-conversion-analitica
      >
        <PeriodSelector
          preset={preset}
          customFrom={customFrom}
          customTo={customTo}
          pending={pending}
          onPresetChange={setPreset}
          onCustomFrom={setCustomFrom}
          onCustomTo={setCustomTo}
          onApplyCustom={onApplyCustom}
        />

        {state.status === "error" ? (
          <div data-conversion-analitica-error>
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

        {showSkeleton && !data ? <ConversionSkeleton /> : null}

        {data && view?.noOpportunities ? (
          <EmptyState
            title={SECTION_EMPTY}
            description={GROWTH_CONVERSION_ANALITICA_EMPTY_DESCRIPTION}
            className="border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] px-6 py-10 shadow-none"
          />
        ) : null}

        {data && view && !view.noOpportunities ? (
          <div
            className={cn(
              "flex flex-col gap-12 sm:gap-14",
              pending ? "opacity-70 transition-opacity" : undefined
            )}
            data-conversion-analitica-content
            aria-busy={pending || undefined}
          >
            {funnelSelector}

            {/* 1. Captación */}
            <StorySection
              id="captacion"
              eyebrow={labels.captacion.eyebrow}
              question={labels.captacion.question}
            >
              <Denominator>{CONVERSION_DENOMINATORS.captacion}</Denominator>
              {data.captacion.total === 0 ? (
                <EmptyLine />
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 gap-6">
                    <HeroMetric
                      label="Oportunidades abiertas en el período"
                      value={data.captacion.total}
                    />
                    <HeroMetric
                      label="Archivadas después"
                      value={data.captacion.archivedNow}
                      tone="attention"
                    />
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Por embudo</p>
                    <ProportionBars
                      rows={data.captacion.byFunnel}
                      empty={SECTION_EMPTY}
                    />
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Por origen</p>
                    <ProportionBars
                      rows={data.captacion.byOrigin}
                      empty={SECTION_EMPTY}
                    />
                  </div>
                </div>
              )}
            </StorySection>

            {/* 2. Stock */}
            <StorySection
              id="stock"
              eyebrow={labels.stock.eyebrow}
              question={labels.stock.question}
            >
              <Denominator>{CONVERSION_DENOMINATORS.stock}</Denominator>
              {view.stockTotal === 0 ? (
                <p className="text-sm text-muted">No hay oportunidades abiertas ahora.</p>
              ) : (
                <div className="flex flex-col gap-6">
                  {pick(data.stock.byFunnel).map((f) => (
                    <div key={f.funnelKey} className="space-y-3">
                      <FunnelHeading label={f.funnelLabel} />
                      <ProportionBars rows={f.stages} empty={SECTION_EMPTY} />
                    </div>
                  ))}
                </div>
              )}
            </StorySection>

            {/* 3. Movimiento */}
            <StorySection
              id="movimiento"
              eyebrow={labels.movimiento.eyebrow}
              question={labels.movimiento.question}
            >
              {pick(data.movement.byFunnel).length === 0 ? (
                <EmptyLine />
              ) : (
                <div className="flex flex-col gap-6">
                  {pick(data.movement.byFunnel).map((f) => (
                    <div key={f.funnelKey} className="space-y-3">
                      <FunnelHeading label={f.funnelLabel} />
                      <ul className="flex flex-col gap-3" role="list">
                        {f.stages.map((s) => (
                          <li
                            key={s.key}
                            className={cn(aek.surfaceMuted, "px-3.5 py-3")}
                          >
                            <p className="text-sm font-medium text-foreground">
                              {s.label}{" "}
                              <span className="text-muted">
                                · {formatCount(s.opportunities)} salieron
                              </span>
                            </p>
                            <p className="mt-1 text-sm tabular-nums text-muted">
                              Avanzaron {formatCount(s.advance)} · Perdidas{" "}
                              {formatCount(s.lost)} · Ganadas {formatCount(s.won)} ·
                              Traspasadas {formatCount(s.handedOff)} · Archivadas{" "}
                              {formatCount(s.archived)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {data.movement.ilegible > 0 ? (
                    <p className="text-sm text-muted">
                      Movimientos que no se pudieron leer:{" "}
                      {formatCount(data.movement.ilegible)}.
                    </p>
                  ) : null}
                </div>
              )}
            </StorySection>

            {/* 4. Pérdidas */}
            <StorySection
              id="perdidas"
              eyebrow={labels.perdidas.eyebrow}
              question={labels.perdidas.question}
            >
              {data.losses.total === 0 ? (
                <EmptyLine />
              ) : (
                <div className="flex flex-col gap-5">
                  <HeroMetric
                    label="Perdidas en el período"
                    value={data.losses.total}
                    tone="danger"
                  />
                  <LossExitStages
                    rows={data.losses.byExitStage}
                    funnelLabels={new Map(funnelOptions.map((option) => [option.key, option.label]))}
                    selectedFunnel={selectedFunnel}
                  />
                </div>
              )}
              <Denominator>{CONVERSION_LOSS_REASONS_NOTE}</Denominator>
            </StorySection>

            {/* 5. Permanencia */}
            <StorySection
              id="permanencia"
              eyebrow={labels.permanencia.eyebrow}
              question={labels.permanencia.question}
            >
              {pick(data.dwell.byFunnel).length === 0 ? (
                <EmptyLine />
              ) : (
                <div className="flex flex-col gap-6">
                  {pick(data.dwell.byFunnel).map((f) => (
                    <div key={f.funnelKey} className="space-y-3">
                      <FunnelHeading label={f.funnelLabel} />
                      <ul className="flex flex-col gap-2" role="list">
                        {f.stages.map((s) => (
                          <li
                            key={s.key}
                            className="flex items-baseline justify-between gap-3 text-sm"
                          >
                            <span className="min-w-0 truncate font-medium text-foreground">
                              {s.label}
                            </span>
                            <span className="shrink-0 tabular-nums text-muted">
                              {formatDays(s.medianMs)} · {formatCount(s.count)}{" "}
                              {s.count === 1 ? "salida" : "salidas"}
                              {s.inProgress > 0
                                ? ` · ${formatCount(s.inProgress)} en curso`
                                : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2 border-t border-[var(--admin-border-subtle)] pt-5">
                <p className="text-sm font-medium text-foreground">
                  Ciclo hasta el cierre (mediana)
                </p>
                <ul className="flex flex-col gap-1 text-sm" role="list">
                  <li className="flex justify-between gap-3">
                    <span className="text-foreground">Ganadas</span>
                    <span className="tabular-nums text-muted">
                      {formatDays(data.cycle.won.medianMs)} ·{" "}
                      {formatCount(data.cycle.won.count)}
                    </span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span className="text-foreground">Perdidas</span>
                    <span className="tabular-nums text-muted">
                      {formatDays(data.cycle.lost.medianMs)} ·{" "}
                      {formatCount(data.cycle.lost.count)}
                    </span>
                  </li>
                </ul>
              </div>
            </StorySection>

            {/* 6. Cohortes */}
            <StorySection
              id="cohortes"
              eyebrow={labels.cohortes.eyebrow}
              question={labels.cohortes.question}
            >
              <Denominator>{CONVERSION_DENOMINATORS.cohorte}</Denominator>
              {data.cohorts.byFunnel.length === 0 ? (
                <EmptyLine />
              ) : (
                <div className="flex flex-col gap-6">
                  <CohortTable
                    title="Por embudo"
                    rows={
                      selectedFunnel === ALL_FUNNELS
                        ? data.cohorts.byFunnel
                        : data.cohorts.byFunnel.filter(
                            (r) => r.key === selectedFunnel
                          )
                    }
                  />
                  <CohortTable
                    title="Por campaña"
                    rows={data.cohorts.byCampaign}
                  />
                  <CohortTable title="Por origen" rows={data.cohorts.bySource} />
                  <Denominator>{CONVERSION_RATE_NOTE}</Denominator>
                </div>
              )}
            </StorySection>

            {/* 7. Responsables */}
            <StorySection
              id="responsables"
              eyebrow={labels.responsables.eyebrow}
              question={labels.responsables.question}
            >
              {data.owners.length === 0 ? (
                <EmptyLine />
              ) : (
                <ul className="flex flex-col gap-3" role="list">
                  {data.owners.map((o) => (
                    <li
                      key={o.userId ?? o.label}
                      className={cn(aek.surfaceMuted, "px-3.5 py-3")}
                    >
                      <p className="text-sm font-medium text-foreground">{o.label}</p>
                      <p className="mt-1 text-sm tabular-nums text-muted">
                        Abiertas {formatCount(o.open)} · Ganadas {formatCount(o.won)} ·
                        Perdidas {formatCount(o.lost)} · Traspasadas{" "}
                        {formatCount(o.handedOff)} · Ciclo ganadas{" "}
                        {formatDays(o.wonCycleMedianMs)} ({formatCount(o.wonCycleCount)})
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </StorySection>

            {/* 8. Calidad */}
            <StorySection
              id="calidad"
              eyebrow={labels.calidad.eyebrow}
              question={labels.calidad.question}
            >
              {view.qualityEntries.length === 0 ? (
                <p className="text-sm text-muted">Sin observaciones.</p>
              ) : (
                <ul className="flex flex-col gap-2 text-sm" role="list">
                  {view.qualityEntries.map((q) => (
                    <li key={q.key} className="flex justify-between gap-3">
                      <span className="text-foreground">{q.label}</span>
                      <span className="tabular-nums text-muted">
                        {formatCount(q.count)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </StorySection>
          </div>
        ) : null}
      </div>
    </AdminModulePage>
  );
}
