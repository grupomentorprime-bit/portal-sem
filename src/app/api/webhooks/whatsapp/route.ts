/**
 * OT-GROWTH-MESSAGING-002 — webhook WhatsApp Cloud API (verificación + inbound).
 * Público (Meta). Autenticación: verify_token (GET) / X-Hub-Signature-256 (POST).
 */

import { NextResponse } from "next/server";
import {
  openGrowthMessagingStore,
  openGrowthPersonaStore,
  receiveWhatsAppCloudWebhook,
  verifyWhatsAppWebhookSubscription,
} from "@/core/growth";
import { publicInternalError } from "@/core/security/public-error";
import { createGrowthEventBusAdapter } from "@/lib/growth/event-bus";
import { openGrowthWhatsAppConnectionStore } from "@/lib/growth/whatsapp-connections";
import { getDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const connections = await openGrowthWhatsAppConnectionStore({
      ensureIndexes: false,
    });
    const result = await verifyWhatsAppWebhookSubscription(connections, {
      mode: url.searchParams.get("hub.mode"),
      token: url.searchParams.get("hub.verify_token"),
      challenge: url.searchParams.get("hub.challenge"),
    });

    if (!result.ok) {
      return new NextResponse(null, { status: 403 });
    }

    return new NextResponse(result.challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    return publicInternalError("whatsapp-webhook-verify", error);
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("x-hub-signature-256");

    const db = await getDatabase();
    const [connections, personas, messaging] = await Promise.all([
      openGrowthWhatsAppConnectionStore(),
      openGrowthPersonaStore(db),
      openGrowthMessagingStore(db),
    ]);

    const result = await receiveWhatsAppCloudWebhook(
      {
        connections,
        personas,
        messaging,
        eventBus: createGrowthEventBusAdapter(),
      },
      { rawBody, signatureHeader }
    );

    if (!result.ok) {
      return NextResponse.json(
        { ok: false },
        { status: result.httpStatus }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return publicInternalError("whatsapp-webhook-inbound", error);
  }
}
