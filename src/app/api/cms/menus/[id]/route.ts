import { NextResponse } from "next/server";
import { requireActiveTenant, tenantGuardResponse } from "@/core/security";
import {
  deleteMenu,
  getMenuByIdUncached,
  updateMenu,
} from "@/lib/cms/menus";
import { validateMenuUpdate } from "@/lib/cms/menu-validation";
import { authorizeApiRead, authorizeApiWrite } from "@/lib/identity/api-guard";
import type { CmsMenuUpdate } from "@/types/menu";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function loadMenuForActiveTenant(id: string) {
  const tenantCheck = await requireActiveTenant();
  if (!tenantCheck.ok) {
    return { error: tenantGuardResponse(tenantCheck) } as const;
  }
  const menu = await getMenuByIdUncached(id, tenantCheck.tenant);
  if (!menu) {
    return {
      error: NextResponse.json(
        { ok: false, error: `Menú "${id}" no encontrado.` },
        { status: 404 }
      ),
    } as const;
  }
  return { menu, tenantId: tenantCheck.tenant } as const;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const denied = await authorizeApiRead("cms.menus.read");
    if (denied) return denied;

    const { id } = await context.params;
    const loaded = await loadMenuForActiveTenant(id);
    if ("error" in loaded) return loaded.error;

    return NextResponse.json({ ok: true, menu: loaded.menu });
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
    const loaded = await loadMenuForActiveTenant(id);
    if ("error" in loaded) return loaded.error;

    const body = (await request.json()) as CmsMenuUpdate;
    const errors = validateMenuUpdate(body);

    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    const menu = await updateMenu(id, loaded.tenantId, body);

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
    const loaded = await loadMenuForActiveTenant(id);
    if ("error" in loaded) return loaded.error;

    const deleted = await deleteMenu(id, loaded.tenantId);

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
