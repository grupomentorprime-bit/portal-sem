/**
 * OT-MEDIA-SEM-001 — Catálogo fotográfico (cliente + servidor).
 * Generado por: npm run build:institutional-media
 */
import type { InstitutionalPhotoCatalog } from "@/types/institutional-photo";
import catalogJson from "../../../public/media/catalog.json";

export const institutionalPhotoCatalog = catalogJson as InstitutionalPhotoCatalog;

export function getPhotoAssetById(id: string) {
  return institutionalPhotoCatalog.assets.find((asset) => asset.id === id);
}
