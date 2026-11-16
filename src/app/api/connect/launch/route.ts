import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { auditConnect } from "@/lib/connect/audit";
import { readConnectAccess } from "@/lib/connect/access";
import { issueLaunchCode } from "@/lib/connect/protocol";
import { deskOriginFromEnv } from "@/lib/connect/desk";
import { readConnectSecret } from "@/lib/connect/secret";
import { mongoLaunchCodeStore } from "@/lib/connect/store";
import { publicInternalError } from "@/core/security/public-error";

export const dynamic = "force-dynamic";

/**
 * Emite el código de Cumple. Keycloak sigue siendo el IdP de la sesión del escritorio;
 * este paso no abre otro proveedor ni acepta un destino elegido por el navegador.
 */
export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  let appId = "";
  try {
    const body = (await request.json()) as { appId?: unknown };
    appId = typeof body.appId === "string" ? body.appId : "";
  } catch {
    appId = "";
  }

  try {
    const access = await readConnectAccess({
      userId: auth.user._id,
      tenantId: auth.tenantId,
      appId,
    });
    const contractedApps = access.contractedApps;
    const issued = await issueLaunchCode({
      now: new Date(),
      secretConfigured: Boolean(readConnectSecret()),
      userId: auth.user._id,
      tenantId: auth.tenantId,
      appId,
      issuerOrigin: deskOriginFromEnv(),
      access: { ...access, contractedApps },
      store: mongoLaunchCodeStore(),
      audit: auditConnect,
    });
    const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
    if (!issued.ok) {
      const status = issued.reason === "unconfigured" ? 503 : 403;
      return NextResponse.json({ ok: false, reason: issued.reason }, { status, headers });
    }
    return NextResponse.json(
      { ok: true, callback: issued.callback, code: issued.code, expiresAt: issued.expiresAt },
      { headers }
    );
  } catch (error) {
    return publicInternalError("connect-launch", error);
  }
}
