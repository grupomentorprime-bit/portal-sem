/**
 * OT-GROWTH-MESSAGING-002 / E2E-FIX-002 — webhook WhatsApp Cloud API
 * (verificación + inbound comercial: Persona → Opp → Conversación).
 * Público (Meta). Autenticación: verify_token (GET) / X-Hub-Signature-256 (POST).
 */

import { NextResponse } from "next/server";
import {
  openGrowthMessagingStore,
  openGrowthOpportunityStore,
  openGrowthPersonaStore,
  receiveWhatsAppCloudWebhook,
  verifyWhatsAppWebhookSubscription,
} from "@/core/growth";
import {
  createMongoGrowthAutomationStore,
  ensureGrowthAutomationIndexes,
  ensureGrowthStartupNextActionAutomation,
} from "@/core/growth/automations";
import { publicInternalError } from "@/core/security/public-error";
import { createGrowthEventBusAdapter } from "@/lib/growth/event-bus";
import { createMongoGrowthOpportunityWorkflow } from "@/lib/growth/opportunity-workflow";
import { openGrowthWhatsAppConnectionStore } from "@/lib/growth/whatsapp-connections";
import { getDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";

async function ensureStartupNextActionAutomationSafe(
  db: Awaited<ReturnType<typeof getDatabase>>,
  tenantId: string
): Promise<void> {
  try {
    await ensureGrowthAutomationIndexes(db);
    await ensureGrowthStartupNextActionAutomation(
      createMongoGrowthAutomationStore(db),
      tenantId
    );
  } catch (error) {
    console.error(
      "[Growth WhatsApp] startup nextAction ensure failed (inbound continues)",
      tenantId,
      error instanceof Error ? error.message : error
    );
  }
}

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
    const ensuredTenants = new Set<string>();
    const [connections, personas, messaging, oportunidades] = await Promise.all(
      [
        openGrowthWhatsAppConnectionStore(),
        openGrowthPersonaStore(db),
        openGrowthMessagingStore(db),
        openGrowthOpportunityStore(db),
      ]
    );

    const result = await receiveWhatsAppCloudWebhook(
      {
        connections,
        personas,
        messaging,
        oportunidades,
        workflow: createMongoGrowthOpportunityWorkflow(),
        eventBus: createGrowthEventBusAdapter(),
        async onTenantResolved(tenantId) {
          if (ensuredTenants.has(tenantId)) return;
          ensuredTenants.add(tenantId);
          await ensureStartupNextActionAutomationSafe(db, tenantId);
        },
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
