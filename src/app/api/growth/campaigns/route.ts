import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { campaignsCreate, campaignsList } from "@/lib/growth/campaigns";
import { campaignHumanError } from "@/lib/growth/campaigns-labels";
import { getCampaignMetrics } from "@/lib/growth/campaigns-read";

export async function GET() {
  try {
    const ctx = await requirePermission("growth.campaigns.view");
    if (ctx instanceof NextResponse) return ctx;

    const items = await campaignsList(ctx.tenantId);
    const withMetrics = await Promise.all(
      items.map(async (campaign) => ({
        campaign,
        metrics: await getCampaignMetrics(ctx.tenantId, campaign.trackingKey),
      }))
    );
    return NextResponse.json({ ok: true, items: withMetrics });
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

export async function POST(request: Request) {
  try {
    const ctx = await requirePermission("growth.campaigns.manage");
    if (ctx instanceof NextResponse) return ctx;

    const body = (await request.json()) as {
      name?: string;
      objective?: string;
      trackingKey?: string;
      source?: unknown;
      audience?: unknown;
      automationId?: string | null;
      startAt?: string | null;
      endAt?: string | null;
    };

    const result = await campaignsCreate({
      tenantId: ctx.tenantId,
      name: body.name ?? "",
      objective: body.objective ?? "",
      trackingKey: body.trackingKey ?? "",
      source: body.source,
      audience: body.audience,
      automationId: body.automationId,
      startAt: body.startAt,
      endAt: body.endAt,
      actor: { userId: ctx.user._id },
    });

    if (!result.ok) {
      const status =
        result.code === "validation"
          ? 400
          : result.code === "not_found" ||
              result.code === "form_not_found" ||
              result.code === "automation_not_found"
            ? 404
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
