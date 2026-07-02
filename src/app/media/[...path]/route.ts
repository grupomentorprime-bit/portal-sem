import { NextResponse } from "next/server";
import { readMediaFile } from "@/lib/cms/media-storage";
import { isValidMediaStorageKey } from "@/lib/cms/storage-normalize";

/**
 * Sirve medios CMS subidos (tenant/media-…/archivo) desde S3 o disco local.
 * Las rutas institucionales (/media/hero/…, /media/formation/…) siguen en public/
 * y las entrega Next como estáticos cuando existen en la imagen Docker.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const key = path.join("/");

  if (!key || !isValidMediaStorageKey(key)) {
    return new NextResponse(null, { status: 404 });
  }

  const file = await readMediaFile(key);
  if (!file) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.buffer), {
    status: 200,
    headers: {
      "Content-Type": file.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
