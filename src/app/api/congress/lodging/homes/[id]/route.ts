import { NextResponse } from "next/server";
import { requireCongressOperate } from "@/app/api/congress/guard";
import { upsertLodgingHome } from "@/lib/congress/lodging";
import type { CongressNight } from "@/core/congress/constants";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireCongressOperate();
    if (ctx instanceof NextResponse) return ctx;
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      name?: string;
      contactName?: string;
      contactPhone?: string;
      address?: string;
      notes?: string;
      capacityByNight?: Partial<Record<CongressNight, number>>;
    } | null;
    if (!body?.name?.trim()) {
      return NextResponse.json({ ok: false, error: "Nombre obligatorio." }, { status: 400 });
    }
    const home = await upsertLodgingHome({
      tenantId: ctx.tenantId,
      actorUserId: ctx.user._id,
      homeId: id,
      name: body.name,
      contactName: body.contactName,
      contactPhone: body.contactPhone,
      address: body.address,
      notes: body.notes,
      capacityByNight: body.capacityByNight ?? {},
    });
    return NextResponse.json({ ok: true, home });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
