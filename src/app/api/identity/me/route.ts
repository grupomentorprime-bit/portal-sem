import { NextResponse } from "next/server";
import { requireAuth, requireSession } from "@/core/identity";
import { getInstitutionalRoleLabel } from "@/lib/admin/institutional";
import { getSiteConfigUncached } from "@/lib/cms/config";
import { findRolesByIds } from "@/lib/identity/roles";
import { loadSessionContext } from "@/lib/identity/sessions";
import { changeUserPassword, updateUserProfile } from "@/lib/identity/users";
import { writeAudit } from "@/lib/identity/audit";

function serializeUser(user: {
  _id: string;
  email: string;
  displayName: string;
  jobTitle?: string;
  phone?: string;
  timezone?: string;
  locale?: string;
  lastLoginAt?: string;
}) {
  return {
    id: user._id,
    email: user.email,
    displayName: user.displayName,
    jobTitle: user.jobTitle ?? "",
    phone: user.phone ?? "",
    timezone: user.timezone ?? "America/Santiago",
    locale: user.locale ?? "es-CL",
    lastLoginAt: user.lastLoginAt,
  };
}

export async function GET() {
  try {
    const session = await loadSessionContext();
    const ctx = await requireAuth();
    if (ctx instanceof NextResponse) return ctx;

    const config = await getSiteConfigUncached();
    const roles = ctx.membership
      ? await findRolesByIds(ctx.tenantId, ctx.membership.roleIds)
      : [];
    const primaryRole = roles[0]?.name;

    const user = session?.user ?? ctx.user;

    return NextResponse.json({
      ok: true,
      user: serializeUser(user),
      institutionName: config?.institution.name ?? "Institución",
      tenantId: ctx.tenantId,
      permissions: ctx.permissions,
      roles: roles.map((r) => ({
        id: r._id,
        name: r.name,
        label: getInstitutionalRoleLabel(r.name),
      })),
      roleLabel: primaryRole ? getInstitutionalRoleLabel(primaryRole) : "Colaborador",
      compatMode: ctx.compatMode,
      authenticated: Boolean(session),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireSession();
    if (ctx instanceof NextResponse) return ctx;

    const body = (await request.json()) as {
      displayName?: string;
      jobTitle?: string;
      phone?: string;
      timezone?: string;
      locale?: string;
      currentPassword?: string;
      newPassword?: string;
    };

    const hasProfileFields =
      body.displayName !== undefined ||
      body.jobTitle !== undefined ||
      body.phone !== undefined ||
      body.timezone !== undefined ||
      body.locale !== undefined;

    if (hasProfileFields) {
      if (body.displayName !== undefined && !body.displayName.trim()) {
        return NextResponse.json({ ok: false, error: "El nombre es obligatorio." }, { status: 400 });
      }

      const user = await updateUserProfile(ctx.user._id, {
        displayName: body.displayName,
        jobTitle: body.jobTitle,
        phone: body.phone,
        timezone: body.timezone,
        locale: body.locale,
      });

      if (!ctx.compatMode) {
        await writeAudit({
          tenantId: ctx.tenantId,
          userId: ctx.user._id,
          action: "user.profile.update",
          entity: "user",
          entityId: ctx.user._id,
        });
      }

      return NextResponse.json({ ok: true, user: user ? serializeUser(user) : null });
    }

    if (body.newPassword !== undefined) {
      if (!body.currentPassword) {
        return NextResponse.json(
          { ok: false, error: "La contraseña actual es obligatoria." },
          { status: 400 }
        );
      }

      const result = await changeUserPassword(
        ctx.user._id,
        body.currentPassword,
        body.newPassword
      );

      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
      }

      if (!ctx.compatMode) {
        await writeAudit({
          tenantId: ctx.tenantId,
          userId: ctx.user._id,
          action: "user.password.change",
          entity: "user",
          entityId: ctx.user._id,
        });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Nada que actualizar." }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
