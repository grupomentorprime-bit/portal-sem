import { NextResponse } from "next/server";
import { requirePlatformOperator } from "@/core/identity";
import { hasPlatformOwnerCapability } from "@/core/identity/platform/capability";
import { deleteMaintainedPlatformUser } from "@/lib/platform/user-maintainer";

export async function POST(request: Request) {
  const ctx = await requirePlatformOperator();
  if (ctx instanceof NextResponse) return ctx;
  if (!hasPlatformOwnerCapability(ctx.user)) {
    return NextResponse.json(
      { ok: false, error: "Solo el dueño elimina cuentas." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as { userId?: string } | null;
  const userId = body?.userId?.trim() ?? "";
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Falta la cuenta." }, { status: 400 });
  }

  try {
    await deleteMaintainedPlatformUser({ actorUserId: ctx.user._id, userId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo eliminar la cuenta.";
    const status = message === "No encontramos esa cuenta." ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
