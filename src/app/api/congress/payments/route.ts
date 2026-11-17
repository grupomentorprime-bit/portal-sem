import { NextResponse } from "next/server";
import { requireCongressPayments, requireCongressView } from "@/app/api/congress/guard";
import {
  appendCongressAudit,
  listCongressPayments,
  recordCongressPayment,
} from "@/lib/congress/repository";
import type { CongressPaymentAllocation } from "@/core/congress/types";

export async function GET() {
  try {
    const ctx = await requireCongressView();
    if (ctx instanceof NextResponse) return ctx;
    const items = await listCongressPayments(ctx.tenantId);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireCongressPayments();
    if (ctx instanceof NextResponse) return ctx;

    const body = (await request.json().catch(() => null)) as {
      payerType?: "individual" | "church" | "other";
      payerName?: string;
      churchName?: string | null;
      amountClp?: number;
      receiptRef?: string | null;
      note?: string | null;
      allocations?: CongressPaymentAllocation[];
    } | null;

    if (!body?.payerName || !body.payerType || body.amountClp == null) {
      return NextResponse.json({ ok: false, error: "Datos incompletos." }, { status: 400 });
    }

    const result = await recordCongressPayment({
      tenantId: ctx.tenantId,
      payerType: body.payerType,
      payerName: body.payerName,
      churchName: body.churchName,
      amountClp: Number(body.amountClp),
      receiptRef: body.receiptRef,
      note: body.note,
      allocations: Array.isArray(body.allocations) ? body.allocations : [],
      createdByUserId: ctx.user._id,
    });

    if (!result.ok) {
      const status = result.error === "concurrent_payment" ? 409 : 400;
      return NextResponse.json({ ok: false, error: result.error }, { status });
    }

    await appendCongressAudit({
      tenantId: ctx.tenantId,
      actorUserId: ctx.user._id,
      action: "payment.record",
      entity: "congress_payment",
      entityId: result.payment._id,
      metadata: {
        amountClp: result.payment.amountClp,
        unallocatedClp: result.payment.unallocatedClp,
        allocations: result.payment.allocations,
      },
    });

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
