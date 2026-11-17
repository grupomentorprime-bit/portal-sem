import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { isCentralUnitAdmin } from "@/core/units/access";
import { normalizeEnabledAppIds } from "@/core/units/apps";
import { findOrgUnit, updateOrgUnit } from "@/core/units/repository";
import { UNIT_KINDS, UNIT_STATUSES, type UnitKind, type UnitStatus } from "@/core/units/types";
import { getDatabase } from "@/lib/mongodb";

interface RouteContext {
  params: Promise<{ unitId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const ctx = await requirePermission("settings.team");
    if (ctx instanceof NextResponse) return ctx;
    if (!isCentralUnitAdmin(ctx.membership?.unitAccess)) {
      return NextResponse.json(
        { ok: false, error: "Solo la administración del Espacio edita unidades." },
        { status: 403 }
      );
    }

    const { unitId } = await context.params;
    const db = await getDatabase();
    const current = await findOrgUnit(db, ctx.tenantId, unitId);
    if (!current) {
      return NextResponse.json({ ok: false, error: "Unidad no encontrada." }, { status: 404 });
    }

    const body = (await request.json()) as {
      name?: string;
      kind?: string;
      status?: string;
      enabledAppIds?: string[];
      responsibleUserIds?: string[];
    };

    if (body.kind && !(UNIT_KINDS as readonly string[]).includes(body.kind)) {
      return NextResponse.json({ ok: false, error: "El tipo de unidad no es válido." }, { status: 400 });
    }
    if (body.status && !(UNIT_STATUSES as readonly string[]).includes(body.status)) {
      return NextResponse.json({ ok: false, error: "El estado no es válido." }, { status: 400 });
    }
    if (body.enabledAppIds) {
      const apps = normalizeEnabledAppIds(body.enabledAppIds);
      if (!apps.ok) {
        return NextResponse.json({ ok: false, error: apps.error }, { status: 400 });
      }
    }

    const unit = await updateOrgUnit(db, ctx.tenantId, unitId, {
      name: body.name,
      kind: body.kind as UnitKind | undefined,
      status: body.status as UnitStatus | undefined,
      enabledAppIds: body.enabledAppIds,
      responsibleUserIds: body.responsibleUserIds,
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
