import { NextResponse } from "next/server";
import { readMediaFile } from "@/lib/cms/media-storage";
import { isValidMediaStorageKey } from "@/lib/cms/storage-normalize";

function filenameFromKey(key: string): string {
  const parts = key.split("/");
  const last = parts[parts.length - 1]?.trim();
  return last || "archivo";
}

function wantsHtmlResponse(request: Request): boolean {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html") && !accept.includes("application/json");
}

function notFoundResponse(request: Request): NextResponse {
  if (wantsHtmlResponse(request)) {
    const html = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Archivo no encontrado</title>
    <style>
      body { font-family: Segoe UI, Helvetica, Arial, sans-serif; background: #f5f7f9; color: #141f29; margin: 0; padding: 40px 16px; }
      .card { max-width: 520px; margin: 0 auto; background: #fff; border: 1px solid #d1d9e0; border-radius: 16px; padding: 28px; }
      h1 { margin: 0 0 12px; font-size: 22px; }
      p { margin: 0; line-height: 1.6; color: #5c7289; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Archivo no encontrado</h1>
      <p>El documento ya no está disponible en el portal. Si necesitas el programa de la jornada, contacta a asuntos estudiantiles.</p>
    </div>
  </body>
</html>`;
    return new NextResponse(html, {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return NextResponse.json({ ok: false, error: "Archivo no encontrado." }, { status: 404 });
}

function buildDownloadHeaders(mimeType: string, filename: string): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": mimeType,
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  if (
    mimeType === "application/pdf" ||
    mimeType === "application/octet-stream" ||
    !mimeType.startsWith("image/")
  ) {
    const safeName = filename.replace(/[^\w.\-() ]+/g, "_");
    headers["Content-Disposition"] = `attachment; filename="${safeName}"`;
  }

  return headers;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key")?.trim();

  if (!key || !isValidMediaStorageKey(key)) {
    return NextResponse.json({ ok: false, error: "Clave de archivo inválida." }, { status: 400 });
  }

  const file = await readMediaFile(key);
  if (!file) {
    return notFoundResponse(request);
  }

  const filename = filenameFromKey(key);

  return new NextResponse(new Uint8Array(file.buffer), {
    status: 200,
    headers: buildDownloadHeaders(file.mimeType, filename),
  });
}
