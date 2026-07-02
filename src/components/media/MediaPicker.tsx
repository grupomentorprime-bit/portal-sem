"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import type { MediaSelection } from "@/core/media/types";
import { isMediaId } from "@/core/media/types";
import type { CmsMediaAsset, MediaFolder } from "@/types/media";
import { assetToSelection } from "@/core/media/types";
import {
  checkHeroAspectRatio,
  formatMediaDate,
  formatMediaDimensions,
  formatMediaSize,
  type HeroMediaContext,
} from "@/lib/cms/media-hero";
import { MediaManager, type MediaPickerContext } from "./MediaManager";

export type { MediaSelection };

interface MediaPickerProps {
  tenant: string;
  open: boolean;
  onClose: () => void;
  onSelect: (selection: MediaSelection, asset?: CmsMediaAsset) => void;
  defaultFolder?: MediaFolder;
  allowedCategory?: string;
  title?: string;
  pickerContext?: MediaPickerContext;
}

export function MediaPicker({
  tenant,
  open,
  onClose,
  onSelect,
  defaultFolder,
  allowedCategory,
  title = "Media Manager",
  pickerContext = "default",
}: MediaPickerProps) {
  const handlePick = (asset: CmsMediaAsset) => {
    onSelect(assetToSelection(asset), asset);
    onClose();
  };

  const isHero =
    pickerContext === "hero-desktop" ||
    pickerContext === "hero-mobile" ||
    defaultFolder === "Hero";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="full"
    >
      <div className="max-h-[75vh] overflow-y-auto">
        <MediaManager
          tenant={tenant}
          defaultFolder={defaultFolder ?? (isHero ? "Hero" : undefined)}
          pickMode
          allowedCategory={allowedCategory ?? (isHero ? "Imagen" : undefined)}
          onPick={handlePick}
          allowUploadInPicker
          pickerContext={pickerContext}
        />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <p className="text-xs text-muted">
          Suba, busque y seleccione archivos sin salir del módulo. Una única biblioteca para todo el CMS.
        </p>
        <Link
          href="/admin/media"
          target="_blank"
          className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline"
        >
          Abrir administrador completo
          <ExternalLink size={14} />
        </Link>
      </div>
    </Modal>
  );
}

interface MediaFieldProps {
  label: string;
  description?: string;
  value: string;
  onChange: (mediaId: string) => void;
  /** Callback con asset completo para vista previa inmediata */
  onAssetChange?: (asset: CmsMediaAsset | null) => void;
  tenant: string;
  folder?: MediaFolder;
  category?: string;
  previewClassName?: string;
  pickerContext?: MediaPickerContext;
  /** Texto del botón cuando ya hay imagen */
  changeLabel?: string;
}

export function MediaField({
  label,
  description,
  value,
  onChange,
  onAssetChange,
  tenant,
  folder,
  category,
  previewClassName,
  pickerContext,
  changeLabel = "Cambiar imagen",
}: MediaFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewMeta, setPreviewMeta] = useState<CmsMediaAsset | null>(null);
  const [aspectWarning, setAspectWarning] = useState<string | null>(null);

  const resolvedContext: MediaPickerContext =
    pickerContext ??
    (label.toLowerCase().includes("mobile") ? "hero-mobile" : folder === "Hero" ? "hero-desktop" : "default");

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      if (!value) {
        setPreviewUrl("");
        setPreviewMeta(null);
        setAspectWarning(null);
        onAssetChange?.(null);
        return;
      }

      if (isMediaId(value)) {
        try {
          const res = await fetch(`/api/cms/media/${encodeURIComponent(value)}`);
          const data = await res.json();
          if (!cancelled && data.ok && (data.asset || data.media)) {
            const asset = (data.media ?? data.asset) as CmsMediaAsset;
            setPreviewUrl(asset.thumbnail || asset.url);
            setPreviewMeta(asset);
            onAssetChange?.(asset);

            if (
              resolvedContext === "hero-desktop" ||
              resolvedContext === "hero-mobile"
            ) {
              const warn = checkHeroAspectRatio(
                asset.width,
                asset.height,
                resolvedContext as HeroMediaContext
              );
              setAspectWarning(warn?.message ?? null);
            }
          }
        } catch {
          if (!cancelled) {
            setPreviewUrl("");
            setPreviewMeta(null);
          }
        }
        return;
      }

      setPreviewUrl(value);
    }

    loadPreview();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onAssetChange es callback opcional del padre
  }, [value, resolvedContext]);

  const handleSelect = (selection: MediaSelection, asset?: CmsMediaAsset) => {
    onChange(selection.mediaId);
    if (asset) {
      setPreviewUrl(asset.thumbnail || asset.url);
      setPreviewMeta(asset);
      onAssetChange?.(asset);

      if (resolvedContext === "hero-desktop" || resolvedContext === "hero-mobile") {
        const warn = checkHeroAspectRatio(
          asset.width,
          asset.height,
          resolvedContext as HeroMediaContext
        );
        setAspectWarning(warn?.message ?? null);
      }
    }
  };

  const selectLabel = value ? changeLabel : "Seleccionar imagen";

  return (
    <div className="space-y-3">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        {description ? <p className="text-sm text-muted">{description}</p> : null}
      </div>

      {aspectWarning ? (
        <Alert variant="warning">{aspectWarning}</Alert>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className={`relative flex h-36 w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/20 sm:w-48 ${previewClassName ?? ""}`}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={label} className="h-full w-full object-cover" />
          ) : (
            <span className="px-4 text-center text-xs text-muted">
              Sin imagen seleccionada
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          {previewMeta ? (
            <div className="rounded-md border border-border bg-muted/10 p-3 text-xs text-muted">
              <p className="font-medium text-foreground">{previewMeta.originalName}</p>
              <p className="mt-1">
                {formatMediaDimensions(previewMeta.width, previewMeta.height)} ·{" "}
                {formatMediaSize(previewMeta.size)}
              </p>
              <p>{formatMediaDate(previewMeta.createdAt)} · {previewMeta.category}</p>
              {previewMeta.usage?.length ? (
                <p className="mt-1 font-medium text-secondary">
                  Usada en: {previewMeta.usage.map((u) => u.label).join(", ")}
                </p>
              ) : null}
            </div>
          ) : null}
          <Button type="button" onClick={() => setPickerOpen(true)}>
            {selectLabel}
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange("");
                setPreviewMeta(null);
                onAssetChange?.(null);
                setAspectWarning(null);
              }}
            >
              Quitar
            </Button>
          ) : null}
        </div>
      </div>
      <MediaPicker
        tenant={tenant}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
        defaultFolder={folder ?? "Hero"}
        allowedCategory={category ?? "Imagen"}
        pickerContext={resolvedContext}
        title={`Media Manager — ${label}`}
      />
    </div>
  );
}
