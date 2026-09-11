import { NextResponse } from "next/server";
import { requirePlatformOperator } from "@/core/identity";

/**
 * Sonda de Platform Admin. Deny-by-default vía requirePlatformOperator.
 * No lista Espacios ni crea membresías.
 */
export async function GET() {
  const ctx = await requirePlatformOperator();
  if (ctx instanceof NextResponse) return ctx;

  return NextResponse.json({
    ok: true,
    platformRoles: ctx.platformRoles ?? [],
    activeTenantId: ctx.tenantId || null,
  });
}
