import { NextResponse } from "next/server";
import { requireCongressView } from "@/app/api/congress/guard";
import { listCongressChurches } from "@/lib/congress/churches";

export async function GET(request: Request) {
  try {
    const ctx = await requireCongressView();
    if (ctx instanceof NextResponse) return ctx;

    const zone = new URL(request.url).searchParams.get("zone") ?? undefined;
    const churches = await listCongressChurches(ctx.tenantId, zone ?? undefined);
    return NextResponse.json({
      ok: true,
      churches: churches.map((c) => ({
        zoneId: c.zoneId,
        churchName: c.churchName,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
