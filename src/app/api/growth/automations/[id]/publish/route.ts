import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { automationsPublish } from "@/lib/growth/automations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const ctx = await requirePermission("growth.automations.manage");
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await params;
    const result = await automationsPublish({
      tenantId: ctx.tenantId,
      automationId: id,
      actor: { userId: ctx.user._id },
    });

    if (!result.ok) {
      const status =
        result.code === "not_found"
          ? 404
          : result.code === "validation"
            ? 400
            : 409;
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
