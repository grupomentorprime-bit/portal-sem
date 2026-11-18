import { NextResponse } from "next/server";
import { requirePlatformOperator } from "@/core/identity";
import { hasPlatformOwnerCapability } from "@/core/identity/platform/capability";
import { PLATFORM_ROLE_CODES } from "@/core/identity/platform/codes";
import { findUserById } from "@/lib/identity/users";
import {
  addAttentionArea,
  normalizeGrant,
  setAttentionAreaActive,
} from "@/lib/desktop/attention";
import {
  readAttentionConfig,
  saveAttentionAreas,
  saveAttentionGrant,
} from "@/lib/desktop/attention-store";
import { listMaintainedUsers } from "@/lib/platform/user-maintainer";

export const dynamic = "force-dynamic";

async function requireOwner() {
  const ctx = await requirePlatformOperator();
  if (ctx instanceof NextResponse) return ctx;
  if (!hasPlatformOwnerCapability(ctx.user)) {
    return NextResponse.json({ ok: false, error: "Solo el dueño configura Atención." }, { status: 403 });
  }
  return ctx;
}

export async function GET() {
  const ctx = await requireOwner();
  if (ctx instanceof NextResponse) return ctx;
  const [config, users] = await Promise.all([readAttentionConfig(), listMaintainedUsers()]);
  const grants = new Map(config.grants.map((grant) => [grant.userId, grant.areaIds]));
  return NextResponse.json({
    ok: true,
    areas: config.areas,
    agents: users
      .filter((user) => user.platformRole === "platform_owner" || user.platformRole === "platform_operator")
      .map((user) => ({
        userId: user.id,
        displayName: user.displayName,
        email: user.email,
        profile: user.platformRole,
        status: user.status,
        areaIds: user.platformRole === "platform_owner" ? config.areas.map((area) => area.id) : grants.get(user.id) ?? [],
      })),
  });
}

export async function POST(request: Request) {
  const ctx = await requireOwner();
  if (ctx instanceof NextResponse) return ctx;
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    name?: string;
    id?: string;
    active?: boolean;
    userId?: string;
    areaIds?: unknown;
  } | null;
  const config = await readAttentionConfig();

  if (body?.action === "add") {
    const added = addAttentionArea(config.areas, body.name ?? "");
    if (!added.ok) {
      const error = added.reason === "duplicate" ? "Esa área ya existe." : "Escribe un nombre de 2 a 60 caracteres.";
      return NextResponse.json({ ok: false, error }, { status: 400 });
    }
    await saveAttentionAreas(added.areas);
    return NextResponse.json({ ok: true, areas: added.areas });
  }

  if (body?.action === "active") {
    const changed = setAttentionAreaActive(config.areas, body.id ?? "", body.active === true);
    if (!changed.ok) {
      const error =
        changed.reason === "comercial"
          ? "Comercial sigue activa porque ahí llegan las solicitudes de aplicaciones."
          : changed.reason === "last"
            ? "Tiene que quedar al menos un área activa."
            : "No se encontró el área.";
      return NextResponse.json({ ok: false, error }, { status: 400 });
    }
    await saveAttentionAreas(changed.areas);
    return NextResponse.json({ ok: true, areas: changed.areas });
  }

  if (body?.action === "grant") {
    const userId = body.userId?.trim() ?? "";
    const user = userId ? await findUserById(userId) : null;
    const operator =
      user?.status === "active" &&
      Array.isArray(user.platformRoles) &&
      user.platformRoles.includes(PLATFORM_ROLE_CODES.OPERATOR) &&
      !user.platformRoles.includes(PLATFORM_ROLE_CODES.OWNER);
    if (!operator) {
      return NextResponse.json({ ok: false, error: "Elige un operador de la plataforma." }, { status: 400 });
    }
    const areaIds = normalizeGrant(body.areaIds, config.areas);
    await saveAttentionGrant(userId, areaIds);
    return NextResponse.json({ ok: true, userId, areaIds });
  }

  return NextResponse.json({ ok: false, error: "No se reconoció la acción." }, { status: 400 });
}
