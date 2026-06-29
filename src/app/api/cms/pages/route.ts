import { NextResponse } from "next/server";
import {
  createPage,
  getAllPagesUncached,
  pageExists,
} from "@/lib/cms/pages";
import { validatePageCreate } from "@/lib/cms/page-validation";
import { normalizeSlug } from "@/lib/cms/page-utils";
import { authorizeApiWrite } from "@/lib/identity/api-guard";
import type { CmsPageCreate } from "@/types/page";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant = searchParams.get("tenant") ?? undefined;
    const pages = await getAllPagesUncached(tenant);
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

    const body = (await request.json()) as CmsPageCreate;
    body.slug = normalizeSlug(body.slug);
    const errors = validatePageCreate(body);

    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    if (await pageExists(body._id)) {
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
