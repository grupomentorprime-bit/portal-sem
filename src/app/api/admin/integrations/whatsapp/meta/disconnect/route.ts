/**
 * OT-GROWTH-WHATSAPP-META-001 — desconectar WhatsApp del Espacio actual.
 */

import { NextResponse } from "next/server";
import { isAuthContext, requirePermission } from "@/core/identity";
import {
  disconnectWhatsAppConnection,
  toWhatsAppChannelAdminView,
} from "@/core/growth/whatsapp";
import { logServerError } from "@/core/security/redact";
import { writeAudit } from "@/lib/identity/audit";
import { openGrowthWhatsAppConnectionStore } from "@/lib/growth/whatsapp-connections";

export async function POST() {
  try {
    const auth = await requirePermission("settings.integrations");
    if (!isAuthContext(auth)) return auth;

    const store = await openGrowthWhatsAppConnectionStore({
      ensureIndexes: false,
    });
    const existing = await store.findByTenantId(auth.tenantId);
    const result = await disconnectWhatsAppConnection(store, auth.tenantId);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: "No hay una conexión de WhatsApp en este Espacio." },
        { status: 404 }
      );
    }

    if (!auth.compatMode && existing) {
      await writeAudit({
        tenantId: auth.tenantId,
        userId: auth.user._id,
        action: "settings.integrations.update",
        entity: "growth_whatsapp_connections",
        entityId: existing._id,
      });
    }

    return NextResponse.json({
      ok: true,
      connection: null,
      channel: toWhatsAppChannelAdminView(null),
      removed: result.removed,
    });
  } catch (error) {
    logServerError("whatsapp-meta-disconnect", error);
    return NextResponse.json(
      { ok: false, error: "No se pudo desconectar WhatsApp." },
      { status: 500 }
    );
  }
}
