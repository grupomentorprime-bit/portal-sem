/**
 * Piezas visuales compartidas por Analítica V1 y Analítica de conversión.
 * Solo presentación: sin fetch ni semántica de datos.
 */

"use client";

import type { ReactNode } from "react";
import { aek } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import {
  ANALYTICS_PERIOD_PRESETS,
  type AnalyticsPeriodPreset,
} from "@/lib/growth/analytics-period";
import { GROWTH_ANALITICA_PERIOD_LABELS } from "@/lib/growth/labels";
import { cn } from "@/lib/utils";

const PRESET_OPTIONS = ANALYTICS_PERIOD_PRESETS.filter(
  (p) => p !== "custom"
) as Exclude<AnalyticsPeriodPreset, "custom">[];

export function formatCount(n: number): string {
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

export function StorySection({
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

export function HeroMetric({
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

export function ProportionBars({
  rows,
  empty,
  barClassName,
}: {
  rows: Array<{ key?: string; label: string; count: number }>;
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
          <li key={row.key ?? row.label} className="space-y-1.5">
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

export function PeriodSelector({
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
