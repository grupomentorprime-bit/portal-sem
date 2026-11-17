import { NextResponse } from "next/server";
import {
  requireCongressOperate,
  requireCongressView,
} from "@/app/api/congress/guard";
import { listLodgingHomes, upsertLodgingHome } from "@/lib/congress/lodging";
import type { CongressNight } from "@/core/congress/constants";

export async function GET() {
  try {
    const ctx = await requireCongressView();
    if (ctx instanceof NextResponse) return ctx;
    const items = await listLodgingHomes(ctx.tenantId);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireCongressOperate();
    if (ctx instanceof NextResponse) return ctx;
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
