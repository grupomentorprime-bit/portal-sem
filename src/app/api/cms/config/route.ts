import { NextResponse } from "next/server";
import { getSiteConfigUncached, updateSiteConfig } from "@/lib/cms/config";
import { validateSiteConfigUpdate } from "@/lib/cms/validation";
import type { SiteConfigUpdate } from "@/types/cms";

export async function GET() {
  try {
    const config = await getSiteConfigUncached();

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
    const body = (await request.json()) as SiteConfigUpdate;
    const errors = validateSiteConfigUpdate(body);

    if (errors.length > 0) {
      return NextResponse.json(
        { ok: false, errors },
        { status: 400 }
      );
    }

    const config = await updateSiteConfig(body);

    if (!config) {
      return NextResponse.json(
        { ok: false, error: "Configuración institucional no encontrada." },
        { status: 404 }
      );
    }

    const { rebuildUsageIndex } = await import("@/core/media/usage");
    await rebuildUsageIndex(config.institution.tenant);

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
