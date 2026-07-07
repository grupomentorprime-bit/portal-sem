import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { getFormSubmissionById } from "@/lib/experience/forms/repository";
import { recordAbsenceContact } from "@/lib/student-affairs/record-absence-contact";
import {
  assertSubmissionInStudentAffairsScope,
  canAccessStudentAffairsPanel,
} from "@/lib/student-affairs/scope";
import { assertCanManageSubmissionInFollowUp, assertSubmissionHasCompleteContactInfo } from "@/lib/student-affairs/follow-up-guards";
import { resolveEffectiveRoleCodes } from "@/lib/identity/membership-role-codes";
import type { AbsenceContactChannel, AbsenceContactOutcome } from "@/types/experience-forms";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const CHANNELS: AbsenceContactChannel[] = [
  "email",
  "phone",
  "whatsapp",
  "in-person",
  "other",
];

function isAbsenceContactChannel(value: unknown): value is AbsenceContactChannel {
  return typeof value === "string" && CHANNELS.includes(value as AbsenceContactChannel);
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireAuth();
    if (ctx instanceof NextResponse) return ctx;

    if (!canAccessStudentAffairsPanel(ctx)) {
      return NextResponse.json({ ok: false, error: "Acceso denegado." }, { status: 403 });
    }

    if (
      !ctx.compatMode &&
      !ctx.permissions.includes("student-affairs.checkin") &&
      !ctx.permissions.includes("experience.forms.manage") &&
      !ctx.permissions.includes("student-affairs.manage")
    ) {
      return NextResponse.json(
        { ok: false, error: "Sin permiso para gestionar asistencia." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await getFormSubmissionById(ctx.tenantId, id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Respuesta no encontrada." }, { status: 404 });
    }

    if (!assertSubmissionInStudentAffairsScope(ctx, existing)) {
      return NextResponse.json({ ok: false, error: "Respuesta fuera de su alcance." }, { status: 403 });
    }

    const roleCodes = await resolveEffectiveRoleCodes(ctx);
    const followUpGate = await assertCanManageSubmissionInFollowUp({
      ctx,
      roleCodes,
      submission: existing,
    });
    if (!followUpGate.ok) {
      return NextResponse.json({ ok: false, error: followUpGate.error }, { status: followUpGate.status });
    }

    const contactGate = assertSubmissionHasCompleteContactInfo(existing);
    if (!contactGate.ok) {
      return NextResponse.json({ ok: false, error: contactGate.error }, { status: contactGate.status });
    }

    const body = (await request.json()) as {
      channel?: AbsenceContactChannel;
      notes?: string;
      phone?: string;
      startJustificationDeadline?: boolean;
      contactOutcome?: AbsenceContactOutcome;
    };

    if (!isAbsenceContactChannel(body.channel)) {
      return NextResponse.json({ ok: false, error: "Canal de contacto inválido." }, { status: 400 });
    }

    if (body.channel === "email") {
      return NextResponse.json(
        { ok: false, error: "Use el envío de solicitud por correo desde el panel." },
        { status: 400 }
      );
    }

    const result = await recordAbsenceContact({
      tenant: ctx.tenantId,
      submissionId: id,
      channel: body.channel,
      operatorName: ctx.user.displayName,
      notes: body.notes,
      phone: body.phone ?? String(existing.data.phone ?? ""),
      startJustificationDeadline: body.startJustificationDeadline !== false,
      contactOutcome: body.contactOutcome,
    });

    if (!result.ok) {
      const status = result.reason === "notes-required" ? 400 : 422;
      return NextResponse.json({ ok: false, error: result.error }, { status });
    }

    return NextResponse.json({ ok: true, submission: result.submission });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireAuth();
    if (ctx instanceof NextResponse) return ctx;

    if (!canAccessStudentAffairsPanel(ctx)) {
      return NextResponse.json({ ok: false, error: "Acceso denegado." }, { status: 403 });
    }

    const { id } = await params;
    const existing = await getFormSubmissionById(ctx.tenantId, id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Respuesta no encontrada." }, { status: 404 });
    }

    if (!assertSubmissionInStudentAffairsScope(ctx, existing)) {
      return NextResponse.json({ ok: false, error: "Respuesta fuera de su alcance." }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      contacts: existing.absenceContactLog ?? [],
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
