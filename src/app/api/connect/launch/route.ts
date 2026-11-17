import { NextResponse } from "next/server";
import { hasPlatformOwnerCapability } from "@/core/identity/platform/capability";
import { auditConnect } from "@/lib/connect/audit";
import { readConnectAccess } from "@/lib/connect/access";
import { issueLaunchCode } from "@/lib/connect/protocol";
import { deskIssuerFromRequest } from "@/lib/connect/desk";
import { readConnectSecret } from "@/lib/connect/secret";
import { mongoLaunchCodeStore } from "@/lib/connect/store";
import { ensureDeskProduct } from "@/lib/desktop/ensure-client-company";
import { loadSessionContext } from "@/lib/identity/sessions";
import { publicInternalError } from "@/core/security/public-error";

export const dynamic = "force-dynamic";

/**
 * Emite el código de Cumple. Keycloak sigue siendo el IdP de la sesión del escritorio;
 * este paso no abre otro proveedor ni acepta un destino elegido por el navegador.
 */
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
  const [session, parsed] = await Promise.all([
    loadSessionContext(),
    request.json().catch(() => null),
  ]);
  if (!session) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401, headers });
  }

  const body = parsed as { appId?: unknown; transactionHash?: unknown } | null;
  const appId = typeof body?.appId === "string" ? body.appId : "";
  const transactionHash = typeof body?.transactionHash === "string" ? body.transactionHash : "";
  const tenantId = session.session.tenantId?.trim() ?? "";

  try {
    if (
      hasPlatformOwnerCapability(session.user) &&
      (appId === "rrhh" || appId === "aprende-hoy")
    ) {
      await ensureDeskProduct({
        tenantId,
        userId: session.user._id,
        appId: appId === "rrhh" ? "rrhh" : "aprende-hoy",
      });
    }
    const access = await readConnectAccess({
      userId: session.user._id,
      tenantId,
      appId,
    });
    const contractedApps = access.contractedApps;
    const issued = await issueLaunchCode({
      now: new Date(),
      secretConfigured: Boolean(readConnectSecret()),
      userId: session.user._id,
      tenantId,
      appId,
      issuerOrigin: deskIssuerFromRequest(request),
      transactionHash,
      access: { ...access, contractedApps },
      store: mongoLaunchCodeStore(),
      audit: auditConnect,
    });
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
