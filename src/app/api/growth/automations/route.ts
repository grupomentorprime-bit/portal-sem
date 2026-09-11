import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import {
  automationsCreate,
  automationsList,
} from "@/lib/growth/automations";

export async function GET() {
  try {
    const ctx = await requirePermission("growth.automations.view");
    if (ctx instanceof NextResponse) return ctx;

    const items = await automationsList(ctx.tenantId);
    return NextResponse.json({ ok: true, items });
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
    const ctx = await requirePermission("growth.automations.manage");
    if (ctx instanceof NextResponse) return ctx;

    const body = (await request.json()) as {
      name?: string;
      steps?: unknown;
    };

    const result = await automationsCreate({
      tenantId: ctx.tenantId,
      name: body.name ?? "",
      steps: body.steps,
      actor: { userId: ctx.user._id },
    });

    if (!result.ok) {
      const status = result.code === "validation" ? 400 : 409;
      return NextResponse.json(
        { ok: false, error: result.error, code: result.code },
        { status }
      );
    }

    return NextResponse.json({
      ok: true,
      automation: result.automation,
      version: result.version,
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
