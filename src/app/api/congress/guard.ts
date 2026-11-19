import { NextResponse } from "next/server";
import { can, requirePermission } from "@/core/identity";
import { isCongressVaronesPlace } from "@/core/congress/place";
import type { AuthContext } from "@/types/identity";

function rejectOutsideCongressPlace(ctx: AuthContext): NextResponse | null {
  const unitIds =
    ctx.membership?.unitAccess?.mode === "units" ? ctx.membership.unitAccess.unitIds : null;
  if (isCongressVaronesPlace({ tenantId: ctx.tenantId, unitIds })) return null;
  return NextResponse.json(
    {
      ok: false,
      error: "El Congreso de Varones solo está en IPN Chile, Departamento Nacional de Varones.",
    },
    { status: 404 }
  );
}

async function requireCongressPermission(permission: Parameters<typeof requirePermission>[0]) {
  const ctx = await requirePermission(permission);
  if (ctx instanceof NextResponse) return ctx;
  const rejected = rejectOutsideCongressPlace(ctx);
  if (rejected) return rejected;
  return ctx;
}

export async function requireCongressView() {
  return requireCongressPermission("congress.view");
}

export async function requireCongressOperate() {
  return requireCongressPermission("congress.operate");
}

export async function requireCongressPayments() {
  return requireCongressPermission("congress.payments");
}

export async function requireCongressImport() {
  return requireCongressPermission("congress.import");
}

export async function requireCongressFinanceCorrect() {
  return requireCongressPermission("congress.finance.correct");
}

export function congressCapabilities(ctx: AuthContext) {
  return {
    view: can(ctx, "congress.view"),
    operate: can(ctx, "congress.operate"),
    payments: can(ctx, "congress.payments"),
    financeCorrect: can(ctx, "congress.finance.correct"),
    import: can(ctx, "congress.import"),
  };
}
