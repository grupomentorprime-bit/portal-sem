"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Calendar } from "lucide-react";
import {
  GROWTH_ANALITICA_PERIOD_LABELS,
} from "@/lib/growth/labels";
import type { AnalyticsPeriodPreset } from "@/lib/growth/analytics-period";
import { cn } from "@/lib/utils";

const HOME_PRESETS: AnalyticsPeriodPreset[] = [
  "last_7d",
  "last_30d",
  "this_month",
  "previous_month",
];

export function HomePeriodSelect({
  preset,
}: {
  preset: AnalyticsPeriodPreset;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const onChange = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("preset", value);
    next.delete("from");
    next.delete("to");
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`);
    });
  };

  return (
    <label className="relative inline-flex items-center text-sm text-[var(--admin-home-label)]">
      <span className="sr-only">Período</span>
      <Calendar
        className="pointer-events-none absolute left-3 h-4 w-4 text-[var(--admin-home-slate)]"
        aria-hidden
      />
      <select
        value={HOME_PRESETS.includes(preset) ? preset : "last_30d"}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
        data-home-period
        className={cn(
          "h-10 min-w-[12.25rem] cursor-pointer appearance-none rounded-[12px] border border-[var(--admin-home-border-strong)] bg-white",
          "bg-[length:12px] bg-[right_0.85rem_center] bg-no-repeat pl-9 pr-9 text-sm font-medium text-[var(--admin-home-label)]",
          "shadow-[var(--admin-shadow-card)] outline-none transition",
          "hover:border-[var(--admin-home-line)]",
          "focus-visible:ring-2 focus-visible:ring-[var(--growth-os-primary)]/25",
          pending && "opacity-70"
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236b6580' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        }}
      >
        {HOME_PRESETS.map((p) => (
          <option key={p} value={p}>
            {GROWTH_ANALITICA_PERIOD_LABELS[p]}
          </option>
        ))}
      </select>
    </label>
  );
}
