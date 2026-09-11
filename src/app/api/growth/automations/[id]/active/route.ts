import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { automationsSetActive } from "@/lib/growth/automations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requirePermission("growth.automations.manage");
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await params;
    const body = (await request.json()) as { active?: boolean };
    if (typeof body.active !== "boolean") {
      return NextResponse.json(
        { ok: false, error: "active (boolean) es obligatorio.", code: "validation" },
        { status: 400 }
      );
    }

    const result = await automationsSetActive({
      tenantId: ctx.tenantId,
      automationId: id,
      active: body.active,
      actor: { userId: ctx.user._id },
    });

    if (!result.ok) {
      const status = result.code === "not_found" ? 404 : 409;
      return NextResponse.json(
        { ok: false, error: result.error, code: result.code },
        { status }
      );
    }

    return NextResponse.json({ ok: true, automation: result.automation });
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
