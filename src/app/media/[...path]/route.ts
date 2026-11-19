import { NextResponse } from "next/server";
import { getOperationalTenantId } from "@/core/identity";
import { decideMediaRead } from "@/core/security/media-access";
import {
  PUBLIC_MEDIA_PROBE_LIMIT,
  PUBLIC_SEARCH_WINDOW_MS,
  consumeSharedRateLimit,
  publicClientKey,
} from "@/core/security/public-rate-limit";
import { findMediaAssetByObjectKey } from "@/lib/cms/media";
import { readMediaFile } from "@/lib/cms/media-storage";
import { loadSessionContext } from "@/lib/identity/sessions";

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const key = path.join("/");
  const tenant = await getOperationalTenantId();
  if (!tenant) return new NextResponse(null, { status: 404 });

  const session = await loadSessionContext();
  const memberTenantId =
    session?.membership && session.session.tenantId?.trim()
      ? session.session.tenantId.trim()
      : null;
  const asset = await findMediaAssetByObjectKey(tenant, key);
  const decision = decideMediaRead({
    key,
    operationalTenantId: tenant,
    asset,
    memberTenantId,
  });
  if (!decision.allow) {
    const limited = await consumeSharedRateLimit({
      key: publicClientKey(request.headers.get("x-forwarded-for"), "media-probe"),
      limit: PUBLIC_MEDIA_PROBE_LIMIT,
      windowMs: PUBLIC_SEARCH_WINDOW_MS,
    });
    if (!limited.ok) {
      return new NextResponse(null, {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec), "Cache-Control": "private, no-store" },
      });
    }
    return new NextResponse(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  }

  const file = await readMediaFile(key, tenant);
  if (!file) return new NextResponse(null, { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": file.mimeType,
    "Cache-Control": decision.cacheControl,
  };
  if (decision.distribution === "private") {
    const filename = key.split("/").pop() || "archivo";
    headers["Content-Disposition"] = `attachment; filename="${filename.replace(/[^\w.\-() ]+/g, "_")}"`;
  }
  return new NextResponse(new Uint8Array(file.buffer), { status: 200, headers });
}
