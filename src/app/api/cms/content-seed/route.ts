import { NextResponse } from "next/server";
import { assertActiveTenant, tenantGuardResponse } from "@/core/security";
import { seedContentCollections } from "@/lib/content/seed";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { tenant?: string };
    const tenantCheck = await assertActiveTenant(body.tenant);
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
