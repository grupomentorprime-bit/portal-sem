import { NextResponse } from "next/server";
import { createInteresadoFromApplication } from "@/core/admission";
import { getActiveTenantId } from "@/core/identity";
import {
  SEM_ADMISSION_2027_CAMPAIGN,
  resolveSemAdmission2027Interest,
} from "@/lib/portal/admission-campaign-interest";
import { fetchPrograms } from "@/lib/portal/content";
import { publicInternalError } from "@/core/security/public-error";

function campaignFromRequest(request: Request, campaign: unknown): string | undefined {
  if (typeof campaign === "string" && campaign.trim()) return campaign.trim();
  const referer = request.headers.get("referer");
  if (!referer) return undefined;
  try {
    const path = new URL(referer).pathname.replace(/\/$/, "") || "/";
    return path === "/admision/2027" ? SEM_ADMISSION_2027_CAMPAIGN : undefined;
  } catch {
    return undefined;
  }
}

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
      campaign?: string;
    };

    const programs = await fetchPrograms(tenant);
    const requestedId = body.programId?.trim() ?? "";
    const program = programs.find((item) => item.id === requestedId);
    const campaignInterest = resolveSemAdmission2027Interest({
      tenantId: tenant,
      campaign: campaignFromRequest(request, body.campaign),
    });
    const programId = campaignInterest?.programId ?? requestedId;
    const programLabel = campaignInterest?.programLabel ?? program?.title;

    const result = await createInteresadoFromApplication(
      tenant,
      {
        firstName: body.firstName ?? "",
        lastName: body.lastName ?? "",
        email: body.email ?? "",
        phone: body.phone ?? "",
        church: body.church ?? "",
        city: body.city ?? "",
        programId,
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
    return publicInternalError("admission-apply", error);
  }
}
