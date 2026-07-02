"use client";

import { Star } from "lucide-react";
import type { CmsMediaAsset } from "@/types/media";
import {
  formatMediaDate,
  formatMediaDimensions,
  formatMediaSize,
} from "@/lib/cms/media-hero";
import { cn } from "@/lib/utils";
import { MediaPreview } from "./MediaPreview";
import { MediaUsage } from "./MediaUsage";

interface MediaCardProps {
  asset: CmsMediaAsset;
  selected?: boolean;
  onSelect?: (asset: CmsMediaAsset) => void;
  onOpen?: (asset: CmsMediaAsset) => void;
  onToggleFavorite?: (asset: CmsMediaAsset) => void;
  view?: "grid" | "list";
  variant?: "default" | "rich";
}

function StatusBadge({ asset }: { asset: CmsMediaAsset }) {
  const label = asset.visibility === "trash" ? "Papelera" : asset.status === "active" ? "Activo" : "Archivado";
  const tone =
    asset.visibility === "trash"
      ? "bg-[var(--state-danger-bg)] text-[var(--color-danger)]"
      : "bg-success/15 text-success dark:bg-success/20 dark:text-success";

  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", tone)}>
      {label}
    </span>
  );
}

function TagChips({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {tags.slice(0, 3).map((tag) => (
        <span
          key={tag}
          className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export function MediaCard({
  asset,
  selected,
  onSelect,
  onOpen,
  onToggleFavorite,
  view = "grid",
  variant = "default",
}: MediaCardProps) {
  const handleClick = () => (onSelect ? onSelect(asset) : onOpen?.(asset));
  const rich = variant === "rich";
  const usageCount = asset.usage?.length ?? 0;

  const cardClassName = (extra?: string) =>
    cn(
      "relative cursor-pointer text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40",
      extra
    );

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const favoriteButton = onToggleFavorite ? (
    <button
      type="button"
      aria-label={asset.favorite ? "Quitar de favoritos" : "Marcar como favorita"}
      className={cn(
        "absolute top-2 right-2 z-10 rounded-full bg-background/90 p-1.5 shadow-sm transition hover:scale-105",
        asset.favorite ? "text-[var(--color-warning)]" : "text-muted hover:text-[var(--color-warning)]"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onToggleFavorite(asset);
      }}
    >
      <Star size={14} fill={asset.favorite ? "currentColor" : "none"} strokeWidth={2} />
    </button>
  ) : null;

  if (view === "list") {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleCardKeyDown}
        className={cardClassName(
          cn(
            "flex w-full items-start gap-4 rounded-lg border px-4 py-3",
            selected ? "border-secondary bg-secondary/5" : "border-border hover:bg-muted/30",
            onToggleFavorite && "relative"
          )
        )}
      >
        <MediaPreview
          asset={asset}
          className={cn("rounded object-cover", rich ? "h-20 w-32" : "h-12 w-12")}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium text-foreground">{asset.originalName}</p>
            {rich ? <StatusBadge asset={asset} /> : null}
          </div>
          {rich ? (
            <>
              <p className="mt-1 text-xs text-muted">
                {formatMediaDimensions(asset.width, asset.height)} · {formatMediaSize(asset.size)} ·{" "}
                {formatMediaDate(asset.createdAt)}
              </p>
              <p className="text-xs text-muted">
                {asset.category} · {asset.folder}
              </p>
              <TagChips tags={asset.tags} />
              {usageCount > 0 ? (
                <p className="mt-1 text-xs font-medium text-secondary">
                  Usada en {usageCount} {usageCount === 1 ? "lugar" : "lugares"}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-xs text-muted">
              {asset.folder} · {formatMediaSize(asset.size)}
            </p>
          )}
        </div>
        {favoriteButton}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleCardKeyDown}
      className={cardClassName(
        cn(
          "group overflow-hidden rounded-lg border hover:shadow-md",
          selected ? "border-secondary ring-2 ring-secondary/30" : "border-border",
          rich && "flex flex-col"
        )
      )}
    >
      <div className="relative">
        <MediaPreview
          asset={asset}
          className={cn(
            "w-full object-cover",
            rich ? "aspect-[16/10]" : "aspect-square"
          )}
        />
        {favoriteButton}
      </div>
      <div className={cn("p-3", rich ? "space-y-1" : "p-2")}>
        <div className="flex items-start justify-between gap-2">
          <p className={cn("truncate font-medium text-foreground", rich ? "text-sm" : "text-xs")}>
            {asset.originalName}
          </p>
          {rich ? <StatusBadge asset={asset} /> : null}
        </div>
        {rich ? (
          <>
            <p className="text-xs text-muted">
              {formatMediaDimensions(asset.width, asset.height)} · {formatMediaSize(asset.size)} ·{" "}
              {asset.extension.toUpperCase()}
            </p>
            <p className="text-[11px] text-muted">
              {formatMediaDate(asset.createdAt)} · {asset.category}
            </p>
            <TagChips tags={asset.tags} />
            {usageCount > 0 ? (
              <details className="mt-2 text-[11px]">
                <summary className="cursor-pointer font-medium text-secondary">
                  Usada en {usageCount} {usageCount === 1 ? "lugar" : "lugares"}
                </summary>
                <div className="mt-1 pl-1">
                  <MediaUsage asset={asset} />
                </div>
              </details>
            ) : (
              <p className="text-[11px] text-muted">Sin uso actualmente</p>
            )}
          </>
        ) : (
          <p className="truncate text-[10px] text-muted">{asset.folder}</p>
        )}
      </div>
    </div>
  );
}
