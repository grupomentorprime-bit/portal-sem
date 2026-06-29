"use client";

import { Button, Input, Label, Textarea } from "@/components/ui";
import type { CmsMediaAsset } from "@/types/media";
import { MEDIA_FOLDERS } from "@/types/media";
import { MediaPreview } from "./MediaPreview";
import { MediaUsage } from "./MediaUsage";

interface MediaDetailsProps {
  asset: CmsMediaAsset | null;
  onSave: (patch: Partial<CmsMediaAsset>) => Promise<void>;
  onClose: () => void;
}

export function MediaDetails({ asset, onSave, onClose }: MediaDetailsProps) {
  if (!asset) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await onSave({
      alt: String(fd.get("alt") ?? ""),
      caption: String(fd.get("caption") ?? ""),
      credits: String(fd.get("credits") ?? ""),
      folder: String(fd.get("folder") ?? asset.folder) as CmsMediaAsset["folder"],
      tags: String(fd.get("tags") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="space-y-4">
      <MediaPreview asset={asset} className="mx-auto h-40 w-full max-w-xs rounded-lg object-contain" />
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label className="text-xs">Nombre</Label>
          <p className="text-sm font-medium">{asset.originalName}</p>
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
            className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
          >
            {MEDIA_FOLDERS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="media-tags">Etiquetas</Label>
          <Input id="media-tags" name="tags" defaultValue={asset.tags.join(", ")} />
        </div>
        <div>
          <Label className="text-xs">Uso</Label>
          <MediaUsage asset={asset} />
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="submit" size="sm">Guardar</Button>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cerrar</Button>
        </div>
      </form>
    </div>
  );
}
