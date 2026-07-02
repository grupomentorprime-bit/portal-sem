import { NextResponse } from "next/server";
import {
  deleteMediaPermanent,
  getMediaById,
  restoreMedia,
  trashMedia,
  updateMedia,
} from "@/lib/cms/media";
import { writeMediaAudit } from "@/lib/cms/media-audit";
import { validateMediaUpdate } from "@/lib/cms/media-validation";
import { authorizeApiWrite } from "@/lib/identity/api-guard";
import { requirePermission } from "@/core/identity";
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
    const denied = await authorizeApiWrite("cms.media.update");
    if (denied) return denied;

    const ctx = await requirePermission("cms.media.update");
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await params;
    const body = (await request.json()) as CmsMediaUpdate & { restore?: boolean };
    const errors = validateMediaUpdate(body);
    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    if (body.restore) {
      const media = await restoreMedia(id);
      if (!media) return NextResponse.json({ ok: false, error: "No encontrado." }, { status: 404 });
      const { emitMediaRestoreRequested } = await import("@/lib/events/media");
      await emitMediaRestoreRequested(media).catch(console.error);
      if (!ctx.compatMode) {
        await writeMediaAudit({
          tenantId: media.tenant,
          userId: ctx.user._id,
          action: "media.restore",
          mediaId: id,
        });
      }
      return NextResponse.json({ ok: true, media });
    }

    const media = await updateMedia(id, body);
    if (!media) return NextResponse.json({ ok: false, error: "No encontrado." }, { status: 404 });

    if (!ctx.compatMode) {
      let action = "media.update";
      if (body.originalName) action = "media.rename";
      else if (body.folder) action = "media.move";
      else if (body.tags) action = "media.tag";
      else if (body.favorite !== undefined) action = "media.favorite";

      await writeMediaAudit({
        tenantId: media.tenant,
        userId: ctx.user._id,
        action,
        mediaId: id,
        metadata: { patch: body },
      });
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

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const denied = await authorizeApiWrite("cms.media.delete");
    if (denied) return denied;

    const ctx = await requirePermission("cms.media.delete");
    if (ctx instanceof NextResponse) return ctx;

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

    if (!ctx.compatMode) {
      await writeMediaAudit({
        tenantId: media.tenant,
        userId: ctx.user._id,
        action: "media.delete",
        mediaId: id,
        metadata: { visibility: "trash" },
      });
    }

    return NextResponse.json({ ok: true, media });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    const inUse = message.includes("en uso");
    return NextResponse.json(
      { ok: false, error: message },
      { status: inUse ? 409 : 403 }
    );
  }
}
