import { NextResponse } from "next/server";
import { applyAttendanceChange } from "@/core/congress/attendance";
import type { CongressAttendanceDay } from "@/core/congress/constants";
import { CONGRESS_ATTENDANCE_DAYS } from "@/core/congress/constants";
import { requireCongressOperate } from "@/app/api/congress/guard";
import {
  appendCongressAudit,
  getCongressRegistration,
  updateCongressRegistration,
} from "@/lib/congress/repository";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireCongressOperate();
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      day?: string;
      present?: boolean | null;
      reason?: string;
    } | null;

    const day = body?.day;
    if (!day || !(CONGRESS_ATTENDANCE_DAYS as readonly string[]).includes(day)) {
      return NextResponse.json({ ok: false, error: "Día inválido." }, { status: 400 });
    }

    const current = await getCongressRegistration(ctx.tenantId, id);
    if (!current) {
      return NextResponse.json({ ok: false, error: "Inscripción no encontrada." }, { status: 404 });
    }

    const present = body?.present === undefined ? null : body.present;
    const nowIso = new Date().toISOString();
    const result = applyAttendanceChange({
      attendance: current.attendance,
      attendanceMeta: current.attendanceMeta ?? {},
      attendanceHistory: current.attendanceHistory ?? [],
      day: day as CongressAttendanceDay,
      present,
      reason: typeof body?.reason === "string" ? body.reason : undefined,
      nowIso,
      actorUserId: ctx.user._id,
    });

    if (result.idempotent) {
      return NextResponse.json({
        ok: true,
        registration: current,
        idempotent: true,
      });
    }

    const updated = await updateCongressRegistration(
      ctx.tenantId,
      id,
      {
        attendance: result.attendance,
        attendanceMeta: result.attendanceMeta,
        attendanceHistory: result.attendanceHistory,
      },
      current.version
    );
    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "Conflicto de versión; reintente." },
        { status: 409 }
      );
    }

    await appendCongressAudit({
      tenantId: ctx.tenantId,
      actorUserId: ctx.user._id,
      action: "attendance.set",
      entity: "congress_registration",
      entityId: id,
      metadata: {
        day,
        present,
        markedAt:
          day === "saturday"
            ? result.attendanceMeta.saturdayMarkedAt
            : result.attendanceMeta.sundayMarkedAt,
      },
    });

    return NextResponse.json({ ok: true, registration: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
