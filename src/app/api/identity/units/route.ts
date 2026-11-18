import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { isCentralUnitAdmin } from "@/core/units/access";
import { UNIT_APP_CATALOG, normalizeEnabledAppIds } from "@/core/units/apps";
import { insertOrgUnit, listOrgUnits } from "@/core/units/repository";
import { UNIT_KINDS, type UnitKind } from "@/core/units/types";
import { normalizeSpaceSlug } from "@/core/tenant/create-platform-space";
import { getDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const ctx = await requirePermission("settings.team");
    if (ctx instanceof NextResponse) return ctx;

    const units = await listOrgUnits(await getDatabase(), ctx.tenantId);
    const visible = isCentralUnitAdmin(ctx.membership?.unitAccess)
      ? units
      : units.filter((unit) => ctx.membership?.unitAccess?.mode === "units"
          && ctx.membership.unitAccess.unitIds.includes(unit.unitId));

    return NextResponse.json({
      ok: true,
      central: isCentralUnitAdmin(ctx.membership?.unitAccess),
      apps: UNIT_APP_CATALOG,
      units: visible,
    });
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
    const ctx = await requirePermission("settings.team");
    if (ctx instanceof NextResponse) return ctx;
    if (!isCentralUnitAdmin(ctx.membership?.unitAccess)) {
      return NextResponse.json(
        { ok: false, error: "Solo la administración del Espacio crea unidades." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      name?: string;
      kind?: string;
      enabledAppIds?: string[];
    };
    const name = body.name?.trim() ?? "";
    const unitId = normalizeSpaceSlug(name);
    if (!name || !unitId) {
      return NextResponse.json({ ok: false, error: "Indica el nombre de la unidad." }, { status: 400 });
    }
    if (!body.kind || !(UNIT_KINDS as readonly string[]).includes(body.kind)) {
      return NextResponse.json({ ok: false, error: "El tipo de unidad no es válido." }, { status: 400 });
    }
    const apps = normalizeEnabledAppIds(body.enabledAppIds ?? []);
    if (!apps.ok) {
      return NextResponse.json({ ok: false, error: apps.error }, { status: 400 });
    }

    const db = await getDatabase();
    const existing = (await listOrgUnits(db, ctx.tenantId)).some((unit) => unit.unitId === unitId);
    if (existing) {
      return NextResponse.json({ ok: false, error: "Ya existe una unidad con ese nombre." }, { status: 409 });
    }

    const unit = await insertOrgUnit(db, {
      tenantId: ctx.tenantId,
      unitId,
      name,
      kind: body.kind as UnitKind,
      enabledAppIds: apps.appIds,
    });
    return NextResponse.json({ ok: true, unit });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
