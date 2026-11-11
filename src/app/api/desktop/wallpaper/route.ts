import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { parseWallpaper } from "@/lib/desktop/catalog";
import { setDesktopWallpaper } from "@/lib/desktop/store";

export async function POST(request: Request) {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  const body = (await request.json().catch(() => null)) as {
    wallpaper?: unknown;
  } | null;
  const wallpaper = parseWallpaper(body?.wallpaper);
  if (body?.wallpaper !== wallpaper) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await setDesktopWallpaper(ctx.user._id, wallpaper);
  return NextResponse.json({ ok: true, wallpaper });
}
