"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { MediaSelection } from "@/core/media/types";
import { isMediaId } from "@/core/media/types";
import type { CmsMediaAsset, MediaFolder } from "@/types/media";
import { assetToSelection } from "@/core/media/types";
import { MediaLibraryCore } from "./MediaLibraryClient";

export type { MediaSelection };

interface MediaPickerProps {
  tenant: string;
  open: boolean;
  onClose: () => void;
  onSelect: (selection: MediaSelection) => void;
  defaultFolder?: MediaFolder;
  allowedCategory?: string;
  title?: string;
}

export function MediaPicker({
  tenant,
  open,
  onClose,
  onSelect,
  defaultFolder,
  allowedCategory,
  title = "Seleccionar de la biblioteca",
}: MediaPickerProps) {
  const handlePick = (asset: CmsMediaAsset) => {
    onSelect(assetToSelection(asset));
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="full">
      <div className="max-h-[70vh] overflow-y-auto">
        <MediaLibraryCore
          tenant={tenant}
          defaultFolder={defaultFolder}
          pickMode
          allowedCategory={allowedCategory}
          onPick={handlePick}
        />
      </div>
    </Modal>
  );
}

interface MediaFieldProps {
  label: string;
  description?: string;
  /** Media asset ID (`media-*`). Legacy URLs se muestran pero al re-seleccionar se persiste mediaId. */
  value: string;
  onChange: (mediaId: string) => void;
  tenant: string;
  folder?: MediaFolder;
  category?: string;
  previewClassName?: string;
}

export function MediaField({
  label,
  description,
  value,
  onChange,
  tenant,
  folder,
  category,
  previewClassName,
}: MediaFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      if (!value) {
        setPreviewUrl("");
        return;
      }

      if (isMediaId(value)) {
        try {
          const res = await fetch(`/api/cms/media/${encodeURIComponent(value)}`);
          const data = await res.json();
          if (!cancelled && data.ok && data.asset) {
            setPreviewUrl(data.asset.thumbnail || data.asset.url);
          }
        } catch {
          if (!cancelled) setPreviewUrl("");
        }
        return;
      }

      setPreviewUrl(value);
    }

    loadPreview();
    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div className="space-y-3">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        {description ? <p className="text-sm text-muted">{description}</p> : null}
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className={`flex h-28 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/20 sm:w-40 ${previewClassName ?? ""}`}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={label} className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-muted">Sin archivo</span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Button type="button" onClick={() => setPickerOpen(true)}>
            Seleccionar de biblioteca
          </Button>
          {value ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
              Quitar
            </Button>
          ) : null}
          <p className="truncate text-xs text-muted">
            {value ? `mediaId: ${value}` : "Ningún archivo seleccionado"}
          </p>
        </div>
      </div>
      <MediaPicker
        tenant={tenant}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(selection) => onChange(selection.mediaId)}
        defaultFolder={folder}
        allowedCategory={category}
        title={`Seleccionar — ${label}`}
      />
    </div>
  );
}
