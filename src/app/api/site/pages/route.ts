import { NextResponse } from "next/server";
import { isAuthContext, requirePermission } from "@/core/identity";
import {
  editorFields,
  listEditablePages,
  sanitizeStoredContent,
} from "@/sites/content/overlay";
import { getSitePageContent, saveSitePageContent } from "@/sites/content/store";
import { ensureProductionCodedSites } from "@/sites/production";
import { getCodedSite } from "@/sites/registry";

function normalizePath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const path = raw.trim();
  if (!path.startsWith("/")) return null;
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

export async function GET(request: Request) {
  try {
    const ctx = await requirePermission("cms.pages.read");
    if (!isAuthContext(ctx)) return ctx;

    ensureProductionCodedSites();
    const site = getCodedSite(ctx.tenantId);
    const path = normalizePath(new URL(request.url).searchParams.get("path"));

    if (path) {
      const page = site?.pages.find((item) => item.path === path);
      if (!page) {
        return NextResponse.json(
          { ok: false, error: "Página no encontrada." },
          { status: 404 }
        );
      }
      const stored = await getSitePageContent(ctx.tenantId, path);
      return NextResponse.json({
        ok: true,
        page: {
          path: page.path,
          title: page.title,
          navLabel: page.navLabel,
          fields: editorFields(page, stored?.values),
        },
      });
    }

    return NextResponse.json({
      ok: true,
      pages: listEditablePages(site),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const ctx = await requirePermission("cms.pages.update");
    if (!isAuthContext(ctx)) return ctx;

    const body = (await request.json()) as { path?: unknown; values?: unknown };
    const path = normalizePath(body.path);
    if (!path) {
      return NextResponse.json(
        { ok: false, error: "Indique la página que quiere guardar." },
        { status: 400 }
      );
    }
    if (!body.values || typeof body.values !== "object" || Array.isArray(body.values)) {
      return NextResponse.json(
        { ok: false, error: "El contenido no es válido." },
        { status: 400 }
      );
    }

    ensureProductionCodedSites();
    const site = getCodedSite(ctx.tenantId);
    const page = site?.pages.find((item) => item.path === path);
    if (!page) {
      return NextResponse.json(
        { ok: false, error: "Página no encontrada." },
        { status: 404 }
      );
    }

    const sanitized = sanitizeStoredContent(
      page.slots ?? [],
      body.values as Record<string, unknown>
    );
    if (!sanitized.ok) {
      return NextResponse.json({ ok: false, error: sanitized.error }, { status: 400 });
    }

    await saveSitePageContent(ctx.tenantId, path, sanitized.values);
    return NextResponse.json({
      ok: true,
      page: {
        path: page.path,
        title: page.title,
        navLabel: page.navLabel,
        fields: editorFields(page, sanitized.values),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
