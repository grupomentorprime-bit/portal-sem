import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { readCustomWallpaper } from "@/lib/desktop/wallpaper-file";

export const runtime = "nodejs";

export async function GET() {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  const file = await readCustomWallpaper(ctx.user._id);
  if (!file) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file), {
    status: 200,
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
