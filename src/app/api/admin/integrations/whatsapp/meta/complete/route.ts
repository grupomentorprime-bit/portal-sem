/**
 * OT-GROWTH-WHATSAPP-META-001 — completar Embedded Signup (servidor).
 * Recibe code + assets del SDK; exchange y secretos solo en servidor.
 */

import { NextResponse } from "next/server";
import { isAuthContext, requirePermission } from "@/core/identity";
import {
  completeWhatsAppEmbeddedSignup,
  toPublicWhatsAppConnection,
  toWhatsAppChannelAdminView,
} from "@/core/growth/whatsapp";
import { logServerError } from "@/core/security/redact";
import { writeAudit } from "@/lib/identity/audit";
import { openGrowthWhatsAppConnectionStore } from "@/lib/growth/whatsapp-connections";

export async function POST(request: Request) {
  try {
    const auth = await requirePermission("settings.integrations");
    if (!isAuthContext(auth)) return auth;

    const body = (await request.json()) as {
      state?: string;
      code?: string;
      phoneNumberId?: string;
      wabaId?: string;
      businessId?: string;
      displayPhoneNumber?: string;
    };

    const store = await openGrowthWhatsAppConnectionStore();
    const result = await completeWhatsAppEmbeddedSignup(store, {
      tenantId: auth.tenantId,
      state: body.state ?? "",
      code: body.code ?? "",
      phoneNumberId: body.phoneNumberId ?? "",
      wabaId: body.wabaId ?? "",
      businessId: body.businessId,
      displayPhoneNumber: body.displayPhoneNumber,
    });

    if (!result.ok) {
      const statusByReason: Record<typeof result.reason, number> = {
        meta_not_configured: 503,
        invalid_state: 400,
        state_tenant_mismatch: 403,
        missing_code: 400,
        missing_phone_number_id: 400,
        missing_waba_id: 400,
        phone_number_in_use: 409,
        token_exchange_failed: 502,
        subscribe_failed: 502,
        persist_failed: 500,
      };
      const messages: Record<typeof result.reason, string> = {
        meta_not_configured:
          "WhatsApp guiado no está disponible: falta configuración Meta de plataforma.",
        invalid_state:
          "La sesión de conexión expiró o no es válida. Volvé a intentarlo.",
        state_tenant_mismatch:
          "La conexión no corresponde a este Espacio.",
        missing_code: "Meta no devolvió un código de autorización.",
        missing_phone_number_id: "Meta no devolvió el número de WhatsApp.",
        missing_waba_id: "Meta no devolvió la cuenta de WhatsApp Business.",
        phone_number_in_use:
          "Ese número de WhatsApp ya está conectado a otro Espacio.",
        token_exchange_failed:
          "message" in result
            ? "No se pudo completar la autorización con Meta."
            : "No se pudo completar la autorización con Meta.",
        subscribe_failed:
          "No se pudo activar la recepción de mensajes para este número.",
        persist_failed: "No se pudo guardar la conexión de WhatsApp.",
      };
      return NextResponse.json(
        { ok: false, error: messages[result.reason] },
        { status: statusByReason[result.reason] }
      );
    }

    if (!auth.compatMode) {
      await writeAudit({
        tenantId: auth.tenantId,
        userId: auth.user._id,
        action: "settings.integrations.update",
        entity: "growth_whatsapp_connections",
        entityId: result.connection._id,
      });
    }

    const publicConnection = toPublicWhatsAppConnection(result.connection);
    return NextResponse.json({
      ok: true,
      connection: publicConnection,
      channel: toWhatsAppChannelAdminView(publicConnection),
    });
  } catch (error) {
    logServerError("whatsapp-meta-complete", error);
    return NextResponse.json(
      { ok: false, error: "No se pudo completar la conexión de WhatsApp." },
      { status: 500 }
    );
  }
}
