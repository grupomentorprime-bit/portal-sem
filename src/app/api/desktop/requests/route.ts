import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { recordAppRequest } from "@/lib/desktop/requests";
import {
  mongoAppRequestStore,
  readSpaceContract,
} from "@/lib/desktop/store";

export async function POST(request: Request) {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  const tenantId = ctx.tenantId?.trim() ?? "";
  if (!tenantId || !ctx.membership) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    appId?: unknown;
  } | null;
  const appId = typeof body?.appId === "string" ? body.appId : "";
  const contract = await readSpaceContract(tenantId);
  const result = await recordAppRequest(mongoAppRequestStore(), {
    tenantId,
    appId,
    requestedBy: ctx.user._id,
    contracted: contract.contracted,
  });
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
