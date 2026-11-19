import { NextResponse } from "next/server";
import { getActiveTenantId } from "@/core/identity";
import { PUBLIC_CONGRESS_SEARCH_MIN } from "@/core/congress/claim";
import { foldPersonSearchText } from "@/lib/experience/forms/person-search";
import { searchCongressPublicRoster } from "@/lib/congress/roster-search";
import {
  PUBLIC_SEARCH_LIMIT,
  PUBLIC_SEARCH_WINDOW_MS,
  consumeSharedRateLimit,
  publicClientKey,
} from "@/core/security/public-rate-limit";
import { publicInternalError } from "@/core/security/public-error";

/** Búsqueda pública de nómina reclamable. No devuelve el id interno. */
export async function GET(request: Request) {
  try {
    const tenant = await getActiveTenantId();
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Portal no configurado." }, { status: 503 });
    }

    const limited = await consumeSharedRateLimit({
      key: publicClientKey(request.headers.get("x-forwarded-for"), "congress-roster-search"),
      limit: PUBLIC_SEARCH_LIMIT,
      windowMs: PUBLIC_SEARCH_WINDOW_MS,
    });
    if (!limited.ok) {
      return NextResponse.json(
        { ok: false, error: "Demasiadas consultas." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }

    const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (foldPersonSearchText(query).length < PUBLIC_CONGRESS_SEARCH_MIN) {
      return NextResponse.json({
        ok: true,
        matches: [],
        suggestions: [],
        hasMore: false,
        suggestionsHasMore: false,
      });
    }

    const result = await searchCongressPublicRoster(tenant, query);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return publicInternalError("congress-roster-search", error);
  }
}
