import { NextResponse } from "next/server";
import {
  deleteMenu,
  getMenuByIdUncached,
  updateMenu,
} from "@/lib/cms/menus";
import { validateMenuUpdate } from "@/lib/cms/menu-validation";
import { authorizeApiWrite } from "@/lib/identity/api-guard";
import type { CmsMenuUpdate } from "@/types/menu";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const menu = await getMenuByIdUncached(id);

    if (!menu) {
      return NextResponse.json(
        { ok: false, error: `Menú "${id}" no encontrado.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, menu });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const denied = await authorizeApiWrite("cms.menus.manage", {
      action: "menu.update",
      entity: "cms_menus",
    });
    if (denied) return denied;

    const { id } = await context.params;
    const body = (await request.json()) as CmsMenuUpdate;
    const errors = validateMenuUpdate(body);

    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    const menu = await updateMenu(id, body);

    if (!menu) {
      return NextResponse.json(
        { ok: false, error: `Menú "${id}" no encontrado.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, menu });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const denied = await authorizeApiWrite("cms.menus.manage", {
      action: "menu.delete",
      entity: "cms_menus",
    });
    if (denied) return denied;

    const { id } = await context.params;
    const deleted = await deleteMenu(id);

    if (!deleted) {
      return NextResponse.json(
        { ok: false, error: `Menú "${id}" no encontrado.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
