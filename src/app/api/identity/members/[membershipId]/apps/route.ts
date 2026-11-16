import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { writeAudit } from "@/lib/identity/audit";
import { parseAuthorizedAppsPatch } from "@/lib/desktop/app-access";
import { readSpaceContract } from "@/lib/desktop/store";
import {
  findMembershipById,
  updateMembershipAuthorizedApps,
} from "@/lib/identity/memberships";
import { isSystemAccountUser } from "@/lib/identity/iam-guard";
import { findUserById } from "@/lib/identity/users";

interface RouteContext {
  params: Promise<{ membershipId: string }>;
}

/** Reparte llaves de aplicación dentro del techo del Espacio activo. */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const ctx = await requirePermission("settings.team");
    if (ctx instanceof NextResponse) return ctx;

    const { membershipId } = await context.params;
    const membership = await findMembershipById(membershipId);
    if (!membership || membership.tenantId !== ctx.tenantId) {
      return NextResponse.json({ ok: false, error: "Membresía no encontrada." }, { status: 404 });
    }

    // Las llaves no elevan rol IAM: basta settings.team en el Espacio.
    // Sí se protege la cuenta de sistema.
    const targetUser = await findUserById(membership.userId);
    if (targetUser && isSystemAccountUser(targetUser)) {
      return NextResponse.json(
        { ok: false, error: "No se puede modificar el acceso de la cuenta de sistema." },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => null)) as { authorizedApps?: unknown } | null;
    const contract = await readSpaceContract(ctx.tenantId);
    const patch = parseAuthorizedAppsPatch({
      authorizedApps: body?.authorizedApps,
      contracted: contract.contracted,
    });
    if (!patch.ok) {
      return NextResponse.json(
        { ok: false, error: "Solo se pueden autorizar aplicaciones contratadas." },
        { status: 400 }
      );
    }

    const updated = await updateMembershipAuthorizedApps(membershipId, patch.authorizedApps);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "No se pudo guardar el acceso." }, { status: 500 });
    }

    if (!ctx.compatMode) {
      await writeAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user._id,
        action: "membership.apps.update",
        entity: "membership",
        entityId: membershipId,
        metadata: {
          targetUserId: membership.userId,
          authorizedApps: patch.authorizedApps,
          contractedApps: contract.contracted,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      membership: {
        id: updated._id,
        authorizedApps: updated.authorizedApps ?? [],
      },
      contractedApps: contract.contracted,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
