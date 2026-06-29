import { NextResponse } from "next/server";
import {
  deleteMediaPermanent,
  getMediaById,
  restoreMedia,
  trashMedia,
  updateMedia,
} from "@/lib/cms/media";
import { validateMediaUpdate } from "@/lib/cms/media-validation";
import type { CmsMediaUpdate } from "@/types/media";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const media = await getMediaById(id);
    if (!media) {
      return NextResponse.json({ ok: false, error: "No encontrado." }, { status: 404 });
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

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = (await request.json()) as CmsMediaUpdate & { restore?: boolean };
    const errors = validateMediaUpdate(body);
    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    if (body.restore) {
      const media = await restoreMedia(id);
      if (!media) return NextResponse.json({ ok: false, error: "No encontrado." }, { status: 404 });
      return NextResponse.json({ ok: true, media });
    }

    const media = await updateMedia(id, body);
    if (!media) return NextResponse.json({ ok: false, error: "No encontrado." }, { status: 404 });
    return NextResponse.json({ ok: true, media });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get("permanent") === "true";

    if (permanent) {
      const deleted = await deleteMediaPermanent(id);
      if (!deleted) {
        return NextResponse.json({ ok: false, error: "No encontrado." }, { status: 404 });
      }
      return NextResponse.json({ ok: true, deleted: true });
    }

    const media = await trashMedia(id);
    if (!media) {
      return NextResponse.json({ ok: false, error: "No encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, media });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 403 }
    );
  }
}
