"use client";

import { useRef, useState } from "react";
import {
  Copy,
  Download,
  RefreshCw,
  Star,
  Trash2,
} from "lucide-react";
import { Button, Input, Label, Textarea } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import type { CmsMediaAsset } from "@/types/media";
import { MEDIA_FOLDERS } from "@/types/media";
import {
  formatMediaDate,
  formatMediaDimensions,
  formatMediaSize,
} from "@/lib/cms/media-hero";
import { buildOptimizationSummary } from "@/lib/cms/media-optimization";
import { mediaDuplicate } from "@/lib/media/client-api";
import { MediaOptimizationInfo } from "./MediaOptimizationInfo";
import { MediaPreview } from "./MediaPreview";
import { MediaTagsEditor } from "./MediaTagsEditor";
import { MediaUsageList } from "./MediaUsageList";

interface MediaDetailsProps {
  asset: CmsMediaAsset;
  tenant: string;
  onSave: (patch: Partial<CmsMediaAsset>) => Promise<void>;
  onClose: () => void;
  onDelete?: (id: string) => Promise<void>;
  onRefresh?: () => void;
  mobile?: boolean;
}

export function MediaDetails({
  asset,
  tenant,
  onSave,
  onClose,
  onDelete,
  onRefresh,
  mobile,
}: MediaDetailsProps) {
  const [tags, setTags] = useState(() => asset.tags);
  const [favorite, setFavorite] = useState(() => Boolean(asset.favorite));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [replaceError, setReplaceError] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const assetKey = `${asset._id}-${asset.updatedAt}`;

  const inUse = (asset.usage?.length ?? 0) > 0;
  const statusLabel =
    asset.visibility === "trash"
      ? "Papelera"
      : asset.status === "archived"
        ? "Inactivo"
        : "Activo";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await onSave({
        originalName: String(fd.get("originalName") ?? asset.originalName).trim(),
        alt: String(fd.get("alt") ?? ""),
        caption: String(fd.get("caption") ?? ""),
        credits: String(fd.get("credits") ?? ""),
        folder: String(fd.get("folder") ?? asset.folder) as CmsMediaAsset["folder"],
        tags,
        favorite,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDuplicate = async () => {
    setBusy(true);
    try {
      const res = await mediaDuplicate(asset._id);
      if (!res.ok) throw new Error(res.error);
      onRefresh?.();
    } finally {
      setBusy(false);
    }
  };

  const handleReplace = async (file: File) => {
    setReplaceError(null);
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("tenant", tenant);
      const res = await fetch(`/api/cms/media/${asset._id}/replace`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "No se pudo reemplazar.");
      onRefresh?.();
    } catch (err) {
      setReplaceError(err instanceof Error ? err.message : "Error al reemplazar.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || inUse) return;
    setBusy(true);
    try {
      await onDelete(asset._id);
      setConfirmDelete(false);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const optimization = buildOptimizationSummary(asset);

  return (
    <div key={assetKey} className={`media-details space-y-4 ${mobile ? "pb-4" : ""}`}>
      <MediaPreview
        asset={asset}
        className="mx-auto h-48 w-full max-w-sm rounded-lg object-contain"
      />

      <div className="grid grid-cols-2 gap-2 text-xs text-muted">
        <div>
          <span className="font-medium text-foreground">Resolución</span>
          <p>{formatMediaDimensions(asset.width, asset.height)}</p>
        </div>
        <div>
          <span className="font-medium text-foreground">Peso</span>
          <p>{formatMediaSize(asset.size)}</p>
        </div>
        <div>
          <span className="font-medium text-foreground">Formato</span>
          <p>{asset.extension.toUpperCase()} · {asset.mimeType}</p>
        </div>
        <div>
          <span className="font-medium text-foreground">Fecha</span>
          <p>{formatMediaDate(asset.createdAt)}</p>
        </div>
        <div>
          <span className="font-medium text-foreground">Estado</span>
          <p>{statusLabel}</p>
        </div>
        <div>
          <span className="font-medium text-foreground">Carpeta</span>
          <p>{asset.folder}</p>
        </div>
      </div>

      {optimization ? <MediaOptimizationInfo summary={optimization} /> : null}

      <form key={assetKey} onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="media-name">Nombre</Label>
          <Input
            id="media-name"
            name="originalName"
            defaultValue={asset.originalName}
            required
          />
        </div>
        <div>
          <Label htmlFor="media-alt">Texto alternativo</Label>
          <Input id="media-alt" name="alt" defaultValue={asset.alt} />
        </div>
        <div>
          <Label htmlFor="media-caption">Descripción</Label>
          <Textarea id="media-caption" name="caption" defaultValue={asset.caption} rows={2} />
        </div>
        <div>
          <Label htmlFor="media-credits">Créditos</Label>
          <Input id="media-credits" name="credits" defaultValue={asset.credits} />
        </div>
        <div>
          <Label htmlFor="media-folder">Carpeta</Label>
          <select
            id="media-folder"
            name="folder"
            defaultValue={asset.folder}
            className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary"
          >
            {MEDIA_FOLDERS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        <MediaTagsEditor key={assetKey} tags={tags} onChange={setTags} />

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <button
            type="button"
            aria-label={favorite ? "Quitar de favoritos" : "Marcar como favorito"}
            className="text-[var(--color-warning)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary"
            onClick={() => setFavorite((f) => !f)}
          >
            <Star size={18} fill={favorite ? "currentColor" : "none"} />
          </button>
          <span>Favorito</span>
        </label>

        <div>
          <Label className="text-xs">Dónde se utiliza</Label>
          <MediaUsageList asset={asset} />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          <Button type="submit" size="sm" loading={busy}>
            Guardar
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </form>

      <div className="space-y-2 border-t border-border pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Acciones</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" loading={busy} onClick={handleDuplicate}>
            <Copy size={14} className="mr-1" aria-hidden />
            Duplicar
          </Button>
          <input
            ref={replaceInputRef}
            type="file"
            className="hidden"
            accept={asset.mimeType.startsWith("image/") ? "image/*" : "*/*"}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleReplace(file);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={busy}
            onClick={() => replaceInputRef.current?.click()}
          >
            <RefreshCw size={14} className="mr-1" aria-hidden />
            Reemplazar
          </Button>
          <a
            href={asset.url}
            download={asset.originalName}
            className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary"
            aria-label="Descargar archivo"
          >
            <Download size={14} className="mr-1" aria-hidden />
            Descargar
          </a>
          {onDelete && !inUse ? (
            <Button type="button" variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={14} className="mr-1" aria-hidden />
              Papelera
            </Button>
          ) : null}
        </div>
        {replaceError ? <p className="text-xs text-[var(--color-danger)]">{replaceError}</p> : null}
        {inUse ? (
          <p className="text-xs text-[var(--color-warning)]">
            No se puede enviar a papelera mientras tenga referencias activas.
          </p>
        ) : null}
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Enviar a papelera"
        size="sm"
      >
        <div className="space-y-4">
          {inUse ? (
            <>
              <div className="rounded-md border border-[var(--state-warning-border)] bg-[var(--state-warning-bg)] p-3 text-sm dark:border-[var(--state-warning-border)] dark:bg-[var(--state-warning-bg)]">
                <p className="font-medium">Esta imagen está siendo utilizada en:</p>
                <MediaUsageList asset={asset} compact />
                <p className="mt-3 font-medium">
                  No se puede eliminar mientras tenga referencias activas.
                </p>
              </div>
              <div className="flex justify-end">
                <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancelar
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">
                ¿Enviar &quot;{asset.originalName}&quot; a la papelera?
              </p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancelar
                </Button>
                <Button type="button" variant="danger" size="sm" loading={busy} onClick={handleDelete}>
                  Enviar a papelera
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
