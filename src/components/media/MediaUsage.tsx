"use client";

import type { CmsMediaAsset } from "@/types/media";

interface MediaUsageProps {
  asset: CmsMediaAsset;
}

export function MediaUsage({ asset }: MediaUsageProps) {
  const usage = asset.usage ?? [];
  if (usage.length === 0) {
    return <p className="text-xs text-muted">Sin referencias activas.</p>;
  }

  return (
    <ul className="space-y-1 text-xs text-muted">
      {usage.map((ref) => (
        <li key={`${ref.module}-${ref.entityId}-${ref.field}`}>
          {ref.label}
        </li>
      ))}
    </ul>
  );
}
