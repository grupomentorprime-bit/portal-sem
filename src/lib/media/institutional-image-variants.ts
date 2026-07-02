import type { InstitutionalImageVariant, InstitutionalPhotoFocalPoint } from "@/types/institutional-photo";

export interface InstitutionalImageVariantConfig {
  aspectRatio: string;
  sizes: string;
  defaultFocal: InstitutionalPhotoFocalPoint;
  rounded?: boolean;
  minHeight?: string;
}

export const INSTITUTIONAL_IMAGE_VARIANTS: Record<
  InstitutionalImageVariant,
  InstitutionalImageVariantConfig
> = {
  hero: {
    aspectRatio: "16 / 9",
    sizes: "100vw",
    defaultFocal: { x: 0.5, y: 0.35 },
    minHeight: "min-h-[280px] md:min-h-[420px]",
  },
  card: {
    aspectRatio: "4 / 3",
    sizes: "(max-width: 768px) 100vw, (max-width: 1280px) 300px, 320px",
    defaultFocal: { x: 0.5, y: 0.45 },
  },
  banner: {
    aspectRatio: "21 / 9",
    sizes: "100vw",
    defaultFocal: { x: 0.5, y: 0.4 },
    minHeight: "min-h-[200px] md:min-h-[280px]",
  },
  gallery: {
    aspectRatio: "1 / 1",
    sizes: "(max-width: 768px) 50vw, 25vw",
    defaultFocal: { x: 0.5, y: 0.5 },
  },
  avatar: {
    aspectRatio: "1 / 1",
    sizes: "96px",
    defaultFocal: { x: 0.5, y: 0.25 },
    rounded: true,
  },
};

const WIDTH_PRIORITY = [1920, 1440, 1080, 768, 400] as const;

import type { InstitutionalPhotoVariants } from "@/types/institutional-photo";

export function pickInstitutionalSrc(
  variants: InstitutionalPhotoVariants,
  preferredWidth = 1080
): { src: string; srcSet?: string } {
  const formats: Array<"avif" | "webp" | "jpeg"> = ["avif", "webp", "jpeg"];

  for (const format of formats) {
    const map = variants[format];
    if (!map || Object.keys(map).length === 0) continue;

    const entries = Object.entries(map).sort((a, b) => {
      const wa = parseInt(a[0].replace(/\D/g, ""), 10) || 0;
      const wb = parseInt(b[0].replace(/\D/g, ""), 10) || 0;
      return wb - wa;
    });

    if (entries.length === 0) continue;

    const closest =
      entries.find(([k]) => parseInt(k.replace(/\D/g, ""), 10) <= preferredWidth) ??
      entries[entries.length - 1];

    const srcSet = entries
      .map(([k, url]) => {
        const w = parseInt(k.replace(/\D/g, ""), 10);
        return `${url} ${w}w`;
      })
      .join(", ");

    return { src: closest[1], srcSet };
  }

  return { src: "" };
}

export function focalToObjectPosition(
  focal?: InstitutionalPhotoFocalPoint,
  fallback?: InstitutionalPhotoFocalPoint
): string {
  const point = focal ?? fallback ?? { x: 0.5, y: 0.5 };
  return `${(point.x * 100).toFixed(1)}% ${(point.y * 100).toFixed(1)}%`;
}

export { WIDTH_PRIORITY };
