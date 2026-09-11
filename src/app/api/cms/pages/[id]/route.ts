import { NextResponse } from "next/server";
import { requireActiveTenant, tenantGuardResponse } from "@/core/security";
import {
  deletePage,
  duplicatePage,
  getPageByIdUncached,
  pageSlugExists,
  updatePage,
} from "@/lib/cms/pages";
import { validatePageUpdate } from "@/lib/cms/page-validation";
import { normalizeSlug } from "@/lib/cms/page-utils";
import { authorizeApiRead, authorizeApiWrite } from "@/lib/identity/api-guard";
import { requirePermission, isAuthContext } from "@/core/identity";
import { syncPageWorkflow } from "@/lib/workflow/integration";
import type { CmsPageUpdate } from "@/types/page";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function loadPageForActiveTenant(id: string) {
  const tenantCheck = await requireActiveTenant();
  if (!tenantCheck.ok) {
    return { error: tenantGuardResponse(tenantCheck) } as const;
  }
  const page = await getPageByIdUncached(id, tenantCheck.tenant);
  if (!page) {
    return {
      error: NextResponse.json({ ok: false, error: "Página no encontrada." }, { status: 404 }),
    } as const;
  }
  return { page, tenantId: tenantCheck.tenant } as const;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const denied = await authorizeApiRead("cms.pages.read");
    if (denied) return denied;

    const { id } = await params;
    const loaded = await loadPageForActiveTenant(id);
    if ("error" in loaded) return loaded.error;

    return NextResponse.json({ ok: true, page: loaded.page });
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
    const loaded = await loadPageForActiveTenant(id);
    if ("error" in loaded) return loaded.error;
    const existing = loaded.page;
    const tenantId = loaded.tenantId;

    const body = (await request.json()) as CmsPageUpdate & {
      duplicateAs?: { newId: string; newTitle: string; newSlug: string };
      publish?: boolean;
    };

    if (body.duplicateAs) {
      const duplicated = await duplicatePage(
        id,
        tenantId,
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

    if (body.slug && (await pageSlugExists(body.slug, tenantId, id))) {
      return NextResponse.json(
        { ok: false, error: `Ya existe una página con slug "${body.slug}".` },
        { status: 409 }
      );
    }

    const saveVersion = body.publish === true || body.status === "published";
    const page = await updatePage(id, tenantId, body, { saveVersion });

    if (page) {
      const { rebuildUsageIndex } = await import("@/core/media/usage");
      await rebuildUsageIndex(page.tenant);

      const { emitPageStatusChange } = await import("@/lib/events/cms");
      const authCtx = await requirePermission("cms.pages.update");
      const userId = authCtx instanceof NextResponse ? undefined : authCtx.user._id;
      await emitPageStatusChange(page, existing.status, userId).catch(console.error);

      if (body.status) {
        const auth = await requirePermission("workflow.transition");
        if (isAuthContext(auth)) {
          await syncPageWorkflow(auth, id, body.status).catch(console.error);
        }
      }
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
    const loaded = await loadPageForActiveTenant(id);
    if ("error" in loaded) return loaded.error;

    const deleted = await deletePage(id, loaded.tenantId);
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
