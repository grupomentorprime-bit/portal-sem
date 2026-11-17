import { NextResponse } from "next/server";
import { CONGRESS_EVENT_ID } from "@/core/congress/constants";
import { requireCongressView } from "@/app/api/congress/guard";
import { buildCongressSummary } from "@/lib/congress/repository";
import { syncCongressFormSubmissions } from "@/lib/congress/sync-form";

export async function GET() {
  try {
    const ctx = await requireCongressView();
    if (ctx instanceof NextResponse) return ctx;

    await syncCongressFormSubmissions(ctx.tenantId);
    const summary = await buildCongressSummary(ctx.tenantId);

    return NextResponse.json({
      ok: true,
      eventId: CONGRESS_EVENT_ID,
      summary,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
