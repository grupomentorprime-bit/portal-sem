import { NextResponse } from "next/server";
import { CONGRESS_EVENT_ID } from "@/core/congress/constants";
import { requireCongressView } from "@/app/api/congress/guard";
import { buildCongressSummary } from "@/lib/congress/repository";
import { syncCongressFormSubmissions } from "@/lib/congress/sync-form";

export async function GET() {
  try {
    const ctx = await requireCongressView();
    if (ctx instanceof NextResponse) return ctx;

    try {
      await syncCongressFormSubmissions(ctx.tenantId);
    } catch (syncError) {
      // La sincronización no debe tumbar el resumen operativo.
      console.error("congress sync (summary):", syncError);
    }
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
