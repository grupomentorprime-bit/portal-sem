import { NextResponse } from "next/server";
import { requireCongressView } from "@/app/api/congress/guard";
import { listCongressRegistrations } from "@/lib/congress/repository";
import { syncCongressFormSubmissions } from "@/lib/congress/sync-form";

export async function GET(request: Request) {
  try {
    const ctx = await requireCongressView();
    if (ctx instanceof NextResponse) return ctx;

    await syncCongressFormSubmissions(ctx.tenantId);

    const url = new URL(request.url);
    const items = await listCongressRegistrations(ctx.tenantId, {
      q: url.searchParams.get("q") ?? undefined,
      zoneId: url.searchParams.get("zone") ?? undefined,
      churchName: url.searchParams.get("church") ?? undefined,
    });

    const all = await listCongressRegistrations(ctx.tenantId);
    const zones = [...new Set(all.map((r) => r.zoneId).filter(Boolean))]
      .sort()
      .map((id) => ({ id, label: id }));
    const churches = [...new Set(all.map((r) => r.churchName).filter(Boolean))].sort();

    return NextResponse.json({
      ok: true,
      items,
      registrations: items,
      filterOptions: { zones, churches },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
