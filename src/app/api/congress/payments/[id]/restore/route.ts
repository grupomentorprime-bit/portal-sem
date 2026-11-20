import { NextResponse } from "next/server";
import { requireCongressFinanceCorrect } from "@/app/api/congress/guard";
import { congressPaymentActionMessage } from "@/core/congress/payments";
import { restoreCongressPayment } from "@/lib/congress/repository";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireCongressFinanceCorrect();
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await context.params;
    const result = await restoreCongressPayment({
      tenantId: ctx.tenantId,
      paymentId: id,
      actorUserId: ctx.user._id,
    });

    if (!result.ok) {
      const status = result.error === "not_found" ? 404 : result.error === "concurrent_payment" ? 409 : 400;
      return NextResponse.json(
        { ok: false, error: congressPaymentActionMessage(result.error) },
        { status }
      );
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
