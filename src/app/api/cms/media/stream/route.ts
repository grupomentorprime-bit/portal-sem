import { NextResponse } from "next/server";
import { getOperationalTenantId } from "@/core/identity";
import {
  PUBLIC_MEDIA_PROBE_LIMIT,
  PUBLIC_SEARCH_WINDOW_MS,
  consumeSharedRateLimit,
  publicClientKey,
} from "@/core/security/public-rate-limit";
import { decideMediaRead } from "@/core/security/media-access";
import { findMediaAssetByObjectKey } from "@/lib/cms/media";
import { readMediaFile } from "@/lib/cms/media-storage";
import { loadSessionContext } from "@/lib/identity/sessions";

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
  </head>
  <body>
    <h1>Archivo no encontrado</h1>
    <p>El documento ya no está disponible en el portal.</p>
  </body>
</html>`;
    return new NextResponse(html, {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" },
    });
  }
  return NextResponse.json(
    { ok: false, error: "Archivo no encontrado." },
    { status: 404, headers: { "Cache-Control": "private, no-store" } }
  );
}

async function probeLimited(request: Request): Promise<NextResponse | null> {
  const decision = await consumeSharedRateLimit({
    key: publicClientKey(request.headers.get("x-forwarded-for"), "media-probe"),
    limit: PUBLIC_MEDIA_PROBE_LIMIT,
    windowMs: PUBLIC_SEARCH_WINDOW_MS,
  });
  if (decision.ok) return null;
  return NextResponse.json(
    { ok: false, error: "Demasiadas consultas." },
    { status: 429, headers: { "Retry-After": String(decision.retryAfterSec), "Cache-Control": "private, no-store" } }
  );
}

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key")?.trim() ?? "";
  const tenant = await getOperationalTenantId();
  if (!tenant) return notFoundResponse(request);

  const session = await loadSessionContext();
  const memberTenantId =
    session?.membership && session.session.tenantId?.trim()
      ? session.session.tenantId.trim()
      : null;
  const asset = key ? await findMediaAssetByObjectKey(tenant, key) : null;
  const decision = decideMediaRead({
    key,
    operationalTenantId: tenant,
    asset,
    memberTenantId,
  });
  if (!decision.allow) {
    const limited = await probeLimited(request);
    if (limited) return limited;
    return notFoundResponse(request);
  }

  const file = await readMediaFile(key, tenant);
  if (!file) return notFoundResponse(request);

  const headers: Record<string, string> = {
    "Content-Type": file.mimeType,
    "Cache-Control": decision.cacheControl,
  };
  if (decision.distribution === "private") {
    const safeName = filenameFromKey(key).replace(/[^\w.\-() ]+/g, "_");
    headers["Content-Disposition"] = `attachment; filename="${safeName}"`;
  }

  return new NextResponse(new Uint8Array(file.buffer), { status: 200, headers });
}
