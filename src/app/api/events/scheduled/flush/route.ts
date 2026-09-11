import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import {
  flushScheduledEventsDetailed,
  ensureScheduledEventsRunner,
} from "@/core/events";

/**
 * OT-GROWTH-AUTOMATION-005 — despertar programados vencidos.
 * Auth: Bearer CRON_SECRET (worker/cron) o permiso events.manage (prueba técnica).
 */
export async function POST(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET?.trim();
    const auth = request.headers.get("authorization") ?? "";
    const bearer =
      auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";

    let authorized = false;
    if (cronSecret && bearer && bearer === cronSecret) {
      authorized = true;
    } else {
      const ctx = await requirePermission("events.manage");
      if (ctx instanceof NextResponse) return ctx;
      authorized = true;
    }

    if (!authorized) {
      return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
    }

    ensureScheduledEventsRunner();

    const body = (await request.json().catch(() => ({}))) as {
      limit?: number;
    };
    const result = await flushScheduledEventsDetailed({
      limit: body.limit,
    });

    return NextResponse.json({ ok: true, ...result });
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
