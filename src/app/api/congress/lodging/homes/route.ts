import { NextResponse } from "next/server";
import {
  requireCongressOperate,
  requireCongressView,
} from "@/app/api/congress/guard";
import {
  listLodgingHomes,
  lodgingContactPhoneForSave,
  upsertLodgingHome,
} from "@/lib/congress/lodging";
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
    const capacityByNight = body.capacityByNight ?? {};
    const bedCounts = Object.values(capacityByNight).map((n) =>
      Math.max(0, Math.trunc(Number(n ?? 0)))
    );
    if (bedCounts.length === 0 || bedCounts.every((n) => n === 0)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Indique el número de camas (cupos) por noche. Al menos una noche debe tener 1 o más.",
        },
        { status: 400 }
      );
    }
    const phone = lodgingContactPhoneForSave(body.contactPhone);
    if (!phone.ok) {
      return NextResponse.json({ ok: false, error: phone.error }, { status: 400 });
    }
    const home = await upsertLodgingHome({
      tenantId: ctx.tenantId,
      actorUserId: ctx.user._id,
      name: body.name,
      contactName: body.contactName,
      contactPhone: phone.phone,
      address: body.address,
      notes: body.notes,
      capacityByNight,
    });
    return NextResponse.json({ ok: true, home });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
