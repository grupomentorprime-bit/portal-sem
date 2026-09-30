"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { MediaPicker } from "@/components/media/MediaPicker";
import { Button } from "@/components/ui/button";
import { HOME_HERO_PHOTO_LIMIT } from "@/lib/cms/home-hero-photos";
import type { HomeHeroPhotoRef } from "@/types/cms";
import type { CmsMediaAsset } from "@/types/media";

interface HomeHeroPhotosFieldProps {
  value: HomeHeroPhotoRef[];
  onChange: (photos: HomeHeroPhotoRef[]) => void;
  tenant: string;
}

export function HomeHeroPhotosField({ value, onChange, tenant }: HomeHeroPhotosFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const missing = value.map((photo) => photo.mediaId).filter((id) => thumbs[id] === undefined);
    if (missing.length === 0) return;

    void Promise.all(
      missing.map(async (id) => {
        try {
          const res = await fetch(`/api/cms/media/${encodeURIComponent(id)}`);
          if (!res.ok) return null;
          const data = await res.json();
          const asset = (data.media ?? data.asset) as CmsMediaAsset | undefined;
          if (!asset) return [id, ""] as const;
          return [id, asset.thumbnail || asset.url] as const;
        } catch {
          return [id, ""] as const;
        }
      })
    ).then((loaded) => {
      if (cancelled) return;
      setThumbs((prev) => {
        const next = { ...prev };
        for (const item of loaded) {
          if (item) next[item[0]] = item[1];
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [thumbs, value]);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    onChange(next);
  };

  const publishedCount = value.filter((photo) => photo.published).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        El texto y los botones del inicio no cambian. Estas fotografías rotan en el mismo hero,
        cada 5 segundos. Con una sola publicada, se muestra fija y sin controles.
      </p>

      {value.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-border p-6 text-center text-sm text-muted">
          Sin fotografías en la biblioteca. El inicio sigue con la imagen provisional.
        </p>
      ) : (
        <ul className="space-y-2">
          {value.map((photo, index) => (
            <li
              key={photo.mediaId}
              className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-background px-3 py-2"
            >
              <span className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-background-muted">
                {thumbs[photo.mediaId] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumbs[photo.mediaId]} alt="" className="h-full w-full object-cover" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1 text-sm text-muted">
                {index + 1}. {photo.mediaId}
              </span>
              <label className="flex shrink-0 items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={photo.published}
                  onChange={(event) => {
                    const published = event.target.checked;
                    onChange(
                      value.map((item) =>
                        item.mediaId === photo.mediaId ? { ...item, published } : item
                      )
                    );
                  }}
                />
                Publicada
              </label>
              <div className="flex shrink-0 items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Subir fotografía"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ChevronUp size={16} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Bajar fotografía"
                  disabled={index === value.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ChevronDown size={16} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Quitar fotografía"
                  onClick={() => onChange(value.filter((item) => item.mediaId !== photo.mediaId))}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={value.length >= HOME_HERO_PHOTO_LIMIT}
          onClick={() => setPickerOpen(true)}
        >
          Agregar desde la biblioteca
        </Button>
        <p className="text-xs text-muted">
          {publishedCount} publicada{publishedCount === 1 ? "" : "s"} · {value.length} de{" "}
          {HOME_HERO_PHOTO_LIMIT}
        </p>
      </div>

      <MediaPicker
        tenant={tenant}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Biblioteca — fotografías del inicio"
        defaultFolder="Hero"
        allowedCategory="Imagen"
        onSelect={(selection, asset) => {
          if (value.some((photo) => photo.mediaId === selection.mediaId)) return;
          if (value.length >= HOME_HERO_PHOTO_LIMIT) return;
          if (asset) {
            setThumbs((prev) => ({
              ...prev,
              [selection.mediaId]: asset.thumbnail || asset.url,
            }));
          }
          onChange([...value, { mediaId: selection.mediaId, published: true }]);
        }}
      />
    </div>
  );
}
