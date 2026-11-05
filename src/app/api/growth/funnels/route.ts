import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import {
  growthFunnelFailureMessage,
  mutateGrowthFunnel,
  readGrowthFunnelAdmin,
} from "@/lib/growth/funnels-admin";

export async function GET() {
  try {
    const ctx = await requirePermission("growth.funnels.manage");
    if (ctx instanceof NextResponse) return ctx;
    const funnels = await readGrowthFunnelAdmin(ctx.tenantId);
    return NextResponse.json({ ok: true, funnels });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requirePermission("growth.funnels.manage");
    if (ctx instanceof NextResponse) return ctx;
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "create");
    const result = await mutateGrowthFunnel(ctx.tenantId, action, body);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, reason: result.reason, error: growthFunnelFailureMessage(result.reason) },
        { status: 400 }
      );
    }
    const funnels = await readGrowthFunnelAdmin(ctx.tenantId);
    return NextResponse.json({ ok: true, funnels });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
