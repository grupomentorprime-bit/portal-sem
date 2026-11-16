import { NextResponse } from "next/server";
import { findTenantById } from "@/core/tenant";
import { auditConnect } from "@/lib/connect/audit";
import { findUserById } from "@/lib/identity/users";
import { readConnectAccess } from "@/lib/connect/access";
import { isDeskMaster } from "@/lib/desktop/ensure-client-company";
import { redeemLaunchCode } from "@/lib/connect/protocol";
import { readConnectSecret, readPreviousConnectSecret } from "@/lib/connect/secret";
import { mongoLaunchCodeStore } from "@/lib/connect/store";
import { getDatabase } from "@/lib/mongodb";
import { publicInternalError } from "@/core/security/public-error";

export const dynamic = "force-dynamic";

/** Canje de servidor a servidor. No crea cookie ni acepta la sesión del navegador. */
export async function POST(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const providedSecret = header.toLowerCase().startsWith("bearer ")
    ? header.slice(header.indexOf(" ") + 1).trim()
    : "";
  let code = "";
  let transaction = "";
  let destinationOrigin = "";
  let issuerOrigin = "";
  try {
    const body = (await request.json()) as {
      code?: unknown;
      transaction?: unknown;
      destinationOrigin?: unknown;
      issuerOrigin?: unknown;
    };
    code = typeof body.code === "string" ? body.code : "";
    transaction = typeof body.transaction === "string" ? body.transaction : "";
    destinationOrigin = typeof body.destinationOrigin === "string" ? body.destinationOrigin : "";
    issuerOrigin = typeof body.issuerOrigin === "string" ? body.issuerOrigin : "";
  } catch {
    code = "";
  }

  try {
    const redeemed = await redeemLaunchCode({
      now: new Date(),
      secret: readConnectSecret(),
      previousSecret: readPreviousConnectSecret(),
      providedSecret,
      code,
      transaction,
      destinationOrigin,
      issuerOrigin,
      accessFor: (ticket) => readConnectAccess(ticket),
      store: mongoLaunchCodeStore(),
      audit: auditConnect,
    });
    const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
    if (!redeemed.ok) {
      const status =
        redeemed.reason === "bad_secret" || redeemed.reason === "unconfigured" ? 401 : 403;
      return NextResponse.json({ ok: false, reason: redeemed.reason }, { status, headers });
    }
    const person = await findUserById(redeemed.userId);
    const tenant = await findTenantById(await getDatabase(), redeemed.tenantId);
    const master = person ? await isDeskMaster(person, redeemed.tenantId) : false;
    return NextResponse.json(
      {
        ok: true,
        userId: redeemed.userId,
        tenantId: redeemed.tenantId,
        appId: redeemed.appId,
        email: person?.email ?? "",
        displayName: person?.displayName ?? "",
        tenantName: tenant?.name?.trim() || redeemed.tenantId,
        master,
      },
      { headers }
    );
  } catch (error) {
    return publicInternalError("connect-exchange", error);
  }
}
