import { NextResponse } from "next/server";
import { getActiveTenantId } from "@/core/identity";
import {
  PUBLIC_SEARCH_LIMIT,
  PUBLIC_SEARCH_WINDOW_MS,
  consumeSharedRateLimit,
  publicClientKey,
} from "@/core/security/public-rate-limit";
import { publicInternalError } from "@/core/security/public-error";
import { redeemAccreditedContactChallenge } from "@/lib/congress/claim-registration";

export async function POST(request: Request) {
  try {
    const tenant = await getActiveTenantId();
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Portal no configurado." }, { status: 503 });
    }
    const limited = await consumeSharedRateLimit({
      key: publicClientKey(request.headers.get("x-forwarded-for"), "claim-redeem"),
      limit: PUBLIC_SEARCH_LIMIT,
      windowMs: PUBLIC_SEARCH_WINDOW_MS,
    });
    if (!limited.ok) {
      return NextResponse.json(
        { ok: false, error: "Demasiadas consultas." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }
    const body = (await request.json().catch(() => null)) as {
      requestId?: unknown;
      token?: unknown;
    } | null;
    const requestId = String(body?.requestId ?? "").trim();
    const token = String(body?.token ?? "").trim();
    if (!requestId || !token) {
      return NextResponse.json({ ok: false, error: "Código no válido." }, { status: 400 });
    }
    const redeemed = await redeemAccreditedContactChallenge({ tenantId: tenant, requestId, token });
    if (!redeemed.ok) {
      return NextResponse.json({ ok: false, error: "Código no válido." }, { status: 403 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return publicInternalError("congress-claim-redeem", error);
  }
}
