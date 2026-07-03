import { MEDIA_STREAM_PATH } from "@/lib/cms/storage-normalize";

/** URLs servidas por el proxy privado de Backblaze (ya vienen optimizadas en variantes w768…w1920). */
export function isMediaStreamUrl(src: string): boolean {
  return src.includes(MEDIA_STREAM_PATH);
}

export function nextImagePropsForSrc(src: string): { unoptimized?: boolean } {
  return isMediaStreamUrl(src) ? { unoptimized: true } : {};
}
