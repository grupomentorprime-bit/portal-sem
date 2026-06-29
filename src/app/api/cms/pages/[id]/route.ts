import { NextResponse } from "next/server";
import {
  deletePage,
  duplicatePage,
  getPageByIdUncached,
  pageSlugExists,
  updatePage,
} from "@/lib/cms/pages";
import { validatePageUpdate } from "@/lib/cms/page-validation";
import { normalizeSlug } from "@/lib/cms/page-utils";
import { authorizeApiWrite } from "@/lib/identity/api-guard";
import type { CmsPageUpdate } from "@/types/page";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const page = await getPageByIdUncached(id);
    if (!page) {
      return NextResponse.json({ ok: false, error: "Página no encontrada." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, page });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const denied = await authorizeApiWrite("cms.pages.update", {
      action: "page.update",
      entity: "cms_pages",
    });
    if (denied) return denied;

    const { id } = await params;
    const body = (await request.json()) as CmsPageUpdate & {
      duplicateAs?: { newId: string; newTitle: string; newSlug: string };
      publish?: boolean;
    };

    if (body.duplicateAs) {
      const duplicated = await duplicatePage(
        id,
        body.duplicateAs.newId,
        body.duplicateAs.newTitle,
        normalizeSlug(body.duplicateAs.newSlug)
      );
      if (!duplicated) {
        return NextResponse.json({ ok: false, error: "Página no encontrada." }, { status: 404 });
      }
      return NextResponse.json({ ok: true, page: duplicated });
    }

    if (body.slug) body.slug = normalizeSlug(body.slug);

    const errors = validatePageUpdate(body);
    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    const existing = await getPageByIdUncached(id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Página no encontrada." }, { status: 404 });
    }

    if (
      body.slug &&
      (await pageSlugExists(body.slug, existing.tenant, id))
    ) {
      return NextResponse.json(
        { ok: false, error: `Ya existe una página con slug "${body.slug}".` },
        { status: 409 }
      );
    }

    const saveVersion = body.publish === true || body.status === "published";
    const page = await updatePage(id, body, { saveVersion });

    if (page) {
      const { rebuildUsageIndex } = await import("@/core/media/usage");
      await rebuildUsageIndex(page.tenant);
    }

    return NextResponse.json({ ok: true, page });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const denied = await authorizeApiWrite("cms.pages.delete", {
      action: "page.delete",
      entity: "cms_pages",
    });
    if (denied) return denied;

    const { id } = await params;
    const deleted = await deletePage(id);
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "Página no encontrada." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
