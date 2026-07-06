import { NextResponse } from "next/server";
import { ObjectId, type Document, type UpdateFilter } from "mongodb";
import { requireAuth } from "@/core/identity";
import { getFormSubmissionById } from "@/lib/experience/forms/repository";
import { getDatabase } from "@/lib/mongodb";
import { isValidEmail } from "@/lib/validation/identity";
import {
  assertSubmissionInStudentAffairsScope,
  canAccessStudentAffairsPanel,
} from "@/lib/student-affairs/scope";
import type { ExperienceFormSubmission } from "@/types/experience-forms";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
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

    const body = (await request.json()) as { email?: string; phone?: string };
    const update: Record<string, string> = {};

    if (body.email !== undefined) {
      const email = body.email.trim().toLowerCase();
      if (email && !isValidEmail(email)) {
        return NextResponse.json({ ok: false, error: "Correo inválido." }, { status: 400 });
      }
      update["data.email"] = email;
    }

    if (body.phone !== undefined) {
      update["data.phone"] = body.phone.trim();
    }

    if (!Object.keys(update).length) {
      return NextResponse.json({ ok: false, error: "Sin datos para actualizar." }, { status: 400 });
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json({ ok: false, error: "Respuesta no encontrada." }, { status: 404 });
    }

    const db = await getDatabase();
    const result = await db.collection("experience_form_submissions").findOneAndUpdate(
      { _id: objectId, tenant: ctx.tenantId },
      { $set: update } as UpdateFilter<Document>,
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ ok: false, error: "No se pudo actualizar." }, { status: 404 });
    }

    const doc = result as unknown as ExperienceFormSubmission & { _id: ObjectId };
    return NextResponse.json({
      ok: true,
      submission: { ...doc, _id: doc._id?.toString() },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
