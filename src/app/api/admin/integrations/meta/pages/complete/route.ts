import { NextResponse } from "next/server";
import { isAuthContext, requirePermission } from "@/core/identity";
import { completeMetaPagesConnection } from "@/core/growth/meta-pages/complete";
import { createHttpMetaPagesGraph } from "@/core/growth/meta-pages/graph";
import { getMetaAppSecret } from "@/core/growth/whatsapp/meta-platform";
import { logServerError } from "@/core/security/redact";
import { openMetaPageConnectionStore } from "@/lib/growth/meta-pages-store";

const REASONS: Record<string, string> = {
  invalid_state: "La autorización venció. Vuelve a conectar.",
  state_tenant_mismatch: "La autorización no corresponde a este Espacio.",
  missing_code: "Meta no devolvió la autorización.",
  no_pages: "Meta no mostró una página de Facebook para este Espacio.",
  token_exchange_failed: "No se pudo confirmar la autorización con Meta.",
  pages_failed: "No se pudieron leer las páginas de Facebook.",
};

export async function POST(request: Request) {
  try {
    const auth = await requirePermission("settings.integrations");
    if (!isAuthContext(auth)) return auth;

    const appSecret = getMetaAppSecret();
    const appId = process.env.META_APP_ID?.trim() ?? "";
    if (!appSecret || !appId) {
      return NextResponse.json(
        { ok: false, error: "La conexión guiada con Meta aún no está disponible en esta instalación." },
        { status: 503 }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      code?: unknown;
      state?: unknown;
    } | null;
    const code = typeof body?.code === "string" ? body.code : "";
    const state = typeof body?.state === "string" ? body.state : "";

    const result = await completeMetaPagesConnection(
      await openMetaPageConnectionStore(),
      createHttpMetaPagesGraph(),
      { tenantId: auth.tenantId, state, code, appId, appSecret }
    );

    if (!result.ok) {
      const message =
        "message" in result && result.message ? result.message : REASONS[result.reason] ?? REASONS.pages_failed;
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, channels: result.channels });
  } catch (error) {
    logServerError("meta-pages-complete", error);
    return NextResponse.json(
      { ok: false, error: "No se pudo guardar la conexión con Meta." },
      { status: 500 }
    );
  }
}
