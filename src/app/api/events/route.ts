import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { listEvents, listDeadLetters } from "@/core/events/persistence/store";
import { listEventTypes, listSubscriptions } from "@/core/events";
import {
  sanitizeDeadLetterForClient,
  sanitizeStoredEventForClient,
} from "@/core/events/sanitize";

export async function GET(request: Request) {
  try {
    const ctx = await requirePermission("events.read");
    if (ctx instanceof NextResponse) return ctx;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const limit = Number(searchParams.get("limit") ?? "50");
    const view = searchParams.get("view");

    if (view === "dead-letter") {
      const deadLetters = await listDeadLetters(ctx.tenantId, limit);
      return NextResponse.json({
        ok: true,
        deadLetters: deadLetters.map(sanitizeDeadLetterForClient),
      });
    }

    if (view === "registry") {
      return NextResponse.json({
        ok: true,
        eventTypes: listEventTypes(),
        subscriptions: listSubscriptions(),
      });
    }

    const events = await listEvents(ctx.tenantId, { type, status, limit });
    return NextResponse.json({
      ok: true,
      events: events.map(sanitizeStoredEventForClient),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
