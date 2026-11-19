/**
 * OT-MEDIA-SEM-001 — Catálogo fotográfico (cliente + servidor).
 * `public/media/catalog.json` no se versiona.
 * En un checkout limpio: `npm run build:institutional-media`
 * (también corre dentro de `npm run build`). No copiar un catálogo a mano.
 */
import type { InstitutionalPhotoCatalog } from "@/types/institutional-photo";
import catalogJson from "../../../public/media/catalog.json";

export const institutionalPhotoCatalog = catalogJson as InstitutionalPhotoCatalog;

export function getPhotoAssetById(id: string) {
  return institutionalPhotoCatalog.assets.find((asset) => asset.id === id);
}
