import { NextResponse } from "next/server";
import { requireCongressFinanceCorrect } from "@/app/api/congress/guard";
import { voidCongressPayment } from "@/lib/congress/repository";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireCongressFinanceCorrect();
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as { reason?: string } | null;
    const reason = String(body?.reason ?? "").trim();
    if (reason.length < 5) {
      return NextResponse.json(
        { ok: false, error: "Debe indicar un motivo de al menos 5 caracteres." },
        { status: 400 }
      );
    }

    const result = await voidCongressPayment({
      tenantId: ctx.tenantId,
      paymentId: id,
      reason,
      actorUserId: ctx.user._id,
    });

    if (!result.ok) {
      const status =
        result.error === "not_found"
          ? 404
          : result.error === "already_voided"
            ? 409
            : 400;
      return NextResponse.json({ ok: false, error: result.error }, { status });
    }

    return NextResponse.json({
      ok: true,
      payment: result.payment,
      updatedRegistrations: result.updated,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
