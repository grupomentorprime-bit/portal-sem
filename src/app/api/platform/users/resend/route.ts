import { NextResponse } from "next/server";
import { requirePlatformOperator } from "@/core/identity";
import { hasPlatformOwnerCapability } from "@/core/identity/platform/capability";
import { resendMaintainedUserAccess } from "@/lib/platform/user-maintainer";

export async function POST(request: Request) {
  const ctx = await requirePlatformOperator();
  if (ctx instanceof NextResponse) return ctx;
  if (!hasPlatformOwnerCapability(ctx.user)) {
    return NextResponse.json(
      { ok: false, error: "Solo el dueño reenvía el acceso." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as { userId?: string } | null;
  const userId = body?.userId?.trim() ?? "";
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Falta la cuenta." }, { status: 400 });
  }

  try {
    const user = await resendMaintainedUserAccess({
      actorUserId: ctx.user._id,
      userId,
    });
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo reenviar el acceso.";
    const status = message === "No encontramos esa cuenta." ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
