import { NextResponse } from "next/server";
import { requirePlatformOperator } from "@/core/identity";
import { listPlatformSpaces } from "@/lib/platform/spaces";
import {
  CreatePlatformSpaceError,
  createPlatformSpace,
} from "@/lib/platform/create-space";

/**
 * Catálogo global de Espacios (Growth OS Platform Admin).
 * Deny-by-default vía requirePlatformOperator. No usa Espacio activo.
 */
export async function GET() {
  const ctx = await requirePlatformOperator();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const spaces = await listPlatformSpaces();
    return NextResponse.json({ ok: true, spaces });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/**
 * Crear Espacio reutilizando provisionTenantFoundation.
 * No siembra pack SEM ni asigna al operador como Dueño automáticamente.
 */
export async function POST(request: Request) {
  const ctx = await requirePlatformOperator();
  if (ctx instanceof NextResponse) return ctx;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const space = await createPlatformSpace(
      {
        name: typeof body.name === "string" ? body.name : "",
        slug: typeof body.slug === "string" ? body.slug : "",
        type: typeof body.type === "string" ? body.type : "",
        host: typeof body.host === "string" ? body.host : "",
        siteName: typeof body.siteName === "string" ? body.siteName : "",
        ownerEmail:
          typeof body.ownerEmail === "string" ? body.ownerEmail : null,
      },
      ctx.user._id
    );

    return NextResponse.json({
      ok: true,
      message: space.created ? "Espacio creado" : "Espacio ya existía",
      space,
    });
  } catch (error) {
    if (error instanceof CreatePlatformSpaceError) {
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
