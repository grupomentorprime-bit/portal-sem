import { NextResponse } from "next/server";
import { isEmailAuthEnabled } from "@/core/identity/auth/config";
import { hasPlatformOperatorCapability, loginWithEmail } from "@/core/identity";
import { resolveActiveTenantIdFromRequest } from "@/core/tenant/context";
import { publicInternalError } from "@/core/security/public-error";

export async function POST(request: Request) {
  try {
    if (!isEmailAuthEnabled()) {
      return NextResponse.json(
        { ok: false, error: "El acceso es solo mediante cuenta institucional." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as { email?: string; password?: string };
    // Host solo como preferencia; el Espacio activo sale de membresías.
    const preferredTenantId = await resolveActiveTenantIdFromRequest();

    if (!body.email?.trim() || !body.password) {
      return NextResponse.json(
        { ok: false, error: "Email y contraseña son obligatorios." },
        { status: 400 }
      );
    }

    const result = await loginWithEmail({
      email: body.email,
      password: body.password,
      preferredTenantId,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: result.user._id,
        email: result.user.email,
        displayName: result.user.displayName,
      },
      activeTenantId: result.activeTenantId,
      hasSpace: Boolean(result.activeTenantId),
      isPlatformOperator: hasPlatformOperatorCapability(result.user),
      platformRoles: result.user.platformRoles ?? [],
    });
  } catch (error) {
    return publicInternalError("identity-login", error);
  }
}
