import { NextResponse } from "next/server";
import { CONGRESS_ZONES } from "@/core/congress/constants";
import { requireCongressView } from "@/app/api/congress/guard";
import { mergeCongressChurchOptions } from "@/core/congress/church-name";
import { listCongressChurches } from "@/lib/congress/churches";
import {
  backfillRegistrationEntryNumbers,
  listCongressRegistrations,
} from "@/lib/congress/repository";
import { syncCongressFormSubmissions } from "@/lib/congress/sync-form";
import { loadFormSubmittedAtBySubmissionIds } from "@/lib/congress/form-submitted-at";
import { withFormSubmittedAt } from "@/core/congress/form-engagement";

export async function GET(request: Request) {
  try {
    const ctx = await requireCongressView();
    if (ctx instanceof NextResponse) return ctx;

    try {
      await syncCongressFormSubmissions(ctx.tenantId);
    } catch (syncError) {
      console.error("congress sync (registrations):", syncError);
    }

    try {
      await backfillRegistrationEntryNumbers(ctx.tenantId);
    } catch (entryError) {
      console.error("congress entry numbers (registrations):", entryError);
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

    const churchesByZoneRaw: Record<string, string[]> = {};
    const addChurch = (zone: string, church: string) => {
      const z = zone.trim();
      const c = church.trim();
      if (!z || !c) return;
      const list = churchesByZoneRaw[z] ?? [];
      list.push(c);
      churchesByZoneRaw[z] = list;
    };
    for (const reg of all) addChurch(reg.zoneId, reg.churchName);
    for (const row of catalog) addChurch(row.zoneId, row.churchName);
    const churchesByZone: Record<string, string[]> = {};
    for (const zone of Object.keys(churchesByZoneRaw)) {
      churchesByZone[zone] = mergeCongressChurchOptions(
        churchesByZoneRaw[zone] ?? []
      ).map((o) => o.label);
    }
    const churches = mergeCongressChurchOptions(
      Object.values(churchesByZoneRaw).flat()
    ).map((o) => o.label);

    const submittedAtMap = await loadFormSubmittedAtBySubmissionIds(
      ctx.tenantId,
      items.map((r) => r.submissionId)
    );
    const enriched = withFormSubmittedAt(items, submittedAtMap);

    return NextResponse.json({
      ok: true,
      items: enriched,
      registrations: enriched,
      filterOptions: { zones, churches, churchesByZone },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
