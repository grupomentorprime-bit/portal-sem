import { NextResponse } from "next/server";
import { assertActiveTenant, tenantGuardResponse } from "@/core/security";
import { replaceMediaFile } from "@/lib/cms/media";
import { writeMediaAudit } from "@/lib/cms/media-audit";
import { validateMediaUpload } from "@/lib/cms/media-validation";
import { buildOptimizationSummary } from "@/lib/cms/media-optimization";
import { authorizeApiWrite } from "@/lib/identity/api-guard";
import { requirePermission } from "@/core/identity";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const denied = await authorizeApiWrite("cms.media.update");
    if (denied) return denied;

    const ctx = await requirePermission("cms.media.update");
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file");
    const tenantParam = String(formData.get("tenant") ?? "");

    const tenantCheck = await assertActiveTenant(tenantParam);
    if (!tenantCheck.ok) return tenantGuardResponse(tenantCheck);

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Archivo requerido." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/octet-stream";
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

    const errors = validateMediaUpload({
      tenant: tenantCheck.tenant,
      mimeType,
      extension,
      size: buffer.length,
    });
    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    const originalBytes = buffer.length;
    const media = await replaceMediaFile(id, {
      tenant: tenantCheck.tenant,
      buffer,
      originalName: file.name,
      mimeType,
    });

    if (!media) {
      return NextResponse.json({ ok: false, error: "No encontrado." }, { status: 404 });
    }

    if (!ctx.compatMode) {
      await writeMediaAudit({
        tenantId: tenantCheck.tenant,
        userId: ctx.user._id,
        action: "media.replace",
        mediaId: id,
        metadata: { filename: file.name, mimeType, size: buffer.length },
      });
    }

    return NextResponse.json({
      ok: true,
      media,
      optimization: buildOptimizationSummary(media, originalBytes),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
