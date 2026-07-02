import { NextResponse } from "next/server";
import { isEmailAuthEnabled } from "@/core/identity/auth/config";
import { getActiveTenantId, loginWithEmail } from "@/core/identity";

export async function POST(request: Request) {
  try {
    if (!isEmailAuthEnabled()) {
      return NextResponse.json(
        { ok: false, error: "El acceso es solo mediante cuenta institucional." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as { email?: string; password?: string };
    const tenantId = await getActiveTenantId();

    if (!tenantId) {
      return NextResponse.json({ ok: false, error: "Tenant no configurado." }, { status: 503 });
    }

    if (!body.email?.trim() || !body.password) {
      return NextResponse.json(
        { ok: false, error: "Email y contraseña son obligatorios." },
        { status: 400 }
      );
    }

    const result = await loginWithEmail({
      email: body.email,
      password: body.password,
      tenantId,
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
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
