"use client";

import { Copy, Star, Trash2 } from "lucide-react";
import type { CmsMediaAsset } from "@/types/media";
import {
  formatMediaDate,
  formatMediaDimensions,
  formatMediaSize,
} from "@/lib/cms/media-hero";
import { cn } from "@/lib/utils";
import { MediaPreview } from "./MediaPreview";

interface MediaListTableProps {
  items: CmsMediaAsset[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelect: (asset: CmsMediaAsset) => void;
  onToggleFavorite?: (asset: CmsMediaAsset) => void;
  onQuickDuplicate?: (asset: CmsMediaAsset) => void;
  onQuickTrash?: (asset: CmsMediaAsset) => void;
  pickMode?: boolean;
}

export function MediaListTable({
  items,
  selectedIds,
  onToggleSelect,
  onSelect,
  onToggleFavorite,
  onQuickDuplicate,
  onQuickTrash,
  pickMode,
}: MediaListTableProps) {
  return (
    <div className="media-list-table overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted">
          <tr>
            {!pickMode ? (
              <th className="px-3 py-2.5 font-medium" scope="col">
                <span className="sr-only">Seleccionar</span>
              </th>
            ) : null}
            <th className="px-3 py-2.5 font-medium" scope="col">Imagen</th>
            <th className="px-3 py-2.5 font-medium" scope="col">Nombre</th>
            <th className="px-3 py-2.5 font-medium" scope="col">Carpeta</th>
            <th className="px-3 py-2.5 font-medium" scope="col">Resolución</th>
            <th className="px-3 py-2.5 font-medium" scope="col">Peso</th>
            <th className="px-3 py-2.5 font-medium" scope="col">Formato</th>
            <th className="px-3 py-2.5 font-medium" scope="col">Estado</th>
            <th className="px-3 py-2.5 font-medium" scope="col">Uso</th>
            <th className="px-3 py-2.5 font-medium" scope="col">Fecha</th>
            {!pickMode ? (
              <th className="px-3 py-2.5 font-medium" scope="col">
                <span className="sr-only">Acciones</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {items.map((asset) => {
            const selected = selectedIds.has(asset._id);
            const usageCount = asset.usage?.length ?? 0;
            const statusLabel =
              asset.visibility === "trash"
                ? "Papelera"
                : asset.status === "archived"
                  ? "Inactivo"
                  : "Activo";

            return (
              <tr
                key={asset._id}
                className={cn(
                  "border-b border-border transition hover:bg-muted/20",
                  selected && "bg-secondary/5"
                )}
              >
                {!pickMode ? (
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleSelect(asset._id)}
                      aria-label={`Seleccionar ${asset.originalName}`}
                      className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary"
                    />
                  </td>
                ) : null}
                <td className="px-3 py-2">
                  <button type="button" onClick={() => onSelect(asset)} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary">
                    <MediaPreview asset={asset} className="h-12 w-16 rounded object-cover" />
                  </button>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => onSelect(asset)}
                    className="max-w-[12rem] truncate font-medium text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary"
                  >
                    {asset.favorite ? "⭐ " : ""}
                    {asset.originalName}
                  </button>
                </td>
                <td className="px-3 py-2 text-muted">{asset.folder}</td>
                <td className="px-3 py-2 text-muted">
                  {formatMediaDimensions(asset.width, asset.height)}
                </td>
                <td className="px-3 py-2 text-muted">{formatMediaSize(asset.size)}</td>
                <td className="px-3 py-2 text-muted">{asset.extension.toUpperCase()}</td>
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                      statusLabel === "Activo"
                        ? "bg-success/15 text-success dark:bg-success/20 dark:text-success"
                        : "bg-muted text-muted"
                    )}
                  >
                    {statusLabel}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-muted">
                  {usageCount > 0 ? (
                    <span className="font-medium text-secondary">
                      {usageCount} {usageCount === 1 ? "lugar" : "lugares"}
                    </span>
                  ) : (
                    "Sin uso"
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-muted">{formatMediaDate(asset.createdAt)}</td>
                {!pickMode ? (
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {onToggleFavorite ? (
                        <button
                          type="button"
                          aria-label={asset.favorite ? "Quitar favorito" : "Marcar favorito"}
                          className="rounded p-1 text-muted hover:text-[var(--color-warning)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary"
                          onClick={() => onToggleFavorite(asset)}
                        >
                          <Star size={14} fill={asset.favorite ? "currentColor" : "none"} />
                        </button>
                      ) : null}
                      {onQuickDuplicate ? (
                        <button
                          type="button"
                          aria-label="Duplicar"
                          className="rounded p-1 text-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary"
                          onClick={() => onQuickDuplicate(asset)}
                        >
                          <Copy size={14} />
                        </button>
                      ) : null}
                      {onQuickTrash && usageCount === 0 ? (
                        <button
                          type="button"
                          aria-label="Enviar a papelera"
                          className="rounded p-1 text-muted hover:text-[var(--color-danger)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary"
                          onClick={() => onQuickTrash(asset)}
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
