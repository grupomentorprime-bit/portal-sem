import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { campaignsGet, campaignsUpdate } from "@/lib/growth/campaigns";
import { campaignHumanError } from "@/lib/growth/campaigns-labels";
import {
  getCampaignDetailView,
  getCampaignMetrics,
} from "@/lib/growth/campaigns-read";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const ctx = await requirePermission("growth.campaigns.view");
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await params;
    const detail = await getCampaignDetailView(ctx.tenantId, id);
    if (!detail) {
      return NextResponse.json(
        {
          ok: false,
          error: campaignHumanError("not_found"),
          code: "not_found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, ...detail });
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

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requirePermission("growth.campaigns.manage");
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await params;
    const existing = await campaignsGet(ctx.tenantId, id);
    if (!existing) {
      return NextResponse.json(
        {
          ok: false,
          error: campaignHumanError("not_found"),
          code: "not_found",
        },
        { status: 404 }
      );
    }

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

    const result = await campaignsUpdate({
      tenantId: ctx.tenantId,
      campaignId: id,
      name: body.name,
      objective: body.objective,
      trackingKey: body.trackingKey,
      source: body.source,
      audience: body.audience,
      automationId: body.automationId,
      startAt: body.startAt,
      endAt: body.endAt,
      actor: { userId: ctx.user._id },
    });

    if (!result.ok) {
      const status =
        result.code === "validation" || result.code === "tracking_key_immutable"
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

    const metrics = await getCampaignMetrics(
      ctx.tenantId,
      result.campaign.trackingKey
    );
    return NextResponse.json({
      ok: true,
      campaign: result.campaign,
      metrics,
    });
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
