import { NextResponse } from "next/server";
import { requirePlatformOperator } from "@/core/identity";
import { hasPlatformOwnerCapability } from "@/core/identity/platform/capability";
import {
  createMaintainedUser,
  listMaintainedUsers,
  updateMaintainedPlatformUser,
} from "@/lib/platform/user-maintainer";
import { isOwnerProfileId } from "@/lib/platform/user-profiles";
import { listPlatformSpaceNames } from "@/lib/platform/spaces";

async function requireOwner() {
  const ctx = await requirePlatformOperator();
  if (ctx instanceof NextResponse) return ctx;
  if (!hasPlatformOwnerCapability(ctx.user)) {
    return NextResponse.json(
      { ok: false, error: "Solo el dueño crea usuarios y perfiles." },
      { status: 403 }
    );
  }
  return ctx;
}

export async function GET() {
  const ctx = await requireOwner();
  if (ctx instanceof NextResponse) return ctx;

  const [users, spaces] = await Promise.all([listMaintainedUsers(), listPlatformSpaceNames()]);
  return NextResponse.json({
    ok: true,
    users,
    spaces,
  });
}

export async function POST(request: Request) {
  const ctx = await requireOwner();
  if (ctx instanceof NextResponse) return ctx;

  const body = (await request.json().catch(() => null)) as {
    displayName?: string;
    email?: string;
    profile?: string;
    tenantId?: string | null;
  } | null;

  if (!body?.profile || !isOwnerProfileId(body.profile)) {
    return NextResponse.json({ ok: false, error: "Elige un perfil." }, { status: 400 });
  }

  try {
    const created = await createMaintainedUser({
      actorUserId: ctx.user._id,
      displayName: body.displayName ?? "",
      email: body.email ?? "",
      profile: body.profile,
      tenantId: body.tenantId,
    });
    return NextResponse.json({ ok: true, user: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el usuario.";
    const status = message === "Ese correo ya tiene cuenta." ? 409 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  const ctx = await requireOwner();
  if (ctx instanceof NextResponse) return ctx;

  const body = (await request.json().catch(() => null)) as {
    userId?: string;
    displayName?: string;
    profile?: string;
  } | null;
  if (
    !body?.userId ||
    (body.profile !== "platform_owner" && body.profile !== "platform_operator")
  ) {
    return NextResponse.json({ ok: false, error: "Elige un perfil." }, { status: 400 });
  }

  try {
    await updateMaintainedPlatformUser({
      actorUserId: ctx.user._id,
      userId: body.userId,
      displayName: body.displayName ?? "",
      profile: body.profile,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar la cuenta.";
    const status = message === "No encontramos esa cuenta." ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
