import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { isCentralUnitAdmin, revokeUnitAccess } from "@/core/units/access";
import { findOrgUnit, updateOrgUnit } from "@/core/units/repository";
import {
  findMembershipById,
  grantMembershipUnitAccess,
  setMembershipUnitAccess,
} from "@/lib/identity/memberships";
import { getDatabase } from "@/lib/mongodb";

interface RouteContext {
  params: Promise<{ unitId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const ctx = await requirePermission("settings.team");
    if (ctx instanceof NextResponse) return ctx;
    if (!isCentralUnitAdmin(ctx.membership?.unitAccess)) {
      return NextResponse.json(
        { ok: false, error: "Solo la administración del Espacio asigna unidades." },
        { status: 403 }
      );
    }

    const { unitId } = await context.params;
    const db = await getDatabase();
    const unit = await findOrgUnit(db, ctx.tenantId, unitId);
    if (!unit) {
      return NextResponse.json({ ok: false, error: "Unidad no encontrada." }, { status: 404 });
    }

    const body = (await request.json()) as {
      membershipId?: string;
      action?: "grant" | "revoke" | "responsible" | "clear-responsible";
    };
    const membership = body.membershipId
      ? await findMembershipById(body.membershipId)
      : null;
    if (!membership || membership.tenantId !== ctx.tenantId) {
      return NextResponse.json({ ok: false, error: "Membresía no encontrada." }, { status: 404 });
    }

    if (body.action === "grant") {
      const updated = await grantMembershipUnitAccess(membership._id, {
        mode: "units",
        unitIds: [unitId],
      });
      return NextResponse.json({ ok: true, membership: updated });
    }

    if (body.action === "revoke") {
      const next = revokeUnitAccess(membership.unitAccess, unitId);
      if (!next || next.mode === "tenant") {
        return NextResponse.json({
          ok: true,
          membership,
          unchanged: true,
        });
      }
      const updated = await setMembershipUnitAccess(membership._id, next);
      const responsibleUserIds = unit.responsibleUserIds.filter((id) => id !== membership.userId);
      if (responsibleUserIds.length !== unit.responsibleUserIds.length) {
        await updateOrgUnit(db, ctx.tenantId, unitId, { responsibleUserIds });
      }
      return NextResponse.json({ ok: true, membership: updated });
    }

    if (body.action === "responsible" || body.action === "clear-responsible") {
      const hasAccess =
        !membership.unitAccess ||
        membership.unitAccess.mode === "tenant" ||
        membership.unitAccess.unitIds.includes(unitId);
      if (body.action === "responsible" && !hasAccess) {
        await grantMembershipUnitAccess(membership._id, { mode: "units", unitIds: [unitId] });
      }
      const responsibleUserIds =
        body.action === "responsible"
          ? [...new Set([...unit.responsibleUserIds, membership.userId])]
          : unit.responsibleUserIds.filter((id) => id !== membership.userId);
      const updated = await updateOrgUnit(db, ctx.tenantId, unitId, { responsibleUserIds });
      return NextResponse.json({ ok: true, unit: updated });
    }

    return NextResponse.json({ ok: false, error: "Acción no válida." }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
