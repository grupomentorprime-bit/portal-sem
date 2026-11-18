import { NextResponse } from "next/server";
import { requireCongressView } from "@/app/api/congress/guard";
import { listCongressAudit } from "@/lib/congress/repository";

export async function GET() {
  try {
    const ctx = await requireCongressView();
    if (ctx instanceof NextResponse) return ctx;
    const items = await listCongressAudit(ctx.tenantId);
    return NextResponse.json({ ok: true, items, entries: items });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
