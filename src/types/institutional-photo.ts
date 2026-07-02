/**
 * OT-MEDIA-SEM-001 — Tipos de la biblioteca fotográfica institucional SEM.
 */

export const INSTITUTIONAL_PHOTO_CATEGORIES = [
  "formation",
  "bible",
  "community",
  "faculty",
  "students",
  "library",
  "worship",
  "graduation",
  "resources",
  "hero",
  "backgrounds",
] as const;

export type InstitutionalPhotoCategory = (typeof INSTITUTIONAL_PHOTO_CATEGORIES)[number];

export type InstitutionalPhotoOrientation = "landscape" | "portrait" | "square";

export type InstitutionalPhotoStatus =
  | "approved"
  | "provisional"
  | "pending"
  | "rejected";

export type InstitutionalImageVariant =
  | "hero"
  | "card"
  | "banner"
  | "gallery"
  | "avatar";

export type InstitutionalPhotoSection =
  | "hero"
  | "programs"
  | "equipo"
  | "biblioteca"
  | "noticias"
  | "modality"
  | "testimonials"
  | "admission"
  | "footer"
  | "cta"
  | "gallery"
  | "card";

export interface InstitutionalPhotoFocalPoint {
  x: number;
  y: number;
}

export interface InstitutionalPhotoVariants {
  avif: Record<string, string>;
  webp: Record<string, string>;
  jpeg: Record<string, string>;
}

export interface InstitutionalPhotoAsset {
  id: string;
  category: InstitutionalPhotoCategory;
  subcategory: string;
  title: string;
  description: string;
  orientation: InstitutionalPhotoOrientation;
  recommended_section: InstitutionalPhotoSection[];
  keywords: string[];
  photographer: string;
  license: string;
  status: InstitutionalPhotoStatus;
  /** Punto de interés para crop inteligente (0–1) */
  focal_point?: InstitutionalPhotoFocalPoint;
  source: string;
  variants: InstitutionalPhotoVariants;
  blurDataURL?: string;
  width?: number;
  height?: number;
  notes?: string;
}

export interface InstitutionalPhotoCatalog {
  version: string;
  ot: string;
  updatedAt: string;
  assets: InstitutionalPhotoAsset[];
}
