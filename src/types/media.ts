/** Modelos Media Library — reutilizables Web, Campus y Expo */

export const MEDIA_FOLDERS = [
  "Logos",
  "Hero",
  "Programas",
  "Noticias",
  "Profesores",
  "Biblioteca",
  "Eventos",
  "Testimonios",
  "Galería",
  "Documentos",
  "Descargas",
  "Videos",
  "Audio",
  "Iconos",
  "Otros",
] as const;

export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export const MEDIA_CATEGORIES = [
  "Imagen",
  "Documento",
  "Video",
  "Audio",
  "SVG",
  "Icono",
] as const;

export type MediaCategory = (typeof MEDIA_CATEGORIES)[number];

export const MEDIA_VISIBILITY = ["active", "trash"] as const;
export type MediaVisibility = (typeof MEDIA_VISIBILITY)[number];

export interface MediaResponsiveUrls {
  thumbnail?: string;
  w400?: string;
  w800?: string;
  w1200?: string;
  w1920?: string;
  webp?: string;
}

export interface MediaUsageRef {
  module: string;
  entityId: string;
  field: string;
  label: string;
}

export interface CmsMediaAsset {
  _id: string;
  tenant: string;
  filename: string;
  originalName: string;
  extension: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  folder: MediaFolder;
  category: MediaCategory;
  tags: string[];
  alt: string;
  caption: string;
  credits: string;
  visibility: MediaVisibility;
  url: string;
  thumbnail: string;
  responsive: MediaResponsiveUrls;
  storageKey: string;
  hash: string;
  usage: MediaUsageRef[];
  createdBy: string;
  trashedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CmsMediaCreate = Omit<
  CmsMediaAsset,
  "_id" | "createdAt" | "updatedAt" | "usage" | "trashedAt"
> & { _id?: string };

export type CmsMediaUpdate = Partial<
  Pick<
    CmsMediaAsset,
    | "folder"
    | "category"
    | "tags"
    | "alt"
    | "caption"
    | "credits"
    | "visibility"
    | "originalName"
  >
>;

export interface MediaListQuery {
  tenant: string;
  folder?: string;
  category?: string;
  tags?: string[];
  visibility?: MediaVisibility;
  search?: string;
  mimeType?: string;
  createdBy?: string;
  sort?: "name" | "date" | "size" | "type";
  direction?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface MediaListResult {
  items: CmsMediaAsset[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface MediaBulkAction {
  tenant: string;
  ids: string[];
  action: "trash" | "restore" | "delete" | "move" | "tag";
  folder?: MediaFolder;
  tags?: string[];
}

export interface MediaSearchQuery extends MediaListQuery {
  minSize?: number;
  maxSize?: number;
  dateFrom?: string;
  dateTo?: string;
}
