"use client";

import type { CmsMediaAsset } from "@/types/media";
import { MediaCard } from "./MediaCard";
import { MediaHeroEmptyState } from "./MediaHeroEmptyState";

interface MediaGridProps {
  items: CmsMediaAsset[];
  view?: "grid" | "list";
  selectedId?: string;
  onSelect?: (asset: CmsMediaAsset) => void;
  onOpen?: (asset: CmsMediaAsset) => void;
  onToggleFavorite?: (asset: CmsMediaAsset) => void;
  cardVariant?: "default" | "rich";
  emptyState?: "default" | "hero";
  onEmptyUpload?: () => void;
}

export function MediaGrid({
  items,
  view = "grid",
  selectedId,
  onSelect,
  onOpen,
  onToggleFavorite,
  cardVariant = "default",
  emptyState = "default",
  onEmptyUpload,
}: MediaGridProps) {
  if (items.length === 0) {
    if (emptyState === "hero") {
      return <MediaHeroEmptyState onUploadClick={onEmptyUpload} />;
    }
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
            variant={cardVariant}
            selected={selectedId === asset._id}
            onSelect={onSelect}
            onOpen={onOpen}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="media-grid grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {items.map((asset) => (
        <MediaCard
          key={asset._id}
          asset={asset}
          variant={cardVariant}
          selected={selectedId === asset._id}
          onSelect={onSelect}
          onOpen={onOpen}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
