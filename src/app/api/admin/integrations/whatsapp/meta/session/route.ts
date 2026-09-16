/**
 * OT-GROWTH-WHATSAPP-META-001 — iniciar Embedded Signup (config pública + state).
 * No expone App Secret ni verify token de plataforma.
 */

import { NextResponse } from "next/server";
import { isAuthContext, requirePermission } from "@/core/identity";
import {
  createWhatsAppConnectState,
  getMetaPlatformPublicConfig,
  toPublicWhatsAppConnection,
  toWhatsAppChannelAdminView,
} from "@/core/growth/whatsapp";
import { logServerError } from "@/core/security/redact";
import { openGrowthWhatsAppConnectionStore } from "@/lib/growth/whatsapp-connections";

export async function GET() {
  try {
    const auth = await requirePermission("settings.integrations");
    if (!isAuthContext(auth)) return auth;

    const meta = getMetaPlatformPublicConfig();
    const store = await openGrowthWhatsAppConnectionStore({
      ensureIndexes: false,
    });
    const connection = await store.findByTenantId(auth.tenantId);
    const publicConnection = connection
      ? toPublicWhatsAppConnection(connection)
      : null;

    const state = meta.ready
      ? createWhatsAppConnectState(auth.tenantId)
      : null;

    return NextResponse.json({
      ok: true,
      meta: {
        ready: meta.ready,
        appId: meta.appId,
        esConfigId: meta.esConfigId,
        // Solo nombres de variables faltantes — nunca valores.
        missing: meta.missing,
      },
      state,
      connection: publicConnection,
      channel: toWhatsAppChannelAdminView(publicConnection),
    });
  } catch (error) {
    logServerError("whatsapp-meta-session", error);
    return NextResponse.json(
      { ok: false, error: "No se pudo preparar la conexión con Meta." },
      { status: 500 }
    );
  }
}
