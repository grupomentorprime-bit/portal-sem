import { NextResponse } from "next/server";
import { createInteresadoFromApplication } from "@/core/admission";
import { getActiveTenantId } from "@/core/identity";
import { fetchPrograms } from "@/lib/portal/content";

export async function POST(request: Request) {
  try {
    const tenant = await getActiveTenantId();
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Portal no configurado." }, { status: 503 });
    }

    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      church?: string;
      city?: string;
      programId?: string;
      message?: string;
    };

    const programs = await fetchPrograms(tenant);
    const program = programs.find((p) => p.id === body.programId?.trim());
    const programLabel = program?.title;

    const result = await createInteresadoFromApplication(
      tenant,
      {
        firstName: body.firstName ?? "",
        lastName: body.lastName ?? "",
        email: body.email ?? "",
        phone: body.phone ?? "",
        church: body.church ?? "",
        city: body.city ?? "",
        programId: body.programId ?? "",
        message: body.message,
      },
      programLabel
    );

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, errors: result.errors, error: "Revisa los campos del formulario." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      ok: true,
      interesadoId: result.result.interesado._id,
      status: "interesado",
      handoff: {
        delivered: result.result.handoffOk,
        externalId: result.result.handoffExternalId,
      },
      redirectTo: "/postulacion/enviada",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
