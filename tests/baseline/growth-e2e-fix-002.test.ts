/**
 * OT-GROWTH-E2E-FIX-002 — WhatsApp → Persona → Conversación → Oportunidad → nextAction.
 * Reutiliza receive + openGrowthOpportunity + playbook H1; sin segundo pipeline.
 */
import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createMemoryGrowthEventBus,
  createMemoryGrowthMessagingStore,
  createMemoryGrowthOpportunityStore,
  createMemoryGrowthOpportunityWorkflow,
  createMemoryGrowthPersonaStore,
  createMemoryGrowthWhatsAppConnectionStore,
  GROWTH_MESSAGE_RECEIVED_EVENT,
  receiveWhatsAppCloudWebhook,
  signWhatsAppHubBody,
  transitionGrowthOpportunity,
  upsertGrowthPersona,
  upsertGrowthWhatsAppConnection,
  type GrowthEventBusPort,
  type GrowthOpportunityStore,
  type GrowthOpportunityWorkflowPort,
} from "../../src/core/growth";
import {
  createMemoryGrowthAutomationStore,
  ensureGrowthStartupNextActionAutomation,
  GROWTH_STARTUP_NEXT_ACTION_SUMMARY,
  handleGrowthAutomationEvent,
  resetAutomationReentrancyForTests,
  type GrowthAutomationSalesOpsPort,
  type GrowthAutomationStore,
} from "../../src/core/growth/automations";
import { setGrowthNextAction } from "../../src/core/growth/next-action";
import { clearGrowthNextAction } from "../../src/core/growth/next-action";
import { projectGrowthOsHome } from "../../src/components/admin/preview/growth-os-master/project-home";
import {
  pickPrimaryNextAction,
  toPersonaListItemView,
} from "../../src/lib/growth/persona-view";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

