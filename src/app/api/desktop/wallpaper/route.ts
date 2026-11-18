import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { parseWallpaper } from "@/lib/desktop/catalog";
import {
  clearCustomDesktopWallpaper,
  saveCustomDesktopWallpaper,
  setDesktopWallpaper,
} from "@/lib/desktop/store";
import {
  deleteCustomWallpaper,
  readCustomWallpaper,
  storeCustomWallpaper,
  WallpaperUploadError,
} from "@/lib/desktop/wallpaper-file";
import { customWallpaperUrl } from "@/lib/desktop/wallpaper-upload";

export async function POST(request: Request) {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    return uploadWallpaper(ctx.user._id, request);
  }

  const body = (await request.json().catch(() => null)) as {
    wallpaper?: unknown;
  } | null;

  if (body?.wallpaper === "custom") {
    const file = await readCustomWallpaper(ctx.user._id);
    if (!file) {
      return NextResponse.json(
        { ok: false, error: "Todavía no hay un fondo propio." },
        { status: 400 }
      );
    }
    await setDesktopWallpaper(ctx.user._id, "custom");
    return NextResponse.json({
      ok: true,
      wallpaper: "custom",
      url: customWallpaperUrl(ctx.user.desktopWallpaperUpdatedAt),
    });
  }

  const wallpaper = parseWallpaper(body?.wallpaper);
  if (body?.wallpaper !== wallpaper) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await setDesktopWallpaper(ctx.user._id, wallpaper);
  return NextResponse.json({ ok: true, wallpaper });
}

export async function DELETE() {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  await deleteCustomWallpaper(ctx.user._id);
  const wallpaper = await clearCustomDesktopWallpaper(ctx.user._id);
  return NextResponse.json({ ok: true, wallpaper });
}

async function uploadWallpaper(userId: string, request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Elige una imagen." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await storeCustomWallpaper(userId, buffer, file.type || "application/octet-stream");
    await saveCustomDesktopWallpaper(userId, saved.updatedAt);
    return NextResponse.json({
      ok: true,
      wallpaper: "custom",
      url: customWallpaperUrl(saved.updatedAt),
      width: saved.width,
      height: saved.height,
      savedWidth: saved.savedWidth,
      savedHeight: saved.savedHeight,
    });
  } catch (error) {
    if (error instanceof WallpaperUploadError) {
      return NextResponse.json(
        { ok: false, error: error.message, width: error.width, height: error.height },
        { status: 400 }
      );
    }
    console.error(error);
    return NextResponse.json({ ok: false, error: "No se pudo guardar el fondo." }, { status: 500 });
  }
}
