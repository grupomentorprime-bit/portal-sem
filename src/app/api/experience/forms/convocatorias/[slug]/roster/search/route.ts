import { NextResponse } from "next/server";
import { getActiveTenantId } from "@/core/identity";
import { PUBLIC_ROSTER_MIN_QUERY, toPublicRosterHit } from "@/core/experience/public-roster";
import { foldPersonSearchText } from "@/lib/experience/forms/person-search";
import { getConvocatoriaBySlug } from "@/lib/admin/forms-center";
import { searchConvocatoriaRoster } from "@/lib/experience/forms/roster";
import { sealSelectionRef, selectionRefSecret } from "@/core/security/selection-ref";
import {
  PUBLIC_SEARCH_LIMIT,
  PUBLIC_SEARCH_WINDOW_MS,
  consumeRateLimit,
  publicClientKey,
  publicRateLimitStore,
} from "@/core/security/public-rate-limit";
import { publicInternalError } from "@/core/security/public-error";

const SELECTION_TTL_MS = 2 * 60 * 60 * 1000;

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const tenant = await getActiveTenantId();
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Portal no configurado." }, { status: 503 });
    }

    const convocatoria = getConvocatoriaBySlug(slug);
    if (!convocatoria) {
      return NextResponse.json({ ok: false, error: "Convocatoria no encontrada." }, { status: 404 });
    }

    const limited = consumeRateLimit({
      store: publicRateLimitStore,
      key: publicClientKey(request.headers.get("x-forwarded-for"), `roster-search:${slug}`),
      limit: PUBLIC_SEARCH_LIMIT,
      windowMs: PUBLIC_SEARCH_WINDOW_MS,
      nowMs: Date.now(),
    });
    if (!limited.ok) {
      return NextResponse.json(
        { ok: false, error: "Demasiadas consultas." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }

    const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (foldPersonSearchText(query).length < PUBLIC_ROSTER_MIN_QUERY) {
      return NextResponse.json({ ok: true, students: [], suggestions: [] });
    }

    const { students, suggestions, hasMore, suggestionsHasMore } = await searchConvocatoriaRoster(
      tenant,
      slug,
      query,
      { audience: "public" }
    );
    const secret = selectionRefSecret();
    const exp = Date.now() + SELECTION_TTL_MS;
    const seal = (id: string) =>
      sealSelectionRef({ kind: "roster", tenantId: tenant, subjectId: id, exp }, secret);
    return NextResponse.json({
      ok: true,
      students: students.map((student) => toPublicRosterHit(student, seal(student.id))),
      suggestions: suggestions.map((student) => toPublicRosterHit(student, seal(student.id))),
      hasMore,
      suggestionsHasMore,
    });
  } catch (error) {
    return publicInternalError("roster-search", error);
  }
}
