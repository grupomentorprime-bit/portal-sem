import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { campaignsEnd } from "@/lib/growth/campaigns";
import { campaignHumanError } from "@/lib/growth/campaigns-labels";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const ctx = await requirePermission("growth.campaigns.manage");
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await params;
    const result = await campaignsEnd({
      tenantId: ctx.tenantId,
      campaignId: id,
      actor: { userId: ctx.user._id },
    });

    if (!result.ok) {
      const status =
        result.code === "not_found"
          ? 404
          : result.code === "invalid_transition"
            ? 400
            : 409;
      return NextResponse.json(
        {
          ok: false,
          error: campaignHumanError(result.code, result.error),
          code: result.code,
        },
        { status }
      );
    }

    return NextResponse.json({ ok: true, campaign: result.campaign });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
