import { NextResponse } from "next/server";
import { requireActiveTenant, tenantGuardResponse } from "@/core/security";
import {
  createPage,
  getAllPagesUncached,
  pageExists,
} from "@/lib/cms/pages";
import { validatePageCreate } from "@/lib/cms/page-validation";
import { normalizeSlug } from "@/lib/cms/page-utils";
import { authorizeApiRead, authorizeApiWrite } from "@/lib/identity/api-guard";
import type { CmsPageCreate } from "@/types/page";

export async function GET() {
  try {
    const denied = await authorizeApiRead("cms.pages.read");
    if (denied) return denied;

    const tenantCheck = await requireActiveTenant();
    if (!tenantCheck.ok) return tenantGuardResponse(tenantCheck);

    const pages = await getAllPagesUncached(tenantCheck.tenant);
    return NextResponse.json({ ok: true, pages });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const denied = await authorizeApiWrite("cms.pages.create", {
      action: "page.create",
      entity: "cms_pages",
    });
    if (denied) return denied;

    const tenantCheck = await requireActiveTenant();
    if (!tenantCheck.ok) return tenantGuardResponse(tenantCheck);

    const body = (await request.json()) as CmsPageCreate;
    body.tenant = tenantCheck.tenant;

    body.slug = normalizeSlug(body.slug);
    const errors = validatePageCreate(body);

    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    if (await pageExists(body._id, tenantCheck.tenant)) {
      return NextResponse.json(
        { ok: false, error: `Ya existe una página con id "${body._id}".` },
        { status: 409 }
      );
    }

    const page = await createPage(body);
    const { emitPageCreated } = await import("@/lib/events/cms");
    await emitPageCreated(page).catch(console.error);
    return NextResponse.json({ ok: true, page }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
