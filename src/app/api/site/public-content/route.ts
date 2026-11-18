import { NextResponse } from "next/server";
import { getSiteConfigForTenant } from "@/lib/cms/config";
import { resolveMediaRef } from "@/core/media/resolve";
import {
  isPublicContentTenantId,
  PUBLIC_CONTENT_CORS,
  publicSiteContentFromConfig,
} from "@/sites/content/public";

export const dynamic = "force-dynamic";

function corsJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: PUBLIC_CONTENT_CORS });
}

async function resolvePublicImage(
  tenant: string,
  ref: { mediaId?: string; legacyUrl?: string }
): Promise<string> {
  try {
    const result = await Promise.race([
      resolveMediaRef(tenant, ref),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 2500);
      }),
    ]);
    return result ?? "";
  } catch {
    return "";
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: PUBLIC_CONTENT_CORS });
}

export async function GET(request: Request) {
  try {
    const tenant = new URL(request.url).searchParams.get("tenant")?.trim() ?? "";
    if (!isPublicContentTenantId(tenant)) {
      return corsJson({ ok: false, error: "Espacio no válido." }, 400);
    }

    const config = await getSiteConfigForTenant(tenant);
    if (!config) {
      return corsJson({ ok: false, error: "Espacio no encontrado." }, 404);
    }

    const [logo, hero] = await Promise.all([
      resolvePublicImage(tenant, {
        mediaId: config.branding.logoMediaId,
        legacyUrl: config.branding.logo,
      }),
      resolvePublicImage(tenant, {
        mediaId: config.branding.heroMediaId,
        legacyUrl: config.branding.heroImage,
      }),
    ]);

    return corsJson({
      ok: true,
      content: publicSiteContentFromConfig(config, {
        logo,
        hero,
      }),
    });
  } catch (error) {
    console.error(error);
    return corsJson(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      500
    );
  }
}
