import { NextResponse } from "next/server";
import { requireActiveTenant, tenantGuardResponse } from "@/core/security";
import { searchMedia } from "@/lib/cms/media";
import { validateMediaSearch } from "@/lib/cms/media-validation";
import { authorizeApiRead } from "@/lib/identity/api-guard";
import { mediaListUnitIds } from "@/core/units/media-scope";
import type { MediaSearchQuery } from "@/types/media";

export async function POST(request: Request) {
  try {
    const denied = await authorizeApiRead("cms.media.read");
    if (denied) return denied;

    const tenantCheck = await requireActiveTenant();
    if (!tenantCheck.ok) return tenantGuardResponse(tenantCheck);

    const body = (await request.json()) as MediaSearchQuery;
    const requestedUnitId =
      Array.isArray(body.unitIds) && body.unitIds.length === 1 ? body.unitIds[0] : null;
    const unitIds = await mediaListUnitIds(tenantCheck.tenant, requestedUnitId);
    const secured = {
      ...body,
      tenant: tenantCheck.tenant,
      ...(unitIds ? { unitIds } : { unitIds: undefined }),
    };
    const errors = validateMediaSearch(secured);
    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    const result = await searchMedia(secured);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const denied = await authorizeApiRead("cms.media.read");
    if (denied) return denied;

    const tenantCheck = await requireActiveTenant();
    if (!tenantCheck.ok) return tenantGuardResponse(tenantCheck);

    const { searchParams } = new URL(request.url);
    const body: MediaSearchQuery = {
      tenant: tenantCheck.tenant,
      search: searchParams.get("q") ?? undefined,
      folder: searchParams.get("folder") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 24,
    };
    const unitIds = await mediaListUnitIds(tenantCheck.tenant, searchParams.get("unitId"));
    if (unitIds) body.unitIds = unitIds;

    const errors = validateMediaSearch(body);
    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    const result = await searchMedia(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
