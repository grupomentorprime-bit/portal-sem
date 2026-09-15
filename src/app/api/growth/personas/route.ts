/**
 * OT-GROWTH-PERSONAS-IMPLEMENT-003 — API admin Crear Persona.
 * Wrapper seguro sobre upsertGrowthPersona. Permiso: growth.people.manage.
 */

import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { createGrowthPersonaAdmin } from "@/lib/growth/personas-create";

export async function POST(request: Request) {
  try {
    const ctx = await requirePermission("growth.people.manage");
    if (ctx instanceof NextResponse) return ctx;

    const body = (await request.json()) as {
      displayName?: string;
      email?: string;
      phone?: string;
    };

    const result = await createGrowthPersonaAdmin({
      tenantId: ctx.tenantId,
      displayName: body.displayName ?? "",
      email: body.email,
      phone: body.phone,
      actorUserId: ctx.user._id,
    });

    if (!result.ok) {
      const status = result.code === "identity_conflict" ? 409 : 400;
      return NextResponse.json(
        {
          ok: false,
          code: result.code,
          error: result.message,
        },
        { status }
      );
    }

    return NextResponse.json({
      ok: true,
      outcome: result.outcome,
      personaId: result.personaId,
      message: result.message,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        ok: false,
        code: "error",
        error: "No pudimos crear la Persona. Inténtalo de nuevo.",
      },
      { status: 500 }
    );
  }
}
