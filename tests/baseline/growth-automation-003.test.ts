/**
 * OT-GROWTH-AUTOMATION-003 — runtime mínimo Event Bus → Automatización → sales-ops.
 */
import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createMemoryGrowthEventBus,
  createMemoryGrowthOpportunityStore,
  createMemoryGrowthOpportunityWorkflow,
  createMemoryGrowthPersonaStore,
  openGrowthOpportunity,
  recordGrowthActivity,
  setGrowthNextAction,
  clearGrowthNextAction,
  transitionGrowthOpportunity,
  upsertGrowthPersona,
  type GrowthEventBusPort,
  type GrowthOpportunityStore,
  type GrowthOpportunityWorkflowPort,
} from "../../src/core/growth";
import {
  createGrowthAutomation,
  createMemoryGrowthAutomationStore,
  publishGrowthAutomation,
  setGrowthAutomationActive,
  updateGrowthAutomationDraft,
  handleGrowthAutomationEvent,
  resetAutomationReentrancyForTests,
  GROWTH_AUTOMATION_SYSTEM_ACTOR,
  type GrowthAutomationSalesOpsPort,
  type GrowthAutomationStore,
} from "../../src/core/growth/automations";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
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
    async salesRecordFollowUp(req) {
      const summary = req.summary?.trim();
      if (!summary) return { ok: false, reason: "missing_summary" };
      const oportunidad = await store.findById(
        req.tenantId,
        req.oportunidadId
      );
      if (!oportunidad) return { ok: false, reason: "not_found" };
      const recorded = await recordGrowthActivity(
        store,
        {
          tenantId: oportunidad.tenantId,
          personaId: oportunidad.personaId,
          oportunidadId: oportunidad._id,
          kind: req.kind,
          summary,
          actorUserId: req.actor.userId,
          payload: { source: "sales_ops" },
        },
        { eventBus }
      );
      if (!recorded.ok) return { ok: false, reason: "not_found" };
      return {
        ok: true,
        activity: recorded.activity,
        published: recorded.published,
        oportunidad,
      };
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

/** Bus en memoria que reentra al runtime (simula Event Bus real). */
function createLoopAwareBus(input: {
  getDeps: () => {
    automationStore: GrowthAutomationStore;
    opportunityStore: GrowthOpportunityStore;
    salesOps: GrowthAutomationSalesOpsPort;
  };
}) {
  const base = createMemoryGrowthEventBus();
  const bus: GrowthEventBusPort & {
    events: typeof base.events;
  } = {
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

async function seedOpportunity(tenantId: string, email: string) {
  const personas = createMemoryGrowthPersonaStore();
  const store = createMemoryGrowthOpportunityStore();
  const wf = createMemoryGrowthOpportunityWorkflow();
  const person = await upsertGrowthPersona(personas, {
    tenantId,
    email,
    displayName: email.split("@")[0],
    origin: {
      kind: "form",
      sourceCollection: "test",
      sourceId: `src-${email}`,
      channel: "web",
      formDestination: "contact",
    },
    now: "2026-09-06T12:00:00.000Z",
  });
  assert.equal(person.ok, true);
  if (!person.ok) throw new Error("persona");

  const opened = await openGrowthOpportunity(store, wf, {
    tenantId,
    personaId: person.persona._id,
    typeKey: "inquiry",
    origin: {
      kind: "form",
      sourceCollection: "test",
      sourceId: `src-${email}`,
      channel: "web",
      formDestination: "contact",
    },
    sourceCollection: "test",
    sourceId: `src-${email}`,
    now: "2026-09-06T12:01:00.000Z",
  });
  assert.equal(opened.ok, true);
  if (!opened.ok) throw new Error("open");

  return { store, wf, persona: person.persona, oportunidad: opened.oportunidad };
}

async function publishActiveAutomation(
  automationStore: GrowthAutomationStore,
  input: {
    tenantId: string;
    name: string;
    steps: unknown;
  }
) {
  const created = await createGrowthAutomation(automationStore, {
    tenantId: input.tenantId,
    name: input.name,
    steps: input.steps,
    actor: { userId: "admin-1" },
  });
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error("create");
  const published = await publishGrowthAutomation(automationStore, {
    tenantId: input.tenantId,
    automationId: created.automation._id,
    actor: { userId: "admin-1" },
  });
  assert.equal(published.ok, true);
  if (!published.ok) throw new Error("publish");
  return published;
}

beforeEach(() => {
  resetAutomationReentrancyForTests();
});

describe("OT-GROWTH-AUTOMATION-003 — superficie", () => {
  it("runtime + subscriber Event Bus existen", () => {
    for (const rel of [
      "src/core/growth/automations/runtime.ts",
      "src/core/growth/automations/conditions.ts",
      "src/core/growth/automations/reentrancy.ts",
      "src/core/growth/automations/execute-action.ts",
      "src/lib/growth/automations-runtime.ts",
    ]) {
      assert.ok(existsSync(resolve(process.cwd(), rel)), rel);
    }
    const builtin = readSrc("src/core/events/handlers/builtin.ts");
    assert.match(builtin, /registerGrowthAutomationHandlers/);
    assert.match(builtin, /growth\.automations/);
    assert.match(builtin, /subscribeMany/);
    assert.match(builtin, /GROWTH_DOMAIN_EVENT_TYPES/);
  });
});

describe("OT-GROWTH-AUTOMATION-003 — runtime", () => {
  it("trigger correcto ejecuta acción; actor = growth-automation", async () => {
    const tenantId = "tenant-a";
    const { store, wf, oportunidad } = await seedOpportunity(
      tenantId,
      "a@example.com"
    );
    const bus = createMemoryGrowthEventBus();
    const salesOps = createMemorySalesOpsPort({ store, workflow: wf, eventBus: bus });
    const automationStore = createMemoryGrowthAutomationStore();

    const published = await publishActiveAutomation(automationStore, {
      tenantId,
      name: "Al abrir → próxima acción",
      steps: [
        {
          kind: "trigger",
          eventTypes: ["GrowthOpportunityOpened"],
        },
        {
          kind: "action",
          action: "salesSetNextAction",
          summary: "Contactar lead",
        },
      ],
    });

    const result = await handleGrowthAutomationEvent(
      {
        id: "evt-open-1",
        type: "GrowthOpportunityOpened",
        tenantId,
        payload: { oportunidadId: oportunidad._id },
        userId: "visitor-form-user",
      },
      { automationStore, opportunityStore: store, salesOps }
    );

    const executed = result.outcomes.filter((o) => o.status === "executed");
    assert.equal(executed.length, 1);
    assert.equal(executed[0]?.automationId, published.automation._id);

    const updated = await store.findById(tenantId, oportunidad._id);
    assert.ok(updated?.nextAction);
    assert.equal(updated?.nextAction?.summary, "Contactar lead");

    const nextEvt = bus.events.find((e) => e.type === "GrowthNextActionSet");
    assert.ok(nextEvt);
    assert.equal(nextEvt?.userId, GROWTH_AUTOMATION_SYSTEM_ACTOR);
    assert.notEqual(nextEvt?.userId, "visitor-form-user");
  });

  it("trigger distinto no ejecuta", async () => {
    const tenantId = "tenant-a";
    const { store, wf, oportunidad } = await seedOpportunity(
      tenantId,
      "b@example.com"
    );
    const bus = createMemoryGrowthEventBus();
    const salesOps = createMemorySalesOpsPort({ store, workflow: wf, eventBus: bus });
    const automationStore = createMemoryGrowthAutomationStore();

    await publishActiveAutomation(automationStore, {
      tenantId,
      name: "Solo opened",
      steps: [
        { kind: "trigger", eventTypes: ["GrowthOpportunityOpened"] },
        {
          kind: "action",
          action: "salesSetNextAction",
          summary: "No debería",
        },
      ],
    });

    const result = await handleGrowthAutomationEvent(
      {
        id: "evt-act-1",
        type: "GrowthActivityRecorded",
        tenantId,
        payload: { oportunidadId: oportunidad._id },
      },
      { automationStore, opportunityStore: store, salesOps }
    );

    assert.equal(
      result.outcomes.filter((o) => o.status === "executed").length,
      0
    );
    assert.ok(
      result.outcomes.some((o) => o.status === "skipped_trigger")
    );
    const updated = await store.findById(tenantId, oportunidad._id);
    assert.equal(updated?.nextAction, null);
  });

  it("condición verdadera ejecuta; falsa no ejecuta", async () => {
    const tenantId = "tenant-a";
    const { store, wf, oportunidad } = await seedOpportunity(
      tenantId,
      "c@example.com"
    );
    const bus = createMemoryGrowthEventBus();
    const salesOps = createMemorySalesOpsPort({ store, workflow: wf, eventBus: bus });
    const automationStore = createMemoryGrowthAutomationStore();

    await publishActiveAutomation(automationStore, {
      tenantId,
      name: "Solo status open",
      steps: [
        { kind: "trigger", eventTypes: ["GrowthOpportunityOpened"] },
        {
          kind: "condition",
          rules: [{ field: "status", op: "eq", value: "open" }],
        },
        {
          kind: "action",
          action: "salesRecordFollowUp",
          followUpKind: "note",
          summary: "Auto note",
        },
      ],
    });

    const okResult = await handleGrowthAutomationEvent(
      {
        id: "evt-cond-ok",
        type: "GrowthOpportunityOpened",
        tenantId,
        payload: { oportunidadId: oportunidad._id },
      },
      { automationStore, opportunityStore: store, salesOps }
    );
    assert.equal(
      okResult.outcomes.filter((o) => o.status === "executed").length,
      1
    );
    assert.equal(GROWTH_AUTOMATION_SYSTEM_ACTOR, "growth-automation");
    const noteEvt = bus.events.find((e) => e.type === "GrowthActivityRecorded");
    assert.ok(noteEvt);
    assert.equal(noteEvt?.userId, GROWTH_AUTOMATION_SYSTEM_ACTOR);

    // Transicionar a active → condición status=open falla
    resetAutomationReentrancyForTests();
    const tr = await transitionGrowthOpportunity(store, wf, {
      tenantId,
      oportunidadId: oportunidad._id,
      toState: "active",
      actorUserId: "ops-1",
    });
    assert.equal(tr.ok, true);

    const failResult = await handleGrowthAutomationEvent(
      {
        id: "evt-cond-fail",
        type: "GrowthOpportunityOpened",
        tenantId,
        payload: { oportunidadId: oportunidad._id },
      },
      { automationStore, opportunityStore: store, salesOps }
    );
    assert.ok(
      failResult.outcomes.some((o) => o.status === "skipped_condition")
    );
    assert.equal(
      failResult.outcomes.filter((o) => o.status === "executed").length,
      0
    );
  });

  it("draft / disabled no ejecuta", async () => {
    const tenantId = "tenant-a";
    const { store, wf, oportunidad } = await seedOpportunity(
      tenantId,
      "d@example.com"
    );
    const bus = createMemoryGrowthEventBus();
    const salesOps = createMemorySalesOpsPort({ store, workflow: wf, eventBus: bus });
    const automationStore = createMemoryGrowthAutomationStore();

    const draftOnly = await createGrowthAutomation(automationStore, {
      tenantId,
      name: "Solo draft",
      steps: [
        { kind: "trigger", eventTypes: ["GrowthOpportunityOpened"] },
        {
          kind: "action",
          action: "salesSetNextAction",
          summary: "Draft action",
        },
      ],
      actor: { userId: "admin-1" },
    });
    assert.equal(draftOnly.ok, true);

    const draftResult = await handleGrowthAutomationEvent(
      {
        id: "evt-draft",
        type: "GrowthOpportunityOpened",
        tenantId,
        payload: { oportunidadId: oportunidad._id },
      },
      { automationStore, opportunityStore: store, salesOps }
    );
    assert.equal(draftResult.outcomes.length, 0);

    const published = await publishActiveAutomation(automationStore, {
      tenantId,
      name: "Luego disabled",
      steps: [
        { kind: "trigger", eventTypes: ["GrowthOpportunityOpened"] },
        {
          kind: "action",
          action: "salesSetNextAction",
          summary: "Disabled action",
        },
      ],
    });
    await setGrowthAutomationActive(automationStore, {
      tenantId,
      automationId: published.automation._id,
      active: false,
      actor: { userId: "admin-1" },
    });

    const disabledResult = await handleGrowthAutomationEvent(
      {
        id: "evt-disabled",
        type: "GrowthOpportunityOpened",
        tenantId,
        payload: { oportunidadId: oportunidad._id },
      },
      { automationStore, opportunityStore: store, salesOps }
    );
    assert.equal(disabledResult.outcomes.length, 0);
    const updated = await store.findById(tenantId, oportunidad._id);
    assert.equal(updated?.nextAction, null);
  });

  it("tenant A nunca ejecuta Automatización de B", async () => {
    const { store: storeA, wf: wfA, oportunidad: oppA } = await seedOpportunity(
      "tenant-a",
      "iso-a@example.com"
    );
    const { store: storeB, wf: wfB } = await seedOpportunity(
      "tenant-b",
      "iso-b@example.com"
    );
    const bus = createMemoryGrowthEventBus();
    const salesOpsA = createMemorySalesOpsPort({
      store: storeA,
      workflow: wfA,
      eventBus: bus,
    });
    const automationStore = createMemoryGrowthAutomationStore();

    await publishActiveAutomation(automationStore, {
      tenantId: "tenant-b",
      name: "Solo B",
      steps: [
        { kind: "trigger", eventTypes: ["GrowthOpportunityOpened"] },
        {
          kind: "action",
          action: "salesSetNextAction",
          summary: "De B",
        },
      ],
    });

    // listAutomations de A no ve las de B
    const result = await handleGrowthAutomationEvent(
      {
        id: "evt-iso",
        type: "GrowthOpportunityOpened",
        tenantId: "tenant-a",
        payload: { oportunidadId: oppA._id },
      },
      { automationStore, opportunityStore: storeA, salesOps: salesOpsA }
    );
    assert.equal(result.outcomes.length, 0);
    const updated = await storeA.findById("tenant-a", oppA._id);
    assert.equal(updated?.nextAction, null);
    void storeB;
    void wfB;
  });

  it("usa versión publicada (no el borrador posterior)", async () => {
    const tenantId = "tenant-a";
    const { store, wf, oportunidad } = await seedOpportunity(
      tenantId,
      "pub@example.com"
    );
    const bus = createMemoryGrowthEventBus();
    const salesOps = createMemorySalesOpsPort({ store, workflow: wf, eventBus: bus });
    const automationStore = createMemoryGrowthAutomationStore();

    const published = await publishActiveAutomation(automationStore, {
      tenantId,
      name: "Versionada",
      steps: [
        { kind: "trigger", eventTypes: ["GrowthOpportunityOpened"] },
        {
          kind: "action",
          action: "salesSetNextAction",
          summary: "Versión publicada",
        },
      ],
    });

    const draft = await updateGrowthAutomationDraft(automationStore, {
      tenantId,
      automationId: published.automation._id,
      steps: [
        { kind: "trigger", eventTypes: ["GrowthOpportunityOpened"] },
        {
          kind: "action",
          action: "salesSetNextAction",
          summary: "Borrador nuevo",
        },
      ],
      actor: { userId: "admin-1" },
    });
    assert.equal(draft.ok, true);

    await handleGrowthAutomationEvent(
      {
        id: "evt-pub-ver",
        type: "GrowthOpportunityOpened",
        tenantId,
        payload: { oportunidadId: oportunidad._id },
      },
      { automationStore, opportunityStore: store, salesOps }
    );

    const updated = await store.findById(tenantId, oportunidad._id);
    assert.equal(updated?.nextAction?.summary, "Versión publicada");
    assert.notEqual(updated?.nextAction?.summary, "Borrador nuevo");
  });

  it("protección contra reentrada/bucle (misma Automatización en cadena)", async () => {
    const tenantId = "tenant-a";
    const { store, wf, oportunidad } = await seedOpportunity(
      tenantId,
      "loop@example.com"
    );
    const automationStore = createMemoryGrowthAutomationStore();
    let salesOps!: GrowthAutomationSalesOpsPort;
    const bus = createLoopAwareBus({
      getDeps: () => ({
        automationStore,
        opportunityStore: store,
        salesOps,
      }),
    });
    salesOps = createMemorySalesOpsPort({ store, workflow: wf, eventBus: bus });

    // Dispara en Opened y en NextActionSet → sin protección se reentra infinito.
    await publishActiveAutomation(automationStore, {
      tenantId,
      name: "Loop risk",
      steps: [
        {
          kind: "trigger",
          eventTypes: ["GrowthOpportunityOpened", "GrowthNextActionSet"],
        },
        {
          kind: "action",
          action: "salesSetNextAction",
          summary: "Reentrada",
        },
      ],
    });

    const result = await handleGrowthAutomationEvent(
      {
        id: "evt-loop-root",
        type: "GrowthOpportunityOpened",
        tenantId,
        payload: { oportunidadId: oportunidad._id },
        userId: "visitor",
      },
      { automationStore, opportunityStore: store, salesOps }
    );

    const executed = result.outcomes.filter((o) => o.status === "executed");
    assert.equal(executed.length, 1);

    // El publish anidado GrowthNextActionSet reentró y fue bloqueado (claim/stack).
    const nestedNext = bus.events.filter((e) => e.type === "GrowthNextActionSet");
    assert.ok(nestedNext.length >= 1);
    // Una sola fijación de nextAction (no tormenta de writes).
    const updated = await store.findById(tenantId, oportunidad._id);
    assert.equal(updated?.nextAction?.summary, "Reentrada");

    // Segundo handle del mismo eventId → duplicate claim
    const again = await handleGrowthAutomationEvent(
      {
        id: "evt-loop-root",
        type: "GrowthOpportunityOpened",
        tenantId,
        payload: { oportunidadId: oportunidad._id },
      },
      { automationStore, opportunityStore: store, salesOps }
    );
    assert.ok(again.outcomes.some((o) => o.status === "skipped_duplicate"));
  });

  it("acción inválida no se ejecuta", async () => {
    const tenantId = "tenant-a";
    const { store, wf, oportunidad } = await seedOpportunity(
      tenantId,
      "bad@example.com"
    );
    const bus = createMemoryGrowthEventBus();
    const salesOps = createMemorySalesOpsPort({ store, workflow: wf, eventBus: bus });
    const automationStore = createMemoryGrowthAutomationStore();

    const published = await publishActiveAutomation(automationStore, {
      tenantId,
      name: "Valid first",
      steps: [
        { kind: "trigger", eventTypes: ["GrowthOpportunityOpened"] },
        {
          kind: "action",
          action: "salesSetNextAction",
          summary: "ok",
        },
      ],
    });

    // Corromper versión publicada en memoria (bypass service).
    const version = await automationStore.findVersion(
      tenantId,
      published.automation._id,
      published.automation.publishedVersion!
    );
    assert.ok(version);
    await automationStore.replaceVersion({
      ...version!,
      steps: [
        { kind: "trigger", eventTypes: ["GrowthOpportunityOpened"] },
        {
          kind: "action",
          action: "sendEmail" as unknown as "salesSetNextAction",
          summary: "hack",
        } as never,
      ],
    });

    const result = await handleGrowthAutomationEvent(
      {
        id: "evt-invalid",
        type: "GrowthOpportunityOpened",
        tenantId,
        payload: { oportunidadId: oportunidad._id },
      },
      { automationStore, opportunityStore: store, salesOps }
    );
    assert.ok(
      result.outcomes.some((o) => o.status === "skipped_invalid_action")
    );
    assert.equal(
      result.outcomes.filter((o) => o.status === "executed").length,
      0
    );
    const updated = await store.findById(tenantId, oportunidad._id);
    assert.equal(updated?.nextAction, null);
  });

  it("acción automática produce eventos/actividad normales de sales-ops", async () => {
    const tenantId = "tenant-a";
    const { store, wf, oportunidad } = await seedOpportunity(
      tenantId,
      "sales@example.com"
    );
    const bus = createMemoryGrowthEventBus();
    const salesOps = createMemorySalesOpsPort({ store, workflow: wf, eventBus: bus });
    const automationStore = createMemoryGrowthAutomationStore();

    await publishActiveAutomation(automationStore, {
      tenantId,
      name: "Follow-up auto",
      steps: [
        { kind: "trigger", eventTypes: ["GrowthOpportunityOpened"] },
        {
          kind: "action",
          action: "salesRecordFollowUp",
          followUpKind: "contact",
          summary: "Llamada automática",
        },
      ],
    });

    const result = await handleGrowthAutomationEvent(
      {
        id: "evt-sales-ops",
        type: "GrowthOpportunityOpened",
        tenantId,
        payload: { oportunidadId: oportunidad._id },
        userId: "form-visitor",
      },
      { automationStore, opportunityStore: store, salesOps }
    );

    const executed = result.outcomes.find((o) => o.status === "executed");
    assert.ok(executed && executed.status === "executed");
    if (!executed || executed.status !== "executed") throw new Error("exec");

    assert.ok(executed.actions[0]?.activityId);
    const evt = bus.events.find((e) => e.type === "GrowthActivityRecorded");
    assert.ok(evt);
    assert.equal(evt?.userId, GROWTH_AUTOMATION_SYSTEM_ACTOR);
    assert.equal(evt?.payload?.oportunidadId, oportunidad._id);
    assert.equal(evt?.payload?.kind, "contact");
  });

  it("fallo de una Automatización no rompe el flujo ni cruza Espacios", async () => {
    const tenantId = "tenant-a";
    const { store, wf, oportunidad } = await seedOpportunity(
      tenantId,
      "fail@example.com"
    );
    const bus = createMemoryGrowthEventBus();
    const baseOps = createMemorySalesOpsPort({ store, workflow: wf, eventBus: bus });
    const salesOps: GrowthAutomationSalesOpsPort = {
      ...baseOps,
      async salesSetNextAction(req) {
        if (req.summary === "boom") {
          throw new Error("simulated sales-ops failure");
        }
        return baseOps.salesSetNextAction(req);
      },
    };
    const automationStore = createMemoryGrowthAutomationStore();

    await publishActiveAutomation(automationStore, {
      tenantId,
      name: "Falla",
      steps: [
        { kind: "trigger", eventTypes: ["GrowthOpportunityOpened"] },
        {
          kind: "action",
          action: "salesSetNextAction",
          summary: "boom",
        },
      ],
    });
    await publishActiveAutomation(automationStore, {
      tenantId,
      name: "OK después",
      steps: [
        { kind: "trigger", eventTypes: ["GrowthOpportunityOpened"] },
        {
          kind: "action",
          action: "salesRecordFollowUp",
          followUpKind: "note",
          summary: "sobrevive",
        },
      ],
    });

    const result = await handleGrowthAutomationEvent(
      {
        id: "evt-fail-soft",
        type: "GrowthOpportunityOpened",
        tenantId,
        payload: { oportunidadId: oportunidad._id },
      },
      { automationStore, opportunityStore: store, salesOps }
    );

    assert.ok(result.outcomes.some((o) => o.status === "error"));
    assert.ok(result.outcomes.some((o) => o.status === "executed"));
    const note = bus.events.find(
      (e) =>
        e.type === "GrowthActivityRecorded" &&
        e.userId === GROWTH_AUTOMATION_SYSTEM_ACTOR
    );
    assert.ok(note);
  });
});
