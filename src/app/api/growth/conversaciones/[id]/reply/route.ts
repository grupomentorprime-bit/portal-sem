/**
 * OT-GROWTH-MESSAGING-003 — responder WhatsApp en conversación existente.
 * Permiso operativo (growth.sales.operate). Secretos solo servidor.
 */

import { NextResponse } from "next/server";
import { isAuthContext, requirePermission } from "@/core/identity";
import { sendWhatsAppReply } from "@/core/growth/whatsapp";
import { logServerError } from "@/core/security/redact";
import { createGrowthEventBusAdapter } from "@/lib/growth/event-bus";
import { openGrowthMessagingStore } from "@/core/growth/messaging";
import { openGrowthWhatsAppConnectionStore } from "@/lib/growth/whatsapp-connections";
import { getDatabase } from "@/lib/mongodb";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const auth = await requirePermission("growth.sales.operate");
    if (!isAuthContext(auth)) return auth;

    const { id } = await params;
    const body = (await request.json()) as {
      body?: string;
      clientRequestId?: string;
    };

    const db = await getDatabase();
    const [messaging, connections] = await Promise.all([
      openGrowthMessagingStore(db),
      openGrowthWhatsAppConnectionStore({ ensureIndexes: false }),
    ]);

    const result = await sendWhatsAppReply(
      {
        messaging,
        connections,
        eventBus: createGrowthEventBusAdapter(),
      },
      {
        tenantId: auth.tenantId,
        conversationId: id,
        body: body.body ?? "",
        clientRequestId: body.clientRequestId,
        actorUserId: auth.user._id,
      }
    );

    if (!result.ok) {
      const statusByReason: Record<typeof result.reason, number> = {
        missing_tenant: 400,
        missing_body: 400,
        conversation_not_found: 404,
        not_whatsapp_conversation: 400,
        connection_unavailable: 409,
        recipient_unavailable: 409,
        template_required: 409,
        provider_rejected: 502,
      };
      const messages: Record<typeof result.reason, string> = {
        missing_tenant: "Espacio no válido.",
        missing_body: "El texto de la respuesta es obligatorio.",
        conversation_not_found: "Conversación no encontrada en este Espacio.",
        not_whatsapp_conversation: "La conversación no es de WhatsApp.",
        connection_unavailable:
          "WhatsApp no está conectado o falta el token de envío en este Espacio.",
        recipient_unavailable:
          "No hay número destinatario en la conversación.",
        template_required:
          "La respuesta libre no está permitida: hace falta una plantilla (ventana de servicio).",
        provider_rejected: "Meta rechazó el envío.",
      };

      return NextResponse.json(
        {
          ok: false,
          reason: result.reason,
          error: messages[result.reason],
          ...(result.reason === "template_required"
            ? {
                windowReason: result.windowReason,
                ...(result.lastInboundAt
                  ? { lastInboundAt: result.lastInboundAt }
                  : {}),
                ...(result.closesAt ? { closesAt: result.closesAt } : {}),
                messageId: result.message._id,
                status: result.message.status,
                failureCode: result.message.failureCode,
              }
            : {}),
          ...(result.reason === "provider_rejected"
            ? {
                messageId: result.message._id,
                status: result.message.status,
                failureCode: result.failureCode,
                failureDetail: result.failureDetail,
              }
            : {}),
        },
        { status: statusByReason[result.reason] }
      );
    }

    return NextResponse.json({
      ok: true,
      conversationId: result.conversation._id,
      messageId: result.message._id,
      direction: result.message.direction,
      status: result.message.status,
      body: result.message.body,
      occurredAt: result.message.occurredAt,
      externalMessageId: result.message.externalMessageId,
      duplicated: result.duplicated,
      published: result.published,
    });
  } catch (error) {
    logServerError("whatsapp-reply", error);
    return NextResponse.json(
      { ok: false, error: "No se pudo enviar la respuesta de WhatsApp." },
      { status: 500 }
    );
  }
}
