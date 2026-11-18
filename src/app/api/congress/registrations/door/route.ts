import { NextResponse } from "next/server";
import { requireCongressOperate } from "@/app/api/congress/guard";
import { enrollAtDoor } from "@/lib/congress/door";
import type { CongressAttendanceDays, CongressLodgingNeed } from "@/core/congress/types";

function parseExpectedDays(raw: unknown): CongressAttendanceDays | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const obj = raw as Record<string, unknown>;
  const toFlag = (v: unknown): boolean | null => {
    if (v === true) return true;
    if (v === false) return false;
    return null;
  };
  return {
    saturday: toFlag(obj.saturday),
    sunday: toFlag(obj.sunday),
  };
}

function parseLodgingNeed(raw: unknown): CongressLodgingNeed | undefined {
  if (raw === "unknown" || raw === "none" || raw === "requested") return raw;
  return undefined;
}

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
      expectedDays: parseExpectedDays(body.expectedDays),
      lodgingNeed: parseLodgingNeed(body.lodgingNeed),
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
