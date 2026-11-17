import { NextResponse } from "next/server";
import { requireCongressOperate } from "@/app/api/congress/guard";
import { setAssignmentStatus } from "@/lib/congress/lodging";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireCongressOperate();
    if (ctx instanceof NextResponse) return ctx;
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      action?: "confirm" | "cancel";
    } | null;
    if (body?.action !== "confirm" && body?.action !== "cancel") {
      return NextResponse.json({ ok: false, error: "Acción inválida." }, { status: 400 });
    }
    const updated = await setAssignmentStatus({
      tenantId: ctx.tenantId,
      actorUserId: ctx.user._id,
      assignmentId: id,
      action: body.action,
    });
    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "Asignación no encontrada o ya cancelada." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, assignment: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
