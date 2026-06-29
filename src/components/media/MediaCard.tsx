"use client";

import type { CmsMediaAsset } from "@/types/media";
import { MediaPreview } from "./MediaPreview";

interface MediaCardProps {
  asset: CmsMediaAsset;
  selected?: boolean;
  onSelect?: (asset: CmsMediaAsset) => void;
  onOpen?: (asset: CmsMediaAsset) => void;
  view?: "grid" | "list";
}

export function MediaCard({ asset, selected, onSelect, onOpen, view = "grid" }: MediaCardProps) {
  if (view === "list") {
    return (
      <button
        type="button"
        onClick={() => (onSelect ? onSelect(asset) : onOpen?.(asset))}
        className={`flex w-full items-center gap-4 rounded-lg border px-4 py-3 text-left transition-colors ${
          selected ? "border-secondary bg-secondary/5" : "border-border hover:bg-muted/30"
        }`}
      >
        <MediaPreview asset={asset} className="h-12 w-12 rounded object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{asset.originalName}</p>
          <p className="text-xs text-muted">
            {asset.folder} · {(asset.size / 1024).toFixed(0)} KB
          </p>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => (onSelect ? onSelect(asset) : onOpen?.(asset))}
      className={`group overflow-hidden rounded-lg border text-left transition-shadow hover:shadow-md ${
        selected ? "border-secondary ring-2 ring-secondary/30" : "border-border"
      }`}
    >
      <MediaPreview asset={asset} className="aspect-square w-full object-cover" />
      <div className="p-2">
        <p className="truncate text-xs font-medium text-foreground">{asset.originalName}</p>
        <p className="truncate text-[10px] text-muted">{asset.folder}</p>
      </div>
    </button>
  );
}
