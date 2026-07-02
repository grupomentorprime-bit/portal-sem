import { NextResponse } from "next/server";
import { readMediaFile } from "@/lib/cms/media-storage";
import { isValidMediaStorageKey } from "@/lib/cms/storage-normalize";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key")?.trim();

  if (!key || !isValidMediaStorageKey(key)) {
    return NextResponse.json({ ok: false, error: "Clave de archivo inválida." }, { status: 400 });
  }

  const file = await readMediaFile(key);
  if (!file) {
    return NextResponse.json({ ok: false, error: "Archivo no encontrado." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.buffer), {
    status: 200,
    headers: {
      "Content-Type": file.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
