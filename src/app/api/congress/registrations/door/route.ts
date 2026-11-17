import { NextResponse } from "next/server";
import { requireCongressOperate } from "@/app/api/congress/guard";
import { enrollAtDoor } from "@/lib/congress/door";

export async function POST(request: Request) {
  try {
    const ctx = await requireCongressOperate();
    if (ctx instanceof NextResponse) return ctx;

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) {
      return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
    }

    const result = await enrollAtDoor({
      tenantId: ctx.tenantId,
      actorUserId: ctx.user._id,
      fullName: String(body.fullName ?? ""),
      zoneId: String(body.zoneId ?? ""),
      churchName: String(body.churchName ?? ""),
      rut: body.rut != null ? String(body.rut) : null,
      phone: body.phone != null ? String(body.phone) : null,
      email: body.email != null ? String(body.email) : null,
    });

    if (!result.ok) {
      const status = result.error === "duplicate" ? 409 : 400;
      return NextResponse.json(
        { ok: false, error: result.error, duplicateId: result.duplicateId },
        { status }
      );
    }

    return NextResponse.json({ ok: true, registration: result.registration });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
