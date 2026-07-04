import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { catalogPermissionsByModule } from "@/core/identity/permissions/catalog";

export async function GET() {
  try {
    const ctx = await requireAuth();
    if (ctx instanceof NextResponse) return ctx;

    return NextResponse.json({
      ok: true,
      modules: catalogPermissionsByModule(),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
