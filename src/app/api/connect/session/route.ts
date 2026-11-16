import { headers as requestHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { readConnectAccess } from "@/lib/connect/access";
import { allowedCumpleBase } from "@/lib/connect/desk";
import {
  evaluateConnectAccess,
  isCumpleRequestHost,
  productSessionVerdict,
} from "@/lib/connect/policy";
import { deleteSession, getSessionById, getSessionIdFromCookie } from "@/lib/identity/sessions";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };

/**
 * Única lectura de la sesión de Cumple.
 * No devuelve perfil, permisos ni otros Espacios. Si el plan o la llave ya no están, la borra.
 */
export async function GET() {
  const sessionId = await getSessionIdFromCookie();
  const session = sessionId ? await getSessionById(sessionId) : null;
  if (!session || session.audience !== "cumple") {
    return NextResponse.json({ ok: false }, { status: 401, headers });
  }

  const headerBag = await requestHeaders();
  const host = headerBag.get("x-forwarded-host") ?? headerBag.get("host");
  const base = allowedCumpleBase();
  const hostIsCumple = isCumpleRequestHost(host, base) || isCumpleRequestHost(host, null);
  const access = hostIsCumple
    ? await readConnectAccess({
        userId: session.userId,
        tenantId: session.tenantId,
        appId: "cumple",
      })
    : null;
  const decision = access
    ? evaluateConnectAccess({ ...access, appId: "cumple", tenantId: session.tenantId })
    : null;
  const verdict = productSessionVerdict({
    audience: session.audience,
    hostIsCumple,
    access: decision,
  });
  if (verdict === "revoke") await deleteSession(session._id);
  if (verdict !== "allow") {
    return NextResponse.json({ ok: false }, { status: 401, headers });
  }
  return NextResponse.json({ ok: true }, { headers });
}