function cloudTextPayload(opts: {
  phoneNumberId: string;
  from: string;
  messageId: string;
  body: string;
  profileName?: string;
}): Record<string, unknown> {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "waba-test",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "15550001111",
                phone_number_id: opts.phoneNumberId,
              },
              contacts: [
                {
                  profile: { name: opts.profileName ?? "Ana" },
                  wa_id: opts.from,
                },
              ],
              messages: [
                {
                  from: opts.from,
                  id: opts.messageId,
                  timestamp: "1757260800",
                  type: "text",
                  text: { body: opts.body },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

async function seedConnection(
  tenantId: string,
  phoneNumberId: string,
  secrets: { verifyToken: string; appSecret: string }
) {
  const connections = createMemoryGrowthWhatsAppConnectionStore();
  const upserted = await upsertGrowthWhatsAppConnection(connections, {
    tenantId,
    phoneNumberId,
    verifyToken: secrets.verifyToken,
    appSecret: secrets.appSecret,
    now: "2026-09-14T10:00:00.000Z",
  });
  assert.equal(upserted.ok, true);
  if (!upserted.ok) throw new Error("connection seed failed");
  return connections;
}

function createMemorySalesOpsPort(input: {
  store: GrowthOpportunityStore;
  workflow: GrowthOpportunityWorkflowPort;
  eventBus: GrowthEventBusPort;
}): GrowthAutomationSalesOpsPort {
  const { store, workflow, eventBus } = input;
  return {
    async salesTransitionOpportunity(req) {
      const result = await transitionGrowthOpportunity(store, workflow, {
        tenantId: req.tenantId,
        oportunidadId: req.oportunidadId,
        toState: req.toState,
        transitionId: req.transitionId,
        comment: req.comment,
        actorUserId: req.actor.userId,
        eventBus,
      });
      if (!result.ok) {
        return {
          ok: false,
          reason: result.reason,
          error: "error" in result ? result.error : undefined,
        };
      }
      return {
        ok: true,
        oportunidad: result.oportunidad,
        fromState: result.fromState,
        toState: result.toState,
        activity: result.activity,
      };
    },
    async salesRecordFollowUp() {
      return { ok: false, reason: "not_implemented" };
    },
    async salesSetNextAction(req) {
      const result = await setGrowthNextAction(store, {
        tenantId: req.tenantId,
        oportunidadId: req.oportunidadId,
        summary: req.summary,
        dueAt: req.dueAt,
        kind: req.kind,
        actorUserId: req.actor.userId,
        eventBus,
      });
      if (!result.ok) return { ok: false, reason: result.reason };
      return {
        ok: true,
        oportunidad: result.oportunidad,
        activity: result.activity,
      };
    },
    async salesClearNextAction(req) {
      const result = await clearGrowthNextAction(store, {
        tenantId: req.tenantId,
        oportunidadId: req.oportunidadId,
        actorUserId: req.actor.userId,
        eventBus,
      });
      if (!result.ok) return { ok: false, reason: "not_found" };
      return {
        ok: true,
        oportunidad: result.oportunidad,
        activity: result.activity,
      };
    },
  };
}

function createLoopAwareBus(input: {
  getDeps: () => {
    automationStore: GrowthAutomationStore;
    opportunityStore: GrowthOpportunityStore;
    salesOps: GrowthAutomationSalesOpsPort;
  };
}) {
  const base = createMemoryGrowthEventBus();
  const bus: GrowthEventBusPort & { events: typeof base.events } = {
    events: base.events,
    async publish(pub) {
      if (base.failAlways || base.failNext) {
        return base.publish(pub);
      }
      const result = await base.publish(pub);
      await handleGrowthAutomationEvent(
        {
          id: result.id,
          type: pub.type,
          tenantId: pub.tenantId,
          payload: pub.payload,
          userId: pub.userId,
        },
        input.getDeps()
      );
      return result;
    },
  };
  return bus;
}

describe("OT-GROWTH-E2E-FIX-002 — WhatsApp → Oportunidad → Qué hacer ahora", () => {
  beforeEach(() => {
    resetAutomationReentrancyForTests();
  });

  it("superficie: receive cablea openGrowthOpportunity + webhook ensure H1", () => {
    const receive = readSrc("src/core/growth/whatsapp/receive.ts");
    assert.match(receive, /openGrowthOpportunity/);
    assert.match(receive, /GROWTH_WHATSAPP_OPPORTUNITY_TYPE_KEY/);
    assert.match(receive, /oportunidadId/);
    assert.equal(receive.includes("if (tenantId ==="), false);
    assert.equal(receive.toLowerCase().includes("sem"), false);

    const ensure = readSrc("src/core/growth/messaging/ensure-conversation.ts");
    assert.match(ensure, /oportunidadId && next\.oportunidadId !== oportunidadId/);

    const webhook = readSrc("src/app/api/webhooks/whatsapp/route.ts");
    assert.match(webhook, /openGrowthOpportunityStore/);
    assert.match(webhook, /createMongoGrowthOpportunityWorkflow/);
    assert.match(webhook, /ensureGrowthStartupNextActionAutomation/);
    assert.match(webhook, /onTenantResolved/);
    assert.equal(webhook.includes("NEXT_PUBLIC"), false);
  });

  it("A–G — WA nuevo → Persona → Conversación → Opp → vínculo → nextAction → Inicio/Ventas", async () => {
    const connections = await seedConnection("space-wa", "pn-wa", {
      verifyToken: "tok",
      appSecret: "secret-wa",
    });
    const personas = createMemoryGrowthPersonaStore();
    const messaging = createMemoryGrowthMessagingStore();
    const oportunidades = createMemoryGrowthOpportunityStore();
    const workflow = createMemoryGrowthOpportunityWorkflow();
    const automationStore = createMemoryGrowthAutomationStore();

    let salesOps = createMemorySalesOpsPort({
      store: oportunidades,
      workflow,
      eventBus: createMemoryGrowthEventBus(),
    });
    const bus = createLoopAwareBus({
      getDeps: () => ({
        automationStore,
        opportunityStore: oportunidades,
        salesOps,
      }),
    });
    salesOps = createMemorySalesOpsPort({
      store: oportunidades,
      workflow,
      eventBus: bus,
    });

    const seeded = await ensureGrowthStartupNextActionAutomation(
      automationStore,
      "space-wa"
    );
    assert.equal(seeded.ok, true);

    const payload = cloudTextPayload({
      phoneNumberId: "pn-wa",
      from: "56911112222",
      messageId: "wamid.e2e-1",
      body: "Hola, quiero información",
      profileName: "Camila Ríos",
    });
    const rawBody = JSON.stringify(payload);
    const result = await receiveWhatsAppCloudWebhook(
      {
        connections,
        personas,
        messaging,
        oportunidades,
        workflow,
        eventBus: bus,
      },
      {
        rawBody,
        signatureHeader: signWhatsAppHubBody(rawBody, "secret-wa"),
        now: "2026-09-14T15:00:00.000Z",
      }
    );

    assert.equal(result.ok, true);
    if (!result.ok) throw new Error("receive failed");
    assert.equal(result.processed.length, 1);
    const item = result.processed[0]!;

    // A — Persona
    assert.equal(item.personaCreated, true);
    assert.equal(personas.personas.size, 1);
    const persona = [...personas.personas.values()][0]!;
    assert.equal(persona.displayName, "Camila Ríos");
    assert.equal(persona.origin.channel, "whatsapp");

    // B — Conversación
    assert.equal(item.conversationCreated, true);
    assert.equal(messaging.conversations.size, 1);

    // C — Oportunidad
    assert.equal(item.opportunityCreated, true);
    assert.ok(item.oportunidadId);
    assert.equal(oportunidades.oportunidades.size, 1);
    const opp = await oportunidades.findById("space-wa", item.oportunidadId!);
    assert.ok(opp);
    assert.equal(opp!.typeKey, "inquiry");
    assert.equal(opp!.origin.kind, "unknown");
    assert.equal(opp!.origin.channel, "whatsapp");
    assert.equal(opp!.status, "open");

    // D — vínculo
    const conv = [...messaging.conversations.values()][0]!;
    assert.equal(conv.oportunidadId, opp!._id);
    assert.equal(
      item.inbound.ok && item.inbound.conversation.oportunidadId,
      opp!._id
    );

    // E — nextAction por playbook H1
    const refreshed = await oportunidades.findById("space-wa", opp!._id);
    assert.ok(refreshed?.nextAction);
    assert.equal(
      refreshed!.nextAction!.summary,
      GROWTH_STARTUP_NEXT_ACTION_SUMMARY
    );
    assert.equal(refreshed!.nextAction!.kind, "contact");
    assert.equal(
      bus.events.some((e) => e.type === "GrowthOpportunityOpened"),
      true
    );
    assert.equal(
      bus.events.some((e) => e.type === GROWTH_MESSAGE_RECEIVED_EVENT),
      true
    );

    // F — Ventas (misma SSOT growth_oportunidades)
    assert.equal(refreshed!.tenantId, "space-wa");
    assert.equal(refreshed!.personaId, persona._id);
    assert.ok(refreshed!.nextAction);

    // G — Inicio
    const listItem = toPersonaListItemView(persona, [refreshed!]);
    assert.equal(listItem.nextActionLabel, GROWTH_STARTUP_NEXT_ACTION_SUMMARY);
    const home = projectGrowthOsHome({
      personas: [listItem],
      activityCount: 1,
      activities: [],
    });
    assert.equal(home.metrics.porAtender, 1);
    assert.equal(
      home.attention[0]?.nextActionLabel,
      GROWTH_STARTUP_NEXT_ACTION_SUMMARY
    );
    assert.equal(
      pickPrimaryNextAction([refreshed!])?.summary,
      GROWTH_STARTUP_NEXT_ACTION_SUMMARY
    );
  });

  it("H — segundo mensaje no duplica oportunidad", async () => {
    const connections = await seedConnection("space-wa", "pn-wa", {
      verifyToken: "tok",
      appSecret: "secret-wa",
    });
    const personas = createMemoryGrowthPersonaStore();
    const messaging = createMemoryGrowthMessagingStore();
    const oportunidades = createMemoryGrowthOpportunityStore();
    const workflow = createMemoryGrowthOpportunityWorkflow();
    const bus = createMemoryGrowthEventBus();
    const deps = {
      connections,
      personas,
      messaging,
      oportunidades,
      workflow,
      eventBus: bus,
    };

    const firstRaw = JSON.stringify(
      cloudTextPayload({
        phoneNumberId: "pn-wa",
        from: "56922223333",
        messageId: "wamid.h-1",
        body: "Primero",
      })
    );
    const first = await receiveWhatsAppCloudWebhook(deps, {
      rawBody: firstRaw,
      signatureHeader: signWhatsAppHubBody(firstRaw, "secret-wa"),
      now: "2026-09-14T15:10:00.000Z",
    });
    assert.equal(first.ok, true);
    if (!first.ok) throw new Error("first");
    const oppId = first.processed[0]!.oportunidadId;
    assert.ok(oppId);
    assert.equal(oportunidades.oportunidades.size, 1);

    const secondRaw = JSON.stringify(
      cloudTextPayload({
        phoneNumberId: "pn-wa",
        from: "56922223333",
        messageId: "wamid.h-2",
        body: "Segundo",
      })
    );
    const second = await receiveWhatsAppCloudWebhook(deps, {
      rawBody: secondRaw,
      signatureHeader: signWhatsAppHubBody(secondRaw, "secret-wa"),
      now: "2026-09-14T15:11:00.000Z",
    });
    assert.equal(second.ok, true);
    if (!second.ok) throw new Error("second");
    assert.equal(second.processed[0]!.oportunidadId, oppId);
    assert.equal(second.processed[0]!.opportunityCreated, false);
    assert.equal(second.processed[0]!.opportunityReused, true);
    assert.equal(oportunidades.oportunidades.size, 1);
    assert.equal(messaging.conversations.size, 1);
    assert.equal(messaging.messages.size, 2);
    assert.equal(
      bus.events.filter((e) => e.type === "GrowthOpportunityOpened").length,
      1
    );
  });

  it("I — misma Persona (teléfono) dedupe correcto", async () => {
    const connections = await seedConnection("space-wa", "pn-wa", {
      verifyToken: "tok",
      appSecret: "secret-wa",
    });
    const personas = createMemoryGrowthPersonaStore();
    const messaging = createMemoryGrowthMessagingStore();
    const oportunidades = createMemoryGrowthOpportunityStore();
    const workflow = createMemoryGrowthOpportunityWorkflow();

    const seeded = await upsertGrowthPersona(personas, {
      tenantId: "space-wa",
      phone: "+56 9 3333 4444",
      displayName: "Persona previa",
      origin: {
        kind: "form",
        channel: "contact",
        sourceCollection: "experience_form_submissions",
        sourceId: "form-prev",
      },
      now: "2026-09-01T10:00:00.000Z",
    });
    assert.equal(seeded.ok, true);
    if (!seeded.ok) throw new Error("seed persona");

    const rawBody = JSON.stringify(
      cloudTextPayload({
        phoneNumberId: "pn-wa",
        from: "56933334444",
        messageId: "wamid.i-1",
        body: "Ya existo",
      })
    );
    const result = await receiveWhatsAppCloudWebhook(
      {
        connections,
        personas,
        messaging,
        oportunidades,
        workflow,
        eventBus: createMemoryGrowthEventBus(),
      },
      {
        rawBody,
        signatureHeader: signWhatsAppHubBody(rawBody, "secret-wa"),
      }
    );
    assert.equal(result.ok, true);
    if (!result.ok) throw new Error("receive");
    assert.equal(result.processed[0]!.personaCreated, false);
    assert.equal(result.processed[0]!.personaId, seeded.persona._id);
    assert.equal(personas.personas.size, 1);
    assert.equal(seeded.persona.origin.kind, "form");
  });

  it("J — otro tenant totalmente aislado", async () => {
    const connections = createMemoryGrowthWhatsAppConnectionStore();
    await upsertGrowthWhatsAppConnection(connections, {
      tenantId: "space-a",
      phoneNumberId: "pn-a",
      verifyToken: "tok-a",
      appSecret: "secret-a",
    });
    await upsertGrowthWhatsAppConnection(connections, {
      tenantId: "space-b",
      phoneNumberId: "pn-b",
      verifyToken: "tok-b",
      appSecret: "secret-b",
    });

    const personas = createMemoryGrowthPersonaStore();
    const messaging = createMemoryGrowthMessagingStore();
    const oportunidades = createMemoryGrowthOpportunityStore();
    const workflow = createMemoryGrowthOpportunityWorkflow();
    const deps = {
      connections,
      personas,
      messaging,
      oportunidades,
      workflow,
      eventBus: createMemoryGrowthEventBus(),
    };

    const rawA = JSON.stringify(
      cloudTextPayload({
        phoneNumberId: "pn-a",
        from: "56900001111",
        messageId: "wamid.j-a",
        body: "A",
      })
    );
    const rawB = JSON.stringify(
      cloudTextPayload({
        phoneNumberId: "pn-b",
        from: "56900001111",
        messageId: "wamid.j-b",
        body: "B",
      })
    );

    const recvA = await receiveWhatsAppCloudWebhook(deps, {
      rawBody: rawA,
      signatureHeader: signWhatsAppHubBody(rawA, "secret-a"),
    });
    const recvB = await receiveWhatsAppCloudWebhook(deps, {
      rawBody: rawB,
      signatureHeader: signWhatsAppHubBody(rawB, "secret-b"),
    });
    assert.equal(recvA.ok && recvB.ok, true);
    if (!recvA.ok || !recvB.ok) throw new Error("iso");

    assert.equal(recvA.processed[0]!.tenantId, "space-a");
    assert.equal(recvB.processed[0]!.tenantId, "space-b");
    assert.notEqual(
      recvA.processed[0]!.personaId,
      recvB.processed[0]!.personaId
    );
    assert.notEqual(
      recvA.processed[0]!.oportunidadId,
      recvB.processed[0]!.oportunidadId
    );

    const oppsA = [...oportunidades.oportunidades.values()].filter(
      (o) => o.tenantId === "space-a"
    );
    const oppsB = [...oportunidades.oportunidades.values()].filter(
      (o) => o.tenantId === "space-b"
    );
    assert.equal(oppsA.length, 1);
    assert.equal(oppsB.length, 1);
    assert.equal(oppsA[0]!.personaId, recvA.processed[0]!.personaId);
    assert.equal(oppsB[0]!.personaId, recvB.processed[0]!.personaId);
  });

  it("K — oportunidad final previa → nueva intención comercial coherente", async () => {
    const connections = await seedConnection("space-wa", "pn-wa", {
      verifyToken: "tok",
      appSecret: "secret-wa",
    });
    const personas = createMemoryGrowthPersonaStore();
    const messaging = createMemoryGrowthMessagingStore();
    const oportunidades = createMemoryGrowthOpportunityStore();
    const workflow = createMemoryGrowthOpportunityWorkflow();
    const bus = createMemoryGrowthEventBus();
    const deps = {
      connections,
      personas,
      messaging,
      oportunidades,
      workflow,
      eventBus: bus,
    };

    const firstRaw = JSON.stringify(
      cloudTextPayload({
        phoneNumberId: "pn-wa",
        from: "56955556666",
        messageId: "wamid.k-1",
        body: "Primera intención",
      })
    );
    const first = await receiveWhatsAppCloudWebhook(deps, {
      rawBody: firstRaw,
      signatureHeader: signWhatsAppHubBody(firstRaw, "secret-wa"),
      now: "2026-09-14T16:00:00.000Z",
    });
    assert.equal(first.ok, true);
    if (!first.ok) throw new Error("first");
    const firstOppId = first.processed[0]!.oportunidadId!;

    const activated = await transitionGrowthOpportunity(
      oportunidades,
      workflow,
      {
        tenantId: "space-wa",
        oportunidadId: firstOppId,
        transitionId: "activate",
        sourceCollection: "test",
        sourceId: "k-activate",
        now: "2026-09-14T16:05:00.000Z",
        eventBus: bus,
      }
    );
    assert.equal(activated.ok, true);
    const won = await transitionGrowthOpportunity(oportunidades, workflow, {
      tenantId: "space-wa",
      oportunidadId: firstOppId,
      transitionId: "win",
      sourceCollection: "test",
      sourceId: "k-win",
      now: "2026-09-14T16:10:00.000Z",
      eventBus: bus,
    });
    assert.equal(won.ok, true);
    if (!won.ok) throw new Error("win");
    assert.equal(won.oportunidad.status, "won");

    const secondRaw = JSON.stringify(
      cloudTextPayload({
        phoneNumberId: "pn-wa",
        from: "56955556666",
        messageId: "wamid.k-2",
        body: "Nueva consulta",
      })
    );
    const second = await receiveWhatsAppCloudWebhook(deps, {
      rawBody: secondRaw,
      signatureHeader: signWhatsAppHubBody(secondRaw, "secret-wa"),
      now: "2026-09-14T16:20:00.000Z",
    });
    assert.equal(second.ok, true);
    if (!second.ok) throw new Error("second");
    assert.equal(second.processed[0]!.opportunityCreated, true);
    assert.notEqual(second.processed[0]!.oportunidadId, firstOppId);
    assert.equal(oportunidades.oportunidades.size, 2);

    const conv = [...messaging.conversations.values()][0]!;
    assert.equal(conv.oportunidadId, second.processed[0]!.oportunidadId);
    assert.notEqual(conv.oportunidadId, firstOppId);

    const newOpp = await oportunidades.findById(
      "space-wa",
      second.processed[0]!.oportunidadId!
    );
    assert.equal(newOpp?.status, "open");
    assert.equal(newOpp?.origin.channel, "whatsapp");
  });

  it("Mensajes entregan contexto hacia Oportunidad (payload con oportunidadId)", async () => {
    const connections = await seedConnection("space-wa", "pn-wa", {
      verifyToken: "tok",
      appSecret: "secret-wa",
    });
    const personas = createMemoryGrowthPersonaStore();
    const messaging = createMemoryGrowthMessagingStore();
    const oportunidades = createMemoryGrowthOpportunityStore();
    const workflow = createMemoryGrowthOpportunityWorkflow();
    const bus = createMemoryGrowthEventBus();

    const rawBody = JSON.stringify(
      cloudTextPayload({
        phoneNumberId: "pn-wa",
        from: "56977778888",
        messageId: "wamid.ctx-1",
        body: "contexto",
      })
    );
    const result = await receiveWhatsAppCloudWebhook(
      {
        connections,
        personas,
        messaging,
        oportunidades,
        workflow,
        eventBus: bus,
      },
      {
        rawBody,
        signatureHeader: signWhatsAppHubBody(rawBody, "secret-wa"),
      }
    );
    assert.equal(result.ok, true);
    if (!result.ok) throw new Error("receive");
    const msgEvt = bus.events.find((e) => e.type === GROWTH_MESSAGE_RECEIVED_EVENT);
    assert.ok(msgEvt);
    assert.equal(msgEvt!.payload?.oportunidadId, result.processed[0]!.oportunidadId);
  });
});
