import { NextResponse } from "next/server";
import { getActiveTenantId } from "@/core/identity";
import { IPN_CHILE_TENANT_ID } from "@/core/units/ipn-chile";
import { foldPersonSearchText } from "@/lib/experience/forms/person-search";
import { searchCongressPublicRoster } from "@/lib/congress/roster-search";
import { publicInternalError } from "@/core/security/public-error";

/** Búsqueda pública de nómina reclamable (nombre + iglesia + zona). */
export async function GET(request: Request) {
  try {
    const tenant = await getActiveTenantId();
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Portal no configurado." }, { status: 503 });
    }
    if (tenant !== IPN_CHILE_TENANT_ID) {
      return NextResponse.json({ ok: false, error: "Formulario no disponible." }, { status: 404 });
    }

    const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (foldPersonSearchText(query).length < 2) {
      return NextResponse.json({
        ok: true,
        matches: [],
        suggestions: [],
        hasMore: false,
        suggestionsHasMore: false,
        registered: [],
        registeredHasMore: false,
      });
    }

    const result = await searchCongressPublicRoster(tenant, query);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return publicInternalError("congress-roster-search", error);
  }
}
