import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import {
  buildExecutionContext,
  transition,
  getAvailableTransitions,
} from "@/core/workflow";

export async function POST(request: Request) {
  try {
    const auth = await requirePermission("workflow.transition");
    if (auth instanceof NextResponse) return auth;

    const body = (await request.json()) as {
      instanceId?: string;
      transitionId?: string;
      toState?: string;
      comment?: string;
      metadata?: Record<string, unknown>;
    };

    if (!body.instanceId) {
      return NextResponse.json({ ok: false, error: "instanceId es obligatorio." }, { status: 400 });
    }

    const ctx = buildExecutionContext(auth);
    const instance = await transition(ctx, {
      instanceId: body.instanceId,
      transitionId: body.transitionId,
      toState: body.toState,
      comment: body.comment,
      metadata: body.metadata,
    });

    const available = await getAvailableTransitions(ctx, body.instanceId);

    return NextResponse.json({ ok: true, instance, availableTransitions: available });
  } catch (error) {
    console.error(error);
    const status = (error as { status?: number }).status ?? 500;
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status }
    );
  }
}
