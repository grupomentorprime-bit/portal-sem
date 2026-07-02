import type { CmsMediaAsset } from "@/types/media";

export interface MediaOptimizationSummary {
  originalBytes: number;
  optimizedBytes: number;
  format: string;
  derivatives: string[];
  webpGenerated: boolean;
}

export function buildOptimizationSummary(
  asset: CmsMediaAsset,
  originalBytes?: number
): MediaOptimizationSummary | null {
  if (!asset.mimeType.startsWith("image/")) return null;

  const responsive = asset.responsive ?? {};
  const widthKeys = Object.keys(responsive)
    .filter((k) => /^w\d+$/.test(k))
    .map((k) => k.replace("w", ""))
    .sort((a, b) => Number(a) - Number(b));

  const jpegKeys = Object.keys(responsive)
    .filter((k) => k.startsWith("jpeg"))
    .map((k) => k.replace("jpeg", ""))
    .sort((a, b) => Number(a) - Number(b));

  const derivatives = [...new Set([...widthKeys, ...jpegKeys])];

  return {
    originalBytes: originalBytes ?? asset.size,
    optimizedBytes: asset.size,
    format: asset.extension.toUpperCase(),
    derivatives,
    webpGenerated: Boolean(responsive.webp || widthKeys.length > 0),
  };
}
