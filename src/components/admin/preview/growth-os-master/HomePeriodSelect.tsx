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
    <label className="relative inline-flex items-center text-sm text-[#344054]">
      <span className="sr-only">Período</span>
      <Calendar
        className="pointer-events-none absolute left-3 h-4 w-4 text-[#667085]"
        aria-hidden
      />
      <select
        value={HOME_PRESETS.includes(preset) ? preset : "last_30d"}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
        data-home-period
        className={cn(
          "h-10 min-w-[12.25rem] cursor-pointer appearance-none rounded-[12px] border border-[#E4E7EC] bg-white",
          "bg-[length:12px] bg-[right_0.85rem_center] bg-no-repeat pl-9 pr-9 text-sm font-medium text-[#344054]",
          "shadow-[0_1px_2px_rgba(16,24,40,0.05)] outline-none transition",
          "hover:border-[#D0D5DD]",
          "focus-visible:ring-2 focus-visible:ring-[var(--growth-os-primary)]/25",
          pending && "opacity-70"
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236B7280' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
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
