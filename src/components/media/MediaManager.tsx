"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CmsMediaAsset, MediaFolder } from "@/types/media";
import type { HeroMediaContext } from "@/lib/cms/media-hero";
import { mediaBulk, mediaDuplicate } from "@/lib/media/client-api";
import { Modal } from "@/components/ui/modal";
import { MediaBreadcrumb } from "./MediaBreadcrumb";
import { MediaBulkBar } from "./MediaBulkBar";
import { MediaContextBanner } from "./MediaContextBanner";
import { MediaDetails } from "./MediaDetails";
import { MediaDropzone, type MediaDropzoneHandle } from "./MediaDropzone";
import { MediaEmptyState } from "./MediaEmptyState";
import type { MediaFilterState } from "./MediaFilters";
import { MediaFilters } from "./MediaFilters";
import { MediaFolderTree } from "./MediaFolderTree";
import { MediaGrid } from "./MediaGrid";
import { MediaListTable } from "./MediaListTable";
import {
  MediaQuickFilters,
  quickFilterToState,
  stateToQuickFilter,
  type MediaQuickFilterId,
} from "./MediaQuickFilters";
import { MediaSearch } from "./MediaSearch";
import { MediaToolbar } from "./MediaToolbar";

export type MediaPickerContext = "default" | HeroMediaContext;

export interface MediaManagerProps {
  tenant: string;
  defaultFolder?: string;
  pickMode?: boolean;
  allowedCategory?: string;
  onPick?: (asset: CmsMediaAsset) => void;
  allowUploadInPicker?: boolean;
  pickerContext?: MediaPickerContext;
}

