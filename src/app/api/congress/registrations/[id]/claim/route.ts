import { NextResponse } from "next/server";
import { requireCongressOperate } from "@/app/api/congress/guard";
import { applyCongressClaimAsOperator } from "@/lib/congress/claim-registration";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await requireCongressOperate();
  if (ctx instanceof NextResponse) return ctx;
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { requestId?: unknown } | null;
  const requestId = String(body?.requestId ?? "").trim();
  if (!requestId) {
    return NextResponse.json({ ok: false, error: "Falta la solicitud." }, { status: 400 });
  }
  const applied = await applyCongressClaimAsOperator({
    tenantId: ctx.tenantId,
    registrationId: id,
    requestId,
    actorUserId: ctx.user._id,
  });
  if (!applied.ok) {
    return NextResponse.json({ ok: false, error: applied.error }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
