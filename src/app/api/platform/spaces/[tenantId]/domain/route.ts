import { NextResponse } from "next/server";
import { requirePlatformOperator } from "@/core/identity";
import {
  SetSpaceCustomDomainError,
  checkPlatformSpaceCustomDomain,
  setPlatformSpaceCustomDomain,
} from "@/lib/platform/space-custom-domain";

interface RouteContext {
  params: Promise<{ tenantId: string }>;
}

/**
 * Actualiza el dominio propio de un Espacio.
 * El subdominio de plataforma se conserva. Host vacío lo deja como dirección principal.
 * Deny-by-default vía requirePlatformOperator.
 */
export async function PUT(request: Request, context: RouteContext) {
  const ctx = await requirePlatformOperator();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { tenantId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const host = typeof body.host === "string" ? body.host : "";
    const domain = await setPlatformSpaceCustomDomain(
      decodeURIComponent(tenantId),
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

/** Comprueba el CNAME y, si ya apunta al servicio, pide el certificado. */
export async function POST(_request: Request, context: RouteContext) {
  const ctx = await requirePlatformOperator();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { tenantId } = await context.params;
    const connection = await checkPlatformSpaceCustomDomain(
      decodeURIComponent(tenantId)
    );
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
