import { NextResponse } from "next/server";
import { requireCongressOperate } from "@/app/api/congress/guard";
import { reassignBed } from "@/lib/congress/lodging";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireCongressOperate();
    if (ctx instanceof NextResponse) return ctx;
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      homeId?: string;
      night?: string;
    } | null;
    if (!body?.homeId) {
      return NextResponse.json({ ok: false, error: "homeId obligatorio." }, { status: 400 });
    }
    const result = await reassignBed({
      tenantId: ctx.tenantId,
      actorUserId: ctx.user._id,
      assignmentId: id,
      homeId: body.homeId,
      night: body.night,
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 409 });
    }
    return NextResponse.json({ ok: true, assignment: result.assignment });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
