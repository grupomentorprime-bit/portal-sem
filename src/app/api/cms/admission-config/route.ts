import { NextResponse } from "next/server";
import {
  getAdmissionConfigUncached,
  updateAdmissionConfig,
} from "@/lib/cms/admission-config";
import { authorizeApiRead, authorizeApiWrite } from "@/lib/identity/api-guard";
import { getOperationalTenantId } from "@/core/identity";
import type { AdmissionConfig } from "@/types/admission";

export async function GET() {
  try {
    const denied = await authorizeApiRead("cms.pages.read");
    if (denied) return denied;

    const tenant = await getOperationalTenantId();
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Portal no configurado." }, { status: 503 });
    }

    const config = await getAdmissionConfigUncached(tenant);
    return NextResponse.json({ ok: true, config });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const denied = await authorizeApiWrite("cms.pages.update", {
      action: "cms.pages.update",
      entity: "portal_admission_config",
      entityId: "admission-center",
    });
    if (denied) return denied;

    const tenant = await getOperationalTenantId();
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Portal no configurado." }, { status: 503 });
    }

    const body = (await request.json()) as Partial<AdmissionConfig>;
    const config = await updateAdmissionConfig(tenant, body);
    return NextResponse.json({ ok: true, config });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
