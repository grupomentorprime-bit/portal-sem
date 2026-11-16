import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { customAvatarUrl, parseAvatarPresetId } from "@/lib/desktop/avatar-catalog";
import {
  clearAvatarPhoto,
  clearDesktopAvatar,
  saveAvatarPhoto,
  setAvatarPreset,
} from "@/lib/desktop/store";
import {
  AvatarUploadError,
  deleteAvatarPhoto,
  readAvatarPhoto,
  storeAvatarPhoto,
} from "@/lib/desktop/avatar-file";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    return uploadAvatar(ctx.user._id, request);
  }

  const body = (await request.json().catch(() => null)) as {
    presetId?: unknown;
  } | null;

  const presetId =
    typeof body?.presetId === "string" && body.presetId.trim()
      ? parseAvatarPresetId(body.presetId)
      : null;
  if (!presetId) {
    return NextResponse.json(
      { ok: false, error: "Elige un avatar válido." },
      { status: 400 }
    );
  }

  await setAvatarPreset(ctx.user._id, presetId);
  return NextResponse.json({ ok: true, presetId });
}

export async function DELETE(request: Request) {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  const body = (await request.json().catch(() => null)) as {
    clear?: unknown;
  } | null;
  const clear = body?.clear === undefined ? "photo" : body.clear;
  if (clear !== "photo" && clear !== "all") {
    return NextResponse.json(
      { ok: false, error: "No se pudo actualizar el avatar." },
      { status: 400 }
    );
  }

  await deleteAvatarPhoto(ctx.user._id);
  if (clear === "all") {
    await clearDesktopAvatar(ctx.user._id);
  } else {
    await clearAvatarPhoto(ctx.user._id);
  }
  return NextResponse.json({ ok: true, clear });
}

async function uploadAvatar(userId: string, request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Elige una imagen." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await storeAvatarPhoto(userId, buffer, file.type || "application/octet-stream");
    await saveAvatarPhoto(userId, saved.updatedAt);
    return NextResponse.json({
      ok: true,
      url: customAvatarUrl(undefined, saved.updatedAt),
      width: saved.width,
      height: saved.height,
      savedWidth: saved.savedWidth,
      savedHeight: saved.savedHeight,
    });
  } catch (error) {
    if (error instanceof AvatarUploadError) {
      return NextResponse.json(
        { ok: false, error: error.message, width: error.width, height: error.height },
        { status: 400 }
      );
    }
    console.error(error);
    return NextResponse.json({ ok: false, error: "No se pudo guardar el avatar." }, { status: 500 });
  }
}
