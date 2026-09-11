import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import {
  automationsGet,
  automationsUpdateDraft,
} from "@/lib/growth/automations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const ctx = await requirePermission("growth.automations.view");
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await params;
    const result = await automationsGet(ctx.tenantId, id);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error, code: result.code },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      automation: result.automation,
      versions: result.versions,
      draft: result.draft,
      published: result.published,
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

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requirePermission("growth.automations.manage");
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await params;
    const body = (await request.json()) as {
      name?: string;
      steps?: unknown;
    };

    const result = await automationsUpdateDraft({
      tenantId: ctx.tenantId,
      automationId: id,
      name: body.name,
      steps: body.steps,
      actor: { userId: ctx.user._id },
    });

    if (!result.ok) {
      const status =
        result.code === "not_found"
          ? 404
          : result.code === "published_immutable"
            ? 409
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
      createdNewDraft: result.createdNewDraft,
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
