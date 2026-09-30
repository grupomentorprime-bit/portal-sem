import { NextResponse } from "next/server";
import { isAuthContext, requirePermission } from "@/core/identity";
import {
  SetSpaceCustomDomainError,
  checkPlatformSpaceCustomDomain,
  setPlatformSpaceCustomDomain,
} from "@/lib/platform/space-custom-domain";

/**
 * Dominio propio del Espacio activo.
 * El tenant sale de la sesión: no se acepta otro Espacio en la URL.
 * Deny-by-default vía settings.update.
 */
export async function PUT(request: Request) {
  const ctx = await requirePermission("settings.update");
  if (!isAuthContext(ctx)) return ctx;

  try {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const host = typeof body.host === "string" ? body.host : "";
    const domain = await setPlatformSpaceCustomDomain(
      ctx.tenantId,
      host,
      ctx.user._id
    );

    return NextResponse.json({
      ok: true,
      message: domain.customDomain
        ? "Dominio actualizado"
        : "El Espacio queda en su subdominio",
      domain,
    });
  } catch (error) {
    if (error instanceof SetSpaceCustomDomainError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error(error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

/** Comprueba el CNAME del dominio propio de este Espacio. */
export async function POST() {
  const ctx = await requirePermission("settings.update");
  if (!isAuthContext(ctx)) return ctx;

  try {
    const connection = await checkPlatformSpaceCustomDomain(ctx.tenantId);
    return NextResponse.json({ ok: true, connection });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
