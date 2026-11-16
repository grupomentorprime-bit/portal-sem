import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { parseDesktopLayout } from "@/lib/desktop/layout";
import { setDesktopLayout } from "@/lib/desktop/store";

export async function POST(request: Request) {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  const body = (await request.json().catch(() => null)) as { icons?: unknown } | null;
  const icons = parseDesktopLayout(body?.icons);
  if (!body || icons == null) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await setDesktopLayout(ctx.user._id, icons);
  return NextResponse.json({ ok: true, icons });
}
