import { NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/core/identity";
import { writeAudit } from "@/lib/identity/audit";
import { createCustomEnterpriseRole, getCallerRoleCode, getRoleCode, listRolesByTenant } from "@/lib/identity/roles";
import { getInstitutionalRoleLabel } from "@/lib/admin/institutional";
import {
  assertCanWriteProfilePermissions,
  classifyEnterpriseProfile,
  validateCustomProfileDescription,
  validateCustomProfileName,
} from "@/lib/identity/enterprise-profiles";
import { resolvePermissionDetailsForMembership } from "@/lib/identity/permission-resolver";

export async function GET() {
  try {
    const ctx = await requireAuth();
    if (ctx instanceof NextResponse) return ctx;

    // Lectura pura — sync de roles solo en login/bootstrap/migración (SAAS-004).
    const roles = await listRolesByTenant(ctx.tenantId);
    const callerEffective = ctx.membership
      ? (await resolvePermissionDetailsForMembership(ctx.tenantId, ctx.membership)).effective
      : {};
    const grantable = Object.entries(callerEffective)
      .filter(([, allowed]) => allowed === true)
      .map(([code]) => code);

    return NextResponse.json({
      ok: true,
      grantable,
      roles: roles
        .filter((role) => classifyEnterpriseProfile(role) !== "product")
        .map((role) => {
          const code = getRoleCode(role);
          const kind = classifyEnterpriseProfile(role);
          return {
            id: role._id,
            name: role.name,
            code: code ?? undefined,
            label: code ? getInstitutionalRoleLabel(code) : role.name,
            description: role.description,
            permissionIds: role.permissionIds,
            system: role.system,
            kind,
          };
        }),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/** Perfil personalizado del Espacio. Reutiliza identity_roles; no crea otro motor. */
export async function POST(request: Request) {
  try {
    const ctx = await requirePermission("identity.roles.manage");
    if (ctx instanceof NextResponse) return ctx;
    if (!ctx.membership) {
      return NextResponse.json({ ok: false, error: "Sin membresía activa." }, { status: 403 });
    }

    const body = (await request.json().catch(() => null)) as {
      name?: string;
      description?: string;
      permissionMap?: Record<string, boolean>;
    } | null;

    const name = validateCustomProfileName(body?.name ?? "");
    if (!name.ok) {
      return NextResponse.json({ ok: false, error: name.error }, { status: 400 });
    }
    const description = validateCustomProfileDescription(body?.description ?? "");
    if (!description.ok) {
      return NextResponse.json({ ok: false, error: description.error }, { status: 400 });
    }

    const callerRoleCode = await getCallerRoleCode(ctx.tenantId, ctx.membership.roleIds);
    const details = await resolvePermissionDetailsForMembership(ctx.tenantId, ctx.membership);
    const permissionMap = body?.permissionMap ?? {};
    const writeCheck = assertCanWriteProfilePermissions({
      callerCode: callerRoleCode,
      callerEffective: details.effective,
      role: { name: name.name, system: false },
      permissionMap,
    });
    if (!writeCheck.ok) {
      return NextResponse.json({ ok: false, error: writeCheck.error }, { status: 403 });
    }

    const role = await createCustomEnterpriseRole({
      tenantId: ctx.tenantId,
      name: name.name,
      description: description.description,
      permissionMap,
    });

    if (!ctx.compatMode) {
      await writeAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user._id,
        action: "role.create",
        entity: "role",
        entityId: role._id,
        metadata: { name: role.name, kind: "custom" },
      });
    }

    return NextResponse.json({
      ok: true,
      role: {
        id: role._id,
        name: role.name,
        label: role.name,
        description: role.description,
        system: false,
        kind: "custom",
      },
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "No se pudo crear el perfil.";
    const status = message.includes("Ya existe") ? 409 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
