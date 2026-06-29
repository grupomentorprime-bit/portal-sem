import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { buildExecutionContext, startWorkflow } from "@/core/workflow";
import { ensureSystemDefinitions } from "@/lib/workflow/definitions";

export async function POST(request: Request) {
  try {
    const auth = await requirePermission("workflow.transition");
    if (auth instanceof NextResponse) return auth;

    const body = (await request.json()) as {
      definitionKey?: string;
      entityType?: string;
      entityId?: string;
      metadata?: Record<string, unknown>;
    };

    if (!body.definitionKey || !body.entityType || !body.entityId) {
      return NextResponse.json(
        { ok: false, error: "definitionKey, entityType y entityId son obligatorios." },
        { status: 400 }
      );
    }

    await ensureSystemDefinitions(auth.tenantId);
    const ctx = buildExecutionContext(auth);
    const instance = await startWorkflow(ctx, {
      definitionKey: body.definitionKey,
      entityType: body.entityType,
      entityId: body.entityId,
      metadata: body.metadata,
    });

    return NextResponse.json({ ok: true, instance }, { status: 201 });
  } catch (error) {
    console.error(error);
    const status = (error as { status?: number }).status ?? 500;
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status }
    );
  }
}
