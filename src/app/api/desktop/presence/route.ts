import { NextResponse } from "next/server";
import { findTenantById } from "@/core/tenant";
import { requireAuth } from "@/core/identity";
import { hasPlatformOperatorCapability } from "@/core/identity/platform/capability";
import { onlineOrganizations, staffIsOnline, type PresenceBeat } from "@/lib/desktop/presence";
import { listPresence, touchPresence } from "@/lib/desktop/presence-store";
import { getDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

async function actorFromSession(): Promise<
  | { userId: string; displayName: string; kind: "staff" | "client"; tenantId: string | null; company: string }
  | NextResponse
> {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;
  if (hasPlatformOperatorCapability(ctx.user)) {
    return {
      userId: ctx.user._id,
      displayName: ctx.user.displayName,
      kind: "staff",
      tenantId: null,
      company: "",
    };
  }
  const tenantId = ctx.tenantId?.trim() ?? "";
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "No hay un Espacio activo." }, { status: 403 });
  }
  const db = await getDatabase();
  const tenant = await findTenantById(db, tenantId);
  return {
    userId: ctx.user._id,
    displayName: ctx.user.displayName,
    kind: "client",
    tenantId,
    company: tenant?.name?.trim() || tenantId,
  };
}

function snapshot(actorKind: "staff" | "client", beats: readonly PresenceBeat[]) {
  const now = Date.now();
  const staffOnline = staffIsOnline(beats, now);
  if (actorKind === "client") {
    return { ok: true as const, staffOnline, online: [] as Array<{ tenantId: string; company: string; names: string[] }> };
  }
  return { ok: true as const, staffOnline, online: onlineOrganizations(beats, now) };
}

export async function GET() {
  const actor = await actorFromSession();
  if (actor instanceof NextResponse) return actor;
  const beats = await listPresence();
  return NextResponse.json(snapshot(actor.kind, beats));
}

export async function POST() {
  const actor = await actorFromSession();
  if (actor instanceof NextResponse) return actor;
  const beat: PresenceBeat = {
    userId: actor.userId,
    kind: actor.kind,
    tenantId: actor.tenantId,
    company: actor.company,
    displayName: actor.displayName.trim() || (actor.kind === "staff" ? "Nelzuri" : "Cliente"),
    seenAt: new Date().toISOString(),
  };
  await touchPresence(beat);
  const beats = await listPresence();
  return NextResponse.json(snapshot(actor.kind, beats));
}