export function MediaManager({
  tenant,
  defaultFolder,
  pickMode,
  allowedCategory,
  onPick,
  allowUploadInPicker = true,
  pickerContext = "default",
}: MediaManagerProps) {
  const isHeroPicker =
    pickerContext === "hero-desktop" ||
    pickerContext === "hero-mobile" ||
    defaultFolder === "Hero";

  const lockedFolder = isHeroPicker ? "Hero" : pickMode && defaultFolder ? defaultFolder : defaultFolder;

  const [items, setItems] = useState<CmsMediaAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<MediaFilterState>(() => ({
    folder: lockedFolder,
    sort: "date",
    direction: "desc",
    visibility: "active",
    ...(isHeroPicker ? { folder: "Hero" } : {}),
  }));
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [detailAsset, setDetailAsset] = useState<CmsMediaAsset | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const dropzoneRef = useRef<MediaDropzoneHandle>(null);

  const effectiveFolder = isHeroPicker ? "Hero" : filters.folder ?? defaultFolder;
  const adminMode = !pickMode;
  const quickFilter = stateToQuickFilter(filters);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tenant,
        page: "1",
        limit: "48",
        sort: filters.sort ?? "date",
        direction: filters.direction ?? "desc",
        visibility: filters.visibility ?? "active",
      });
      if (effectiveFolder) params.set("folder", effectiveFolder);
      if (filters.category || allowedCategory) {
        params.set("category", filters.category ?? allowedCategory ?? "");
      }
      if (filters.tags) params.set("tags", filters.tags);
      if (filters.favorite) params.set("favorite", "true");
      if (filters.usageFilter) params.set("usageFilter", filters.usageFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/cms/media?${params}`);
      const data = await res.json();
      if (data.ok) {
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [tenant, filters, debouncedSearch, allowedCategory, effectiveFolder]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch remoto al cambiar filtros
    void load();
  }, [load]);

  const handleQuickFilter = (id: MediaQuickFilterId) => {
    const patch = quickFilterToState(id);
    setSelectedIds(new Set());
    setFilters((f) => ({
      ...f,
      category: patch.category,
      favorite: patch.favorite,
      usageFilter: patch.usageFilter,
      visibility: patch.visibility ?? "active",
    }));
  };

  const handleSelect = (asset: CmsMediaAsset) => {
    if (pickMode && onPick) {
      onPick(asset);
      return;
    }
    setSelectedId(asset._id);
    setDetailAsset(asset);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileDetailOpen(true);
    }
  };

  const toggleBulkSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runBulk = async (action: "trash" | "duplicate" | "activate" | "deactivate") => {
    const ids = [...selectedIds];
    if (!ids.length || !tenant?.trim()) return;
    setBulkLoading(true);
    try {
      const res = await mediaBulk({ tenant, ids, action });
      if (!res.ok) throw new Error(res.error ?? "Acción masiva fallida.");
      setSelectedIds(new Set());
      await load();
    } finally {
      setBulkLoading(false);
    }
  };

  const runBulkMove = async (folder: MediaFolder) => {
    const ids = [...selectedIds];
    if (!ids.length || !tenant?.trim()) return;
    setBulkLoading(true);
    try {
      const res = await mediaBulk({ tenant, ids, action: "move", folder });
      if (!res.ok) throw new Error(res.error ?? "No se pudo mover.");
      setSelectedIds(new Set());
      await load();
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSaveDetails = async (patch: Partial<CmsMediaAsset>) => {
    if (!detailAsset) return;
    const res = await fetch(`/api/cms/media/${detailAsset._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (data.ok && data.media) {
      setDetailAsset(data.media);
    }
    await load();
  };

  const handleDeleteAsset = async (id: string) => {
    const res = await fetch(`/api/cms/media/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!data.ok) {
      throw new Error(data.error ?? "No se pudo eliminar.");
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setDetailAsset(null);
    setMobileDetailOpen(false);
    await load();
  };

  const handleToggleFavorite = async (asset: CmsMediaAsset) => {
    await fetch(`/api/cms/media/${asset._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorite: !asset.favorite }),
    });
    await load();
  };

  const handleQuickDuplicate = async (asset: CmsMediaAsset) => {
    await mediaDuplicate(asset._id);
    await load();
  };

  const handleQuickTrash = async (asset: CmsMediaAsset) => {
    if (asset.usage?.length) return;
    await handleDeleteAsset(asset._id);
  };

  const handleUploadComplete = useCallback(
    (result: { media: CmsMediaAsset }) => {
      const { media } = result;
      setItems((prev) => {
        const without = prev.filter((item) => item._id !== media._id);
        return [media, ...without];
      });
      setTotal((prev) => Math.max(prev, 1));
      if (pickMode && onPick) {
        onPick(media);
      }
    },
    [pickMode, onPick]
  );

  const showUpload = adminMode || allowUploadInPicker;
  const cardVariant = adminMode || pickMode ? "rich" : "default";
  const isEmpty = items.length === 0 && !loading;
  const gridCols = pickMode
    ? "lg:grid-cols-[1fr]"
    : "lg:grid-cols-[200px_1fr_300px]";

  const detailsPanel = detailAsset ? (
    <MediaDetails
      key={`${detailAsset._id}-${detailAsset.updatedAt}`}
      asset={detailAsset}
      tenant={tenant}
      onSave={handleSaveDetails}
      onClose={() => {
        setDetailAsset(null);
        setMobileDetailOpen(false);
      }}
      onDelete={handleDeleteAsset}
      onRefresh={load}
    />
  ) : (
    <p className="text-sm text-muted">Selecciona un archivo para ver detalles.</p>
  );

  return (
    <div className={`media-manager grid gap-4 ${gridCols}`}>
      {adminMode ? (
        <aside className="hidden lg:block">
          <MediaFolderTree
            activeFolder={filters.folder}
            onSelect={(folder) => {
              setSelectedIds(new Set());
              setFilters((f) => ({ ...f, folder }));
            }}
          />
        </aside>
      ) : null}

      <div className="space-y-4 min-w-0">
        {adminMode ? <MediaBreadcrumb folder={effectiveFolder} tenant={tenant} /> : null}

        <MediaContextBanner pickerContext={pickerContext} defaultFolder={defaultFolder ?? effectiveFolder} />

        {!tenant?.trim() ? (
          <div className="rounded-lg border border-[var(--state-warning-border)] bg-[var(--state-warning-bg)] px-4 py-3 text-sm text-[var(--color-warning)]">
            Completa la <strong>identificación institucional</strong> en Institución → Configuración general
            antes de subir archivos.
          </div>
        ) : null}

        <MediaSearch value={searchInput} onChange={setSearchInput} />

        {adminMode ? (
          <MediaQuickFilters active={quickFilter} onChange={handleQuickFilter} />
        ) : null}

        <MediaFilters
          filters={filters}
          onChange={setFilters}
          showTagFilter={adminMode || isHeroPicker}
          showFavoriteFilter={false}
          lockFolder={Boolean(lockedFolder && (isHeroPicker || pickMode))}
        />

        <MediaToolbar
          view={view}
          onViewChange={setView}
          total={total}
          dropzoneRef={dropzoneRef}
          showUpload={showUpload}
        />

        {adminMode ? (
          <MediaBulkBar
            count={selectedIds.size}
            loading={bulkLoading}
            onTrash={() => void runBulk("trash")}
            onDuplicate={() => void runBulk("duplicate")}
            onActivate={() => void runBulk("activate")}
            onDeactivate={() => void runBulk("deactivate")}
            onMove={(folder) => void runBulkMove(folder)}
          />
        ) : null}

        {showUpload && isHeroPicker && isEmpty ? (
          <MediaDropzone
            ref={dropzoneRef}
            tenant={tenant}
            folder="Hero"
            onUploaded={load}
            onUploadComplete={handleUploadComplete}
            variant="hero-empty"
            heroMode
          />
        ) : null}

        {showUpload && (!isHeroPicker || !isEmpty) ? (
          <MediaDropzone
            ref={dropzoneRef}
            tenant={tenant}
            folder={effectiveFolder ?? defaultFolder}
            onUploaded={load}
            onUploadComplete={handleUploadComplete}
            variant={pickMode ? "compact" : "default"}
            heroMode={isHeroPicker}
          />
        ) : null}

        {!isEmpty && view === "list" ? (
          <MediaListTable
            items={items}
            selectedIds={selectedIds}
            onToggleSelect={toggleBulkSelect}
            onSelect={handleSelect}
            onToggleFavorite={adminMode ? handleToggleFavorite : undefined}
            onQuickDuplicate={adminMode ? handleQuickDuplicate : undefined}
            onQuickTrash={adminMode ? handleQuickTrash : undefined}
            pickMode={pickMode}
          />
        ) : null}

        {!isEmpty && view === "grid" ? (
          <MediaGrid
            items={items}
            view="grid"
            selectedId={selectedId}
            onSelect={handleSelect}
            onOpen={handleSelect}
            onToggleFavorite={adminMode || isHeroPicker ? handleToggleFavorite : undefined}
            cardVariant={cardVariant}
          />
        ) : null}

        {loading ? (
          <p className="text-center text-xs text-muted" role="status">
            Cargando biblioteca…
          </p>
        ) : null}

        {!isHeroPicker && isEmpty && showUpload ? (
          <MediaEmptyState
            folder={effectiveFolder}
            onUpload={() => dropzoneRef.current?.openFileDialog()}
          />
        ) : null}
      </div>

      {adminMode ? (
        <aside className="media-details-panel hidden rounded-lg border border-border p-4 lg:block">
          {detailsPanel}
        </aside>
      ) : null}

      {adminMode ? (
        <Modal
          open={mobileDetailOpen && Boolean(detailAsset)}
          onClose={() => setMobileDetailOpen(false)}
          title="Detalle del archivo"
          size="full"
        >
          <div className="max-h-[80vh] overflow-y-auto">{detailsPanel}</div>
        </Modal>
      ) : null}
    </div>
  );
}

export const MediaLibraryCore = MediaManager;
