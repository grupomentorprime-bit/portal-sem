import { NextResponse } from "next/server";
import { requirePlatformOperator } from "@/core/identity";
import { hasPlatformOwnerCapability } from "@/core/identity/platform/capability";
import {
  grantOperatorSpaceAccess,
  grantOwnerSpaceAccess,
  PlatformEnterSpaceError,
} from "@/lib/platform/enter-space";

interface RouteContext {
  params: Promise<{ tenantId: string }>;
}

/**
 * El superadministrador entra como dueño del Espacio.
 * El operador entra como Soporte. No impersona.
 */
export async function POST(_request: Request, context: RouteContext) {
  const ctx = await requirePlatformOperator();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { tenantId } = await context.params;
    const decoded = decodeURIComponent(tenantId);
    const asOwner = hasPlatformOwnerCapability(ctx.user);
    const result = asOwner
      ? await grantOwnerSpaceAccess({
          tenantId: decoded,
          ownerUserId: ctx.user._id,
        })
      : await grantOperatorSpaceAccess({
          tenantId: decoded,
          operatorUserId: ctx.user._id,
        });

    return NextResponse.json({
      ok: true,
      membershipId: result.membershipId,
      roleCode: result.roleCode,
      roleLabel: asOwner ? "Super administrador" : "Soporte",
      created: result.created,
      reactivated: result.reactivated,
      message: result.created
        ? asOwner
          ? "Entras como super administrador."
          : "Acceso de Soporte creado."
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
