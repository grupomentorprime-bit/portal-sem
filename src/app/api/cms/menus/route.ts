import { NextResponse } from "next/server";
import {
  createMenu,
  getAllMenusUncached,
  menuExists,
} from "@/lib/cms/menus";
import { validateMenuCreate } from "@/lib/cms/menu-validation";
import { authorizeApiWrite } from "@/lib/identity/api-guard";
import type { CmsMenuCreate } from "@/types/menu";

export async function GET() {
  try {
    const menus = await getAllMenusUncached();
    return NextResponse.json({ ok: true, menus });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const denied = await authorizeApiWrite("cms.menus.manage", {
      action: "menu.create",
      entity: "cms_menus",
    });
    if (denied) return denied;

    const body = (await request.json()) as CmsMenuCreate;
    const errors = validateMenuCreate(body);

    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    if (await menuExists(body._id)) {
      return NextResponse.json(
        { ok: false, error: `Ya existe un menú con id "${body._id}".` },
        { status: 409 }
      );
    }

    const menu = await createMenu(body);
    return NextResponse.json({ ok: true, menu }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
