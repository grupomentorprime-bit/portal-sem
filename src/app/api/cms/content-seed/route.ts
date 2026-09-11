import { NextResponse } from "next/server";
import { requireActiveTenant, tenantGuardResponse } from "@/core/security";
import { seedContentCollections } from "@/lib/content/seed";
import { authorizeApiWrite } from "@/lib/identity/api-guard";

export async function POST() {
  try {
    const denied = await authorizeApiWrite("cms.pages.create", {
      action: "content.seed",
      entity: "content",
    });
    if (denied) return denied;

    const tenantCheck = await requireActiveTenant();
    if (!tenantCheck.ok) return tenantGuardResponse(tenantCheck);

    const result = await seedContentCollections(tenantCheck.tenant);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
