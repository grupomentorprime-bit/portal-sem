import { NextResponse } from "next/server";
import { requireCongressPayments } from "@/app/api/congress/guard";
import { ensureCongressPaymentFolio } from "@/lib/congress/repository";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireCongressPayments();
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await context.params;
    const result = await ensureCongressPaymentFolio({
      tenantId: ctx.tenantId,
      paymentId: id,
    });

    if (!result.ok) {
      const status = result.error === "not_found" ? 404 : 500;
      return NextResponse.json({ ok: false, error: result.error }, { status });
    }

    return NextResponse.json({ ok: true, payment: result.payment });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}