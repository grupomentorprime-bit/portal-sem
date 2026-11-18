import { NextResponse } from "next/server";
import { CONGRESS_ZONES } from "@/core/congress/constants";
import { requireCongressView } from "@/app/api/congress/guard";
import { listCongressChurches } from "@/lib/congress/churches";
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

    const [all, catalog] = await Promise.all([
      listCongressRegistrations(ctx.tenantId),
      listCongressChurches(ctx.tenantId),
    ]);

    const zoneIds = new Set<string>([
      ...CONGRESS_ZONES.map((z) => z.id),
      ...all.map((r) => r.zoneId).filter(Boolean),
      ...catalog.map((c) => c.zoneId).filter(Boolean),
    ]);
    const zones = [...zoneIds]
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

    const churchesByZone: Record<string, string[]> = {};
    const addChurch = (zone: string, church: string) => {
      const z = zone.trim();
      const c = church.trim();
      if (!z || !c) return;
      const list = churchesByZone[z] ?? [];
      if (!list.includes(c)) list.push(c);
      churchesByZone[z] = list;
    };
    for (const reg of all) addChurch(reg.zoneId, reg.churchName);
    for (const row of catalog) addChurch(row.zoneId, row.churchName);
    for (const zone of Object.keys(churchesByZone)) {
      churchesByZone[zone].sort((a, b) => a.localeCompare(b, "es"));
    }
    const churches = [...new Set(Object.values(churchesByZone).flat())].sort((a, b) =>
      a.localeCompare(b, "es")
    );

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
