import { NextResponse } from "next/server";
import { requirePermission, isAuthContext } from "@/core/identity";
import { getSiteConfigForTenant, updateSiteConfig } from "@/lib/cms/config";
import type { SiteConfigPatch } from "@/lib/cms/site-config-patch";

export async function GET() {
  try {
    const ctx = await requirePermission("settings.update");
    if (!isAuthContext(ctx)) return ctx;

    const config = await getSiteConfigForTenant(ctx.tenantId);

    if (!config) {
      return NextResponse.json(
        { ok: false, error: "Configuración institucional no encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, config });
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
    const ctx = await requirePermission("settings.update");
    if (!isAuthContext(ctx)) return ctx;

    const body = (await request.json()) as SiteConfigPatch;
    const result = await updateSiteConfig(body, { tenantId: ctx.tenantId });

    if (!result.ok) {
      if (result.code === "invalid") {
        return NextResponse.json({ ok: false, errors: result.errors }, { status: 400 });
      }
      if (result.code === "conflict") {
        return NextResponse.json(
          { ok: false, error: "La ficha cambió mientras guardabas. Vuelve a intentar." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { ok: false, error: "Configuración institucional no encontrada." },
        { status: 404 }
      );
    }

    const { rebuildUsageIndex } = await import("@/core/media/usage");
    await rebuildUsageIndex(result.config.institution.tenant);

    return NextResponse.json({ ok: true, config: result.config });
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
