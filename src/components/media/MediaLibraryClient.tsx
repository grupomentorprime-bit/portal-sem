"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { CmsMediaAsset } from "@/types/media";
import { MediaBreadcrumb } from "./MediaBreadcrumb";
import { MediaDetails } from "./MediaDetails";
import { MediaDropzone } from "./MediaDropzone";
import type { MediaFilterState } from "./MediaFilters";
import { MediaFilters } from "./MediaFilters";
import { MediaFolderTree } from "./MediaFolderTree";
import { MediaGrid } from "./MediaGrid";
import { MediaSearch } from "./MediaSearch";
import { MediaToolbar } from "./MediaToolbar";

interface MediaLibraryCoreProps {
  tenant: string;
  defaultFolder?: string;
  pickMode?: boolean;
  allowedCategory?: string;
  onPick?: (asset: CmsMediaAsset) => void;
}

export function MediaLibraryCore({
  tenant,
  defaultFolder,
  pickMode,
  allowedCategory,
  onPick,
}: MediaLibraryCoreProps) {
  const [items, setItems] = useState<CmsMediaAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<MediaFilterState>({
    folder: defaultFolder,
    sort: "date",
    direction: "desc",
    visibility: "active",
  });
  const [search, setSearch] = useState("");
  const [detailAsset, setDetailAsset] = useState<CmsMediaAsset | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>();

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
      if (filters.folder) params.set("folder", filters.folder);
      if (filters.category || allowedCategory) {
        params.set("category", filters.category ?? allowedCategory ?? "");
      }
      if (search) params.set("search", search);

      const res = await fetch(`/api/cms/media?${params}`);
      const data = await res.json();
      if (data.ok) {
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [tenant, filters, search, allowedCategory]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
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
        if (filters.folder) params.set("folder", filters.folder);
        if (filters.category || allowedCategory) {
          params.set("category", filters.category ?? allowedCategory ?? "");
        }
        if (search) params.set("search", search);

        const res = await fetch(`/api/cms/media?${params}`);
        const data = await res.json();
        if (!cancelled && data.ok) {
          setItems(data.items ?? []);
          setTotal(data.total ?? 0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenant, filters, search, allowedCategory]);

  const handleSelect = (asset: CmsMediaAsset) => {
    if (pickMode && onPick) {
      onPick(asset);
      return;
    }
    setSelectedId(asset._id);
    setDetailAsset(asset);
  };

  const handleSaveDetails = async (patch: Partial<CmsMediaAsset>) => {
    if (!detailAsset) return;
    await fetch(`/api/cms/media/${detailAsset._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await load();
    setDetailAsset(null);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[200px_1fr_280px]">
      <aside className="hidden lg:block">
        <MediaFolderTree
          activeFolder={filters.folder}
          onSelect={(folder) => setFilters((f) => ({ ...f, folder }))}
        />
      </aside>

      <div className="space-y-4">
        <MediaBreadcrumb folder={filters.folder} tenant={tenant} />
        <MediaSearch value={search} onChange={setSearch} />
        <MediaFilters filters={filters} onChange={setFilters} />
        <Button type="button" size="sm" onClick={load} disabled={loading}>
          {loading ? "Cargando…" : "Buscar"}
        </Button>
        <MediaToolbar view={view} onViewChange={setView} total={total} />
        {!pickMode ? (
          <MediaDropzone tenant={tenant} folder={filters.folder ?? defaultFolder} onUploaded={load} />
        ) : null}
        <MediaGrid
          items={items}
          view={view}
          selectedId={selectedId}
          onSelect={handleSelect}
          onOpen={handleSelect}
        />
      </div>

      {!pickMode ? (
        <aside className="rounded-lg border border-border p-4">
          {detailAsset ? (
            <MediaDetails
              asset={detailAsset}
              onSave={handleSaveDetails}
              onClose={() => setDetailAsset(null)}
            />
          ) : (
            <p className="text-sm text-muted">Selecciona un archivo para ver detalles.</p>
          )}
        </aside>
      ) : null}
    </div>
  );
}

interface MediaLibraryClientProps {
  tenant: string;
}

export function MediaLibraryClient({ tenant }: MediaLibraryClientProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">CMS</p>
            <h1 className="text-xl font-semibold">Biblioteca de medios</h1>
            <p className="text-sm text-zinc-500">Tenant: {tenant}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/content">
              <Button variant="secondary">Contenido</Button>
            </Link>
            <Link href="/admin/config">
              <Button variant="secondary">Configuración</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <MediaLibraryCore tenant={tenant} />
      </main>
    </div>
  );
}
