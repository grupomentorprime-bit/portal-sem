import { NextResponse } from "next/server";
import { requireCongressView } from "@/app/api/congress/guard";
import { listCongressRegistrations } from "@/lib/congress/repository";
import { syncCongressFormSubmissions } from "@/lib/congress/sync-form";

export async function GET(request: Request) {
  try {
    const ctx = await requireCongressView();
    if (ctx instanceof NextResponse) return ctx;

    try {
      await syncCongressFormSubmissions(ctx.tenantId);
    } catch (syncError) {
      console.error("congress sync (registrations):", syncError);
    }

    const url = new URL(request.url);
    const items = await listCongressRegistrations(ctx.tenantId, {
      q: url.searchParams.get("q") ?? undefined,
      zoneId: url.searchParams.get("zone") ?? undefined,
      churchName: url.searchParams.get("church") ?? undefined,
    });

    const all = await listCongressRegistrations(ctx.tenantId);
    const zones = [...new Set(all.map((r) => r.zoneId).filter(Boolean))]
      .sort((a, b) => {
        const na = Number(a.replace(/\D/g, "")) || 0;
        const nb = Number(b.replace(/\D/g, "")) || 0;
        return na - nb;
      })
      .map((id) => {
        const match = id.match(/^zona-(\d+)$/i);
        return {
          id,
          label: match ? `Zona ${String(Number(match[1])).padStart(2, "0")}` : id,
        };
      });
    const churches = [...new Set(all.map((r) => r.churchName).filter(Boolean))].sort();
    const churchesByZone: Record<string, string[]> = {};
    for (const reg of all) {
      const zone = reg.zoneId?.trim();
      const church = reg.churchName?.trim();
      if (!zone || !church) continue;
      const list = churchesByZone[zone] ?? [];
      if (!list.includes(church)) list.push(church);
      churchesByZone[zone] = list;
    }
    for (const zone of Object.keys(churchesByZone)) {
      churchesByZone[zone].sort((a, b) => a.localeCompare(b, "es"));
    }

    return NextResponse.json({
      ok: true,
      items,
      registrations: items,
      filterOptions: { zones, churches, churchesByZone },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
