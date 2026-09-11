import { NextResponse } from "next/server";
import { requirePlatformOperator } from "@/core/identity";
import {
  grantOperatorSpaceAccess,
  PlatformEnterSpaceError,
} from "@/lib/platform/enter-space";

interface RouteContext {
  params: Promise<{ tenantId: string }>;
}

/**
 * Alta explícita de acceso acotado (rol Soporte) para el operador en el Espacio.
 * Deny-by-default vía requirePlatformOperator.
 * No crea Dueño / super_admin. No impersona.
 */
export async function POST(_request: Request, context: RouteContext) {
  const ctx = await requirePlatformOperator();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { tenantId } = await context.params;
    const result = await grantOperatorSpaceAccess({
      tenantId: decodeURIComponent(tenantId),
      operatorUserId: ctx.user._id,
    });

    return NextResponse.json({
      ok: true,
      membershipId: result.membershipId,
      roleCode: result.roleCode,
      roleLabel: "Soporte",
      created: result.created,
      reactivated: result.reactivated,
      message: result.created
        ? "Acceso de Soporte creado."
        : result.reactivated
          ? "Acceso reactivado."
          : "Ya tenías acceso a este Espacio.",
    });
  } catch (error) {
    if (error instanceof PlatformEnterSpaceError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
