import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { replayEvent, replayEventsByType } from "@/core/events/replay/replay";

export async function POST(request: Request) {
  try {
    const ctx = await requirePermission("events.replay");
    if (ctx instanceof NextResponse) return ctx;

    const body = (await request.json()) as { eventId?: string; type?: string; limit?: number };

    if (body.eventId) {
      const result = await replayEvent(body.eventId);
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 404 });
      }
      return NextResponse.json({ ok: true, result: result.result });
    }

    if (body.type) {
      const result = await replayEventsByType(ctx.tenantId, body.type, body.limit ?? 20);
      return NextResponse.json({ ok: true, ...result });
    }

    return NextResponse.json(
      { ok: false, error: "Indica eventId o type para replay." },
      { status: 400 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
