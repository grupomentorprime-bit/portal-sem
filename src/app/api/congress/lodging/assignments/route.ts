import { NextResponse } from "next/server";
import {
  requireCongressOperate,
  requireCongressView,
} from "@/app/api/congress/guard";
import {
  assignBed,
  listAllAssignments,
} from "@/lib/congress/lodging";

export async function GET() {
  try {
    const ctx = await requireCongressView();
    if (ctx instanceof NextResponse) return ctx;
    const items = await listAllAssignments(ctx.tenantId);
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
      homeId?: string;
      registrationId?: string;
      night?: string;
      confirmed?: boolean;
    } | null;
    if (!body?.homeId || !body.registrationId || !body.night) {
      return NextResponse.json({ ok: false, error: "Datos incompletos." }, { status: 400 });
    }
    const result = await assignBed({
      tenantId: ctx.tenantId,
      actorUserId: ctx.user._id,
      homeId: body.homeId,
      registrationId: body.registrationId,
      night: body.night,
      confirmed: body.confirmed,
    });
    if (!result.ok) {
      const status =
        result.error === "capacity_full" || result.error === "concurrent_capacity"
          ? 409
          : 400;
      return NextResponse.json({ ok: false, error: result.error }, { status });
    }
    return NextResponse.json({ ok: true, assignment: result.assignment });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
