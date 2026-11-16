import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { readAvatarPhoto } from "@/lib/desktop/avatar-file";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  const userId = new URL(request.url).searchParams.get("userId")?.trim() || ctx.user._id;
  const file = await readAvatarPhoto(userId);
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
