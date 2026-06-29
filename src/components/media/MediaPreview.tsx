"use client";

import type { CmsMediaAsset } from "@/types/media";
import { FileAudio, FileText, FileVideo, ImageIcon } from "lucide-react";

interface MediaPreviewProps {
  asset: CmsMediaAsset;
  className?: string;
}

export function MediaPreview({ asset, className = "" }: MediaPreviewProps) {
  const src = asset.thumbnail || asset.url;
  const isImage = asset.mimeType.startsWith("image/");

  if (isImage && src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={asset.alt || asset.originalName} className={className} />
    );
  }

  const Icon = asset.mimeType.startsWith("video/")
    ? FileVideo
    : asset.mimeType.startsWith("audio/")
      ? FileAudio
      : asset.mimeType === "application/pdf"
        ? FileText
        : ImageIcon;

  return (
    <div className={`flex items-center justify-center bg-muted/40 ${className}`}>
      <Icon className="h-8 w-8 text-muted" strokeWidth={1.5} />
    </div>
  );
}
