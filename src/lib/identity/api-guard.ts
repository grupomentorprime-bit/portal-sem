import { NextResponse } from "next/server";
import { requirePermission, isAuthContext } from "@/core/identity";
import type { PermissionId } from "@/core/identity/permissions/registry";
import { writeAudit } from "@/lib/identity/audit";

export async function authorizeApiWrite(
  permission: PermissionId | string,
  audit?: { action: string; entity: string; entityId?: string }
): Promise<NextResponse | null> {
  const ctx = await requirePermission(permission);
  if (ctx instanceof NextResponse) return ctx;

  if (!ctx.compatMode && audit) {
    await writeAudit({
      tenantId: ctx.tenantId,
      userId: ctx.user._id,
      action: audit.action,
      entity: audit.entity,
      entityId: audit.entityId,
    });
  }

  return null;
}

export { isAuthContext };
