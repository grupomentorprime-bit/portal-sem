"use client";

import type { CmsMediaAsset } from "@/types/media";
import { MediaCard } from "./MediaCard";

interface MediaGridProps {
  items: CmsMediaAsset[];
  view?: "grid" | "list";
  selectedId?: string;
  onSelect?: (asset: CmsMediaAsset) => void;
  onOpen?: (asset: CmsMediaAsset) => void;
}

export function MediaGrid({
  items,
  view = "grid",
  selectedId,
  onSelect,
  onOpen,
}: MediaGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted">
        No hay archivos en esta carpeta.
      </div>
    );
  }

  if (view === "list") {
    return (
      <div className="space-y-2">
        {items.map((asset) => (
          <MediaCard
            key={asset._id}
            asset={asset}
            view="list"
            selected={selectedId === asset._id}
            onSelect={onSelect}
            onOpen={onOpen}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((asset) => (
        <MediaCard
          key={asset._id}
          asset={asset}
          selected={selectedId === asset._id}
          onSelect={onSelect}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
