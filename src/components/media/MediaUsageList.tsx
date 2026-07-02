"use client";

import type { CmsMediaAsset } from "@/types/media";

interface MediaUsageListProps {
  asset: CmsMediaAsset;
  compact?: boolean;
}

export function MediaUsageList({ asset, compact }: MediaUsageListProps) {
  const usage = asset.usage ?? [];

  if (usage.length === 0) {
    return (
      <p className={`text-muted ${compact ? "text-xs" : "text-sm"}`}>
        Sin uso actualmente
      </p>
    );
  }

  return (
    <div className={compact ? "text-xs" : "text-sm"}>
      <p className="font-medium text-foreground">Usado en:</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-muted">
        {usage.map((ref) => (
          <li key={`${ref.module}-${ref.entityId}-${ref.field}`}>{ref.label}</li>
        ))}
      </ul>
    </div>
  );
}

/** @deprecated Use MediaUsageList */
export function MediaUsage({ asset }: { asset: CmsMediaAsset }) {
  return <MediaUsageList asset={asset} compact />;
}
