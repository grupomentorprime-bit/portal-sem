import { NextResponse } from "next/server";
import { isSecureCookieFromHeaders, SESSION_COOKIE } from "@/core/identity/auth/config";
import { publicOriginFromHost } from "@/core/tenant/hosts";
import { auditConnect } from "@/lib/connect/audit";
import { readConnectAccess } from "@/lib/connect/access";
import { allowedCumpleBase, deskOriginFromEnv } from "@/lib/connect/desk";
import {
  escritorioReturnHref,
  productLandingUrl,
  productSessionCookieOptions,
  readCallbackSubmission,
} from "@/lib/connect/policy";
import { redeemLaunchCode } from "@/lib/connect/protocol";
import { readConnectSecret, readPreviousConnectSecret } from "@/lib/connect/secret";
import { mongoLaunchCodeStore } from "@/lib/connect/store";
import { createSession } from "@/lib/identity/sessions";
import { publicInternalError } from "@/core/security/public-error";

export const dynamic = "force-dynamic";

function destinationFromRequest(request: Request): string {
  const url = new URL(request.url);
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  return publicOriginFromHost(forwarded || url.host) ?? url.origin;
}

function backToDesk(requestOrigin: string): NextResponse {
  const response = NextResponse.redirect(
    escritorioReturnHref(requestOrigin, deskOriginFromEnv()),
    303
  );
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export async function GET() {
  return new NextResponse(null, {
    status: 405,
    headers: {
      Allow: "POST",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const requestOrigin = destinationFromRequest(request);
  // El navegador no presenta el secreto. Si lo trae, no se usa y no hay sesión.
  if (request.headers.get("authorization")) return backToDesk(requestOrigin);

  const form = await request.formData().catch(() => null);
  const bodyCode = form?.get("code");
  const bodyTransaction = form?.get("transaction");
  const base = allowedCumpleBase();
  const submission = readCallbackSubmission({
    method: "POST",
    queryCode: url.searchParams.has("code") ? (url.searchParams.get("code") ?? "") : null,
    bodyCode: typeof bodyCode === "string" ? bodyCode : null,
    bodyTransaction: typeof bodyTransaction === "string" ? bodyTransaction : null,
    originHeader: request.headers.get("origin"),
    requestOrigin,
    allowedIssuer: deskOriginFromEnv(),
    spaceBaseDomain: base,
  });
  if (!submission.ok) return backToDesk(requestOrigin);

  try {
    const secret = readConnectSecret();
    const redeemed = await redeemLaunchCode({
      now: new Date(),
      secret,
      previousSecret: readPreviousConnectSecret(),
      providedSecret: secret ?? "",
      code: submission.code,
      transaction: submission.transaction,
      destinationOrigin: submission.destinationOrigin,
      issuerOrigin: submission.issuerOrigin,
      accessFor: (ticket) => readConnectAccess(ticket),
      store: mongoLaunchCodeStore(),
      audit: auditConnect,
    });
    if (!redeemed.ok) return backToDesk(submission.destinationOrigin);

    const landing = productLandingUrl(submission.destinationOrigin, base);
    if (!landing) return backToDesk(submission.destinationOrigin);

    const session = await createSession({
      userId: redeemed.userId,
      tenantId: redeemed.tenantId,
      audience: "cumple",
    });
    const response = NextResponse.redirect(landing, 303);
    response.cookies.set(
      SESSION_COOKIE,
      session._id,
      productSessionCookieOptions(isSecureCookieFromHeaders(request.headers))
    );
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch (error) {
    return publicInternalError("connect-callback", error);
  }
}
