import { NextResponse } from "next/server";
import { duplicateMedia } from "@/lib/cms/media";
import { authorizeApiWrite } from "@/lib/identity/api-guard";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const denied = await authorizeApiWrite("cms.media.upload", {
      action: "media.duplicate",
      entity: "cms_media",
    });
    if (denied) return denied;

    const { id } = await params;
    const media = await duplicateMedia(id);
    if (!media) {
      return NextResponse.json({ ok: false, error: "No se pudo duplicar." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, media });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
