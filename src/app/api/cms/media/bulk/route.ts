import { NextResponse } from "next/server";
import { requireActiveTenant, tenantGuardResponse } from "@/core/security";
import { bulkMediaAction, getMediaById } from "@/lib/cms/media";
import { validateBulkAction } from "@/lib/cms/media-validation";
import { authorizeApiWrite } from "@/lib/identity/api-guard";
import type { MediaBulkAction } from "@/types/media";

export async function POST(request: Request) {
  try {
    const denied = await authorizeApiWrite("cms.media.update", {
      action: "media.bulk",
      entity: "cms_media",
    });
    if (denied) return denied;

    const tenantCheck = await requireActiveTenant();
    if (!tenantCheck.ok) return tenantGuardResponse(tenantCheck);

    const body = (await request.json()) as MediaBulkAction;
    body.tenant = tenantCheck.tenant;
    const errors = validateBulkAction(body);
    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    for (const id of body.ids) {
      const asset = await getMediaById(id, tenantCheck.tenant);
      if (!asset) {
        return NextResponse.json({ ok: false, error: "No encontrado." }, { status: 404 });
      }
    }

    const affected = await bulkMediaAction(body);
    return NextResponse.json({ ok: true, affected });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
