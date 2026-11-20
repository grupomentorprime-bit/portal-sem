import { NextResponse } from "next/server";
import { requireCongressFinanceCorrect } from "@/app/api/congress/guard";
import { congressPaymentActionMessage } from "@/core/congress/payments";
import type { CongressPaymentMethod } from "@/core/congress/types";
import { isValidPaidOn } from "@/core/congress/payment-dates";
import { reviseCongressPayment } from "@/lib/congress/repository";

const PAYMENT_METHODS: CongressPaymentMethod[] = ["cash", "transfer", "other"];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireCongressFinanceCorrect();
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      payerName?: string;
      method?: CongressPaymentMethod;
      bank?: string | null;
      paidOn?: string;
      receiptRef?: string | null;
      note?: string | null;
      amountClp?: number;
    } | null;

    if (!body?.payerName?.trim() || body.amountClp == null || !body.paidOn) {
      return NextResponse.json({ ok: false, error: "Datos incompletos." }, { status: 400 });
    }
    if (!body.method || !PAYMENT_METHODS.includes(body.method)) {
      return NextResponse.json(
        { ok: false, error: congressPaymentActionMessage("invalid_method") },
        { status: 400 }
      );
    }
    if (!isValidPaidOn(body.paidOn)) {
      return NextResponse.json(
        { ok: false, error: congressPaymentActionMessage("invalid_paid_on") },
        { status: 400 }
      );
    }

    const result = await reviseCongressPayment({
      tenantId: ctx.tenantId,
      paymentId: id,
      actorUserId: ctx.user._id,
      revision: {
        payerName: body.payerName,
        method: body.method,
        bank: body.bank,
        paidOn: body.paidOn,
        receiptRef: body.receiptRef,
        note: body.note,
        amountClp: Number(body.amountClp),
      },
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
