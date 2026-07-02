"use client";

import { formatMediaSize } from "@/lib/cms/media-hero";
import type { MediaOptimizationSummary } from "@/lib/cms/media-optimization";

interface MediaOptimizationInfoProps {
  summary: MediaOptimizationSummary | null;
  className?: string;
}

export function MediaOptimizationInfo({ summary, className }: MediaOptimizationInfoProps) {
  if (!summary) return null;

  const saved =
    summary.originalBytes > summary.optimizedBytes
      ? summary.originalBytes - summary.optimizedBytes
      : 0;

  return (
    <div
      className={`rounded-md border border-success/30 bg-success/10/80 p-3 text-xs dark:border-success/40 dark:bg-success/15 ${className ?? ""}`}
      role="status"
    >
      <p className="font-semibold text-success dark:text-success">Optimización aplicada</p>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-muted">
        <dt>Original</dt>
        <dd className="text-foreground">{formatMediaSize(summary.originalBytes)}</dd>
        <dt>Optimizada</dt>
        <dd className="text-foreground">{formatMediaSize(summary.optimizedBytes)}</dd>
        {saved > 0 ? (
          <>
            <dt>Ahorro</dt>
            <dd className="text-foreground">{formatMediaSize(saved)}</dd>
          </>
        ) : null}
        <dt>Formato</dt>
        <dd className="text-foreground">
          {summary.format}
          {summary.webpGenerated ? " · WEBP generado" : ""}
        </dd>
      </dl>
      {summary.derivatives.length ? (
        <p className="mt-2 text-muted">
          <span className="font-medium text-foreground">Derivados:</span>{" "}
          {summary.derivatives.join(", ")}
        </p>
      ) : null}
    </div>
  );
}

export type { MediaOptimizationSummary };
