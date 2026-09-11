/**
 * OT-GROWTH-MESSAGING-002 — configurar cuenta WhatsApp del Espacio.
 * Secretos cifrados; la respuesta pública nunca incluye tokens.
 * OT-GROWTH-MESSAGING-005 — vista de canal humana para Ajustes → Canales.
 */

import { NextResponse } from "next/server";
import { isAuthContext, requirePermission } from "@/core/identity";
import {
  toPublicWhatsAppConnection,
  toWhatsAppChannelAdminView,
  upsertGrowthWhatsAppConnection,
} from "@/core/growth/whatsapp";
import { logServerError } from "@/core/security/redact";
import { writeAudit } from "@/lib/identity/audit";
import { openGrowthWhatsAppConnectionStore } from "@/lib/growth/whatsapp-connections";

export async function GET() {
  try {
    const auth = await requirePermission("settings.integrations");
    if (!isAuthContext(auth)) return auth;

    const store = await openGrowthWhatsAppConnectionStore({
      ensureIndexes: false,
    });
    const connection = await store.findByTenantId(auth.tenantId);
    const publicConnection = connection
      ? toPublicWhatsAppConnection(connection)
      : null;
    return NextResponse.json({
      ok: true,
      connection: publicConnection,
      channel: toWhatsAppChannelAdminView(publicConnection),
    });
  } catch (error) {
    logServerError("whatsapp-connection-get", error);
    return NextResponse.json(
      { ok: false, error: "No se pudo leer la conexión de WhatsApp." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requirePermission("settings.integrations");
    if (!isAuthContext(auth)) return auth;

    const body = (await request.json()) as {
      phoneNumberId?: string;
      wabaId?: string;
      displayPhoneNumber?: string;
      verifyToken?: string;
      appSecret?: string;
      accessToken?: string;
      enabled?: boolean;
    };

    const store = await openGrowthWhatsAppConnectionStore();
    const result = await upsertGrowthWhatsAppConnection(store, {
      tenantId: auth.tenantId,
      phoneNumberId: body.phoneNumberId ?? "",
      wabaId: body.wabaId,
      displayPhoneNumber: body.displayPhoneNumber,
      verifyToken: body.verifyToken,
      appSecret: body.appSecret,
      accessToken: body.accessToken,
      enabled: body.enabled,
    });

    if (!result.ok) {
      const messages: Record<typeof result.reason, string> = {
        missing_tenant: "Espacio no válido.",
        missing_phone_number_id: "El identificador del número es obligatorio.",
        missing_verify_token: "El token de verificación es obligatorio.",
        missing_app_secret: "El secreto de la aplicación es obligatorio.",
        phone_number_in_use:
          "Ese número de WhatsApp ya está conectado a otro Espacio.",
      };
      return NextResponse.json(
        { ok: false, error: messages[result.reason] },
        { status: result.reason === "phone_number_in_use" ? 409 : 400 }
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
    logServerError("whatsapp-connection-put", error);
    return NextResponse.json(
      { ok: false, error: "No se pudo guardar la conexión de WhatsApp." },
      { status: 500 }
    );
  }
}
