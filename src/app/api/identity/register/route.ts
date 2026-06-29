import { NextResponse } from "next/server";
import { getActiveTenantId, registerWithEmail } from "@/core/identity";
import { getDatabase } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const tenantId = await getActiveTenantId();
    if (!tenantId) {
      return NextResponse.json({ ok: false, error: "Tenant no configurado." }, { status: 503 });
    }

    const db = await getDatabase();
    const userCount = await db.collection("identity_users").countDocuments();
    if (userCount > 0) {
      return NextResponse.json(
        { ok: false, error: "Registro deshabilitado. Solicite una invitación." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      email?: string;
      password?: string;
      displayName?: string;
    };

    if (!body.email?.trim() || !body.password || !body.displayName?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Email, nombre y contraseña son obligatorios." },
        { status: 400 }
      );
    }

    const result = await registerWithEmail({
      email: body.email,
      password: body.password,
      displayName: body.displayName,
      tenantId,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
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
