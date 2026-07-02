"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaPicker } from "@/components/media/MediaPicker";
import type { MediaSelection } from "@/core/media/types";
import type { CmsMediaAsset, MediaFolder } from "@/types/media";
import { InspectorEmpty } from "../shared";
import type { InspectorFieldBaseProps } from "../types";

export interface InspectorGalleryPickerProps extends InspectorFieldBaseProps {
  value: string[];
  onChange: (mediaIds: string[]) => void;
  tenant: string;
  folder?: MediaFolder;
  maxItems?: number;
}

/**
 * Galería de imágenes desde Biblioteca Institucional.
 */
export function InspectorGalleryPicker({
  label = "Galería",
  hint = "Agregue imágenes desde la biblioteca institucional.",
  value,
  onChange,
  tenant,
  folder,
  maxItems = 12,
  disabled,
}: InspectorGalleryPickerProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  const handleSelect = (selection: MediaSelection, asset?: CmsMediaAsset) => {
    if (value.includes(selection.mediaId) || value.length >= maxItems) return;
    onChange([...value, selection.mediaId]);
    if (asset) {
      setThumbs((prev) => ({
        ...prev,
        [selection.mediaId]: asset.thumbnail || asset.url,
      }));
    }
    setPickerOpen(false);
  };

  const remove = (id: string) => {
    onChange(value.filter((item) => item !== id));
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>

      {value.length === 0 ? (
        <InspectorEmpty
          title="Sin imágenes en la galería"
          description="Agregue fotos desde la biblioteca institucional."
          action={
            <Button type="button" size="sm" disabled={disabled} onClick={() => setPickerOpen(true)}>
              Elegir imágenes
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-3 gap-2" role="list">
          {value.map((id) => (
            <li key={id} className="relative aspect-square overflow-hidden rounded-lg border border-border">
              {thumbs[id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbs[id]} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-[10px] text-muted">Imagen</span>
              )}
              <button
                type="button"
                disabled={disabled}
                onClick={() => remove(id)}
                className="absolute top-1 right-1 rounded-full bg-background/90 p-0.5 shadow-sm"
                aria-label="Quitar imagen"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {value.length > 0 && value.length < maxItems ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => setPickerOpen(true)}
        >
          Agregar imagen
        </Button>
      ) : null}

      <MediaPicker
        tenant={tenant}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
        defaultFolder={folder}
        allowedCategory="Imagen"
        title="Biblioteca Institucional — Galería"
      />
    </div>
  );
}
