import { NextResponse } from "next/server";
import { requirePlatformOperator } from "@/core/identity";
import { hasPlatformOwnerCapability } from "@/core/identity/platform/capability";
import { setMaintainedUserAccess } from "@/lib/platform/user-maintainer";

export async function POST(request: Request) {
  const ctx = await requirePlatformOperator();
  if (ctx instanceof NextResponse) return ctx;
  if (!hasPlatformOwnerCapability(ctx.user)) {
    return NextResponse.json(
      { ok: false, error: "Solo el dueño cambia el acceso." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    userId?: string;
    status?: string;
  } | null;
  if (!body?.userId || (body.status !== "active" && body.status !== "suspended")) {
    return NextResponse.json({ ok: false, error: "Falta la cuenta." }, { status: 400 });
  }

  try {
    await setMaintainedUserAccess({
      actorUserId: ctx.user._id,
      userId: body.userId,
      status: body.status,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cambiar el acceso.";
    const status = message === "No encontramos esa cuenta." ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
