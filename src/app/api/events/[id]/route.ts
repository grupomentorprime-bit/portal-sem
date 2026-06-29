import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { getEventById } from "@/core/events/persistence/store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const ctx = await requirePermission("events.read");
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await params;
    const event = await getEventById(id);

    if (!event || event.tenantId !== ctx.tenantId) {
      return NextResponse.json({ ok: false, error: "Evento no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, event });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
