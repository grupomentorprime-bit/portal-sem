import { NextResponse } from "next/server";
import { getActiveTenantId } from "@/core/identity";
import { CONGRESS_ZONES } from "@/core/congress/constants";
import { listCongressChurches } from "@/lib/congress/churches";
import { listCongressChurchLabels } from "@/lib/congress/repository";
import {
  PUBLIC_SEARCH_LIMIT,
  PUBLIC_SEARCH_WINDOW_MS,
  consumeRateLimit,
  publicClientKey,
  publicRateLimitStore,
} from "@/core/security/public-rate-limit";
import { publicInternalError } from "@/core/security/public-error";

/** Catálogo público de ILEUs del congreso (sin datos personales). */
export async function GET(request: Request) {
  try {
    const tenant = await getActiveTenantId();
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Portal no configurado." }, { status: 503 });
    }

    const zone = new URL(request.url).searchParams.get("zone")?.trim() || undefined;
    const limited = consumeRateLimit({
      store: publicRateLimitStore,
      key: publicClientKey(request.headers.get("x-forwarded-for"), "congress-churches"),
      limit: PUBLIC_SEARCH_LIMIT,
      windowMs: PUBLIC_SEARCH_WINDOW_MS,
      nowMs: Date.now(),
    });
    if (!limited.ok) {
      return NextResponse.json(
        { ok: false, error: "Demasiadas consultas." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }
    const [catalog, regs] = await Promise.all([
      listCongressChurches(tenant, zone),
      listCongressChurchLabels(tenant, zone ? { zoneId: zone } : {}),
    ]);

    const byZone: Record<string, string[]> = {};
    const add = (zoneId: string, churchName: string) => {
      const z = zoneId.trim();
      const c = churchName.trim();
      if (!z || !c) return;
      if (zone && z !== zone) return;
      const list = byZone[z] ?? [];
      if (!list.includes(c)) list.push(c);
      byZone[z] = list;
    };
    for (const row of catalog) add(row.zoneId, row.churchName);
    for (const reg of regs) add(reg.zoneId, reg.churchName);
    for (const key of Object.keys(byZone)) {
      byZone[key].sort((a, b) => a.localeCompare(b, "es"));
    }

    return NextResponse.json({
      ok: true,
      zones: CONGRESS_ZONES,
      churchesByZone: byZone,
      churches: zone ? byZone[zone] ?? [] : Object.values(byZone).flat(),
    });
  } catch (error) {
    return publicInternalError("congress-churches", error);
  }
}
