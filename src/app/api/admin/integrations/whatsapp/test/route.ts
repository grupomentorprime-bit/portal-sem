/**
 * OT-GROWTH-MESSAGING-005 — probar conexión WhatsApp del Espacio.
 * Respuesta humana; sin detalles técnicos de Meta.
 */

import { NextResponse } from "next/server";
import { isAuthContext, requirePermission } from "@/core/identity";
import { testGrowthWhatsAppConnection } from "@/core/growth/whatsapp";
import { logServerError } from "@/core/security/redact";
import { writeAudit } from "@/lib/identity/audit";
import { openGrowthWhatsAppConnectionStore } from "@/lib/growth/whatsapp-connections";

const OK_MESSAGE = "Conexión correcta";
const FAIL_MESSAGE = "No pudimos conectar. Revisa la configuración.";

export async function POST() {
  try {
    const auth = await requirePermission("settings.integrations");
    if (!isAuthContext(auth)) return auth;

    const store = await openGrowthWhatsAppConnectionStore({
      ensureIndexes: false,
    });
    const result = await testGrowthWhatsAppConnection(store, {
      tenantId: auth.tenantId,
    });

    if (!auth.compatMode) {
      await writeAudit({
        tenantId: auth.tenantId,
        userId: auth.user._id,
        action: "settings.integrations.test",
        entity: "growth_whatsapp_connections",
        entityId: `whatsapp:${auth.tenantId}`,
      });
    }

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: FAIL_MESSAGE },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, message: OK_MESSAGE });
  } catch (error) {
    logServerError("whatsapp-connection-test", error);
    return NextResponse.json(
      { ok: false, error: FAIL_MESSAGE },
      { status: 500 }
    );
  }
}
