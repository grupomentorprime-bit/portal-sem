/**
 * OT-GROWTH-E2E-FIX-001 — seed playbook de arranque + ciclo de vida nextAction.
 * Reutiliza Automation Runtime + sales-ops; sin segundo motor.
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
  setGrowthNextAction,
  transitionGrowthOpportunity,
  upsertGrowthPersona,
  type GrowthEventBusPort,
  type GrowthOportunidad,
  type GrowthOpportunityStore,
  type GrowthOpportunityWorkflowPort,
} from "../../src/core/growth";
import {
  createGrowthAutomation,
  createMemoryGrowthAutomationStore,
  ensureGrowthStartupNextActionAutomation,
  GROWTH_PLATFORM_SEED_ACTOR,
  GROWTH_STARTUP_NEXT_ACTION_AUTOMATION_NAME,
  GROWTH_STARTUP_NEXT_ACTION_SEED_KEY,
  GROWTH_STARTUP_NEXT_ACTION_STEPS,
  GROWTH_STARTUP_NEXT_ACTION_SUMMARY,
  handleGrowthAutomationEvent,
  publishGrowthAutomation,
  resetAutomationReentrancyForTests,
  setGrowthAutomationActive,
  updateGrowthAutomationDraft,
  type GrowthAutomationSalesOpsPort,
  type GrowthAutomationStore,
} from "../../src/core/growth/automations";
import { clearGrowthNextAction } from "../../src/core/growth/next-action";
import { projectGrowthOsHome } from "../../src/components/admin/preview/growth-os-master/project-home";
import {
  pickPrimaryNextAction,
  toPersonaListItemView,
} from "../../src/lib/growth/persona-view";

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

async function openOppWithBus(input: {
  tenantId: string;
  email: string;
  bus: GrowthEventBusPort;
  store: GrowthOpportunityStore;
  wf: GrowthOpportunityWorkflowPort;
  now?: string;
}) {
  const personas = createMemoryGrowthPersonaStore();
  const person = await upsertGrowthPersona(personas, {
    tenantId: input.tenantId,
    email: input.email,
    displayName: input.email.split("@")[0]!,
    origin: {
      kind: "form",
      sourceCollection: "experience_form_submissions",
      sourceId: `src-${input.email}`,
      channel: "web",
      formDestination: "contact",
    },
    now: input.now ?? "2026-09-14T12:00:00.000Z",
  });
  assert.equal(person.ok, true);
  if (!person.ok) throw new Error("persona");

  const opened = await openGrowthOpportunity(input.store, input.wf, {
    tenantId: input.tenantId,
    personaId: person.persona._id,
    typeKey: "inquiry",
    origin: {
      kind: "form",
      sourceCollection: "experience_form_submissions",
      sourceId: `src-${input.email}`,
      channel: "web",
      formDestination: "contact",
    },
    sourceCollection: "experience_form_submissions",
    sourceId: `src-${input.email}`,
    now: input.now ?? "2026-09-14T12:01:00.000Z",
    eventBus: input.bus,
  });
  assert.equal(opened.ok, true);
  if (!opened.ok) throw new Error("open");
  return { persona: person.persona, oportunidad: opened.oportunidad };
}

describe("OT-GROWTH-E2E-FIX-001 — seed + ciclo de vida nextAction", () => {
  beforeEach(() => {
    resetAutomationReentrancyForTests();
  });

  it("superficie: ensure + migración + engaches existen", () => {
    for (const rel of [
      "src/core/growth/automations/startup-seed.ts",
      "src/core/migrations/024-growth-startup-next-action.ts",
    ]) {
      assert.ok(existsSync(resolve(process.cwd(), rel)), rel);
    }
    assert.match(
      readSrc("src/core/migrations/registry.ts"),
      /migration024GrowthStartupNextAction/
    );
    assert.match(
      readSrc("src/core/tenant/create-platform-space.ts"),
      /ensureGrowthStartupNextActionAutomation/
    );
    assert.match(
      readSrc("src/lib/growth/live-ingest.ts"),
      /ensureGrowthStartupNextActionAutomation/
    );
    assert.match(
      readSrc("src/lib/growth/automations.ts"),
      /ensureGrowthStartupNextActionAutomation/
    );
    assert.match(
      readSrc("src/core/growth/transition-opportunity.ts"),
      /clearGrowthNextAction/
    );
    assert.match(
      readSrc("src/lib/growth/persona-view.ts"),
      /isGrowthOpportunityFinalStatus/
    );
  });

  it("A/B — ensure crea una vez; segunda llamada no duplica", async () => {
    const store = createMemoryGrowthAutomationStore();
    const first = await ensureGrowthStartupNextActionAutomation(store, "t-a");
    assert.equal(first.ok, true);
    if (!first.ok) return;
    assert.equal(first.created, true);
    assert.equal(first.automation.seedKey, GROWTH_STARTUP_NEXT_ACTION_SEED_KEY);
    assert.equal(first.automation.status, "active");
    assert.equal(first.automation.publishedVersion, 1);
    assert.equal(first.automation.createdByUserId, GROWTH_PLATFORM_SEED_ACTOR);
    assert.equal(
      first.automation.name,
      GROWTH_STARTUP_NEXT_ACTION_AUTOMATION_NAME
    );

    const second = await ensureGrowthStartupNextActionAutomation(store, "t-a");
    assert.equal(second.ok, true);
    if (!second.ok) return;
    assert.equal(second.created, false);
    assert.equal(second.automation._id, first.automation._id);

    const listed = await store.listAutomations("t-a");
    assert.equal(listed.length, 1);
    assert.equal(
      listed.filter((a) => a.seedKey === GROWTH_STARTUP_NEXT_ACTION_SEED_KEY)
        .length,
      1
    );
  });

  it("definición del seed: trigger / condición absent / salesSetNextAction contact", async () => {
    const store = createMemoryGrowthAutomationStore();
    const ensured = await ensureGrowthStartupNextActionAutomation(
      store,
      "t-def"
    );
    assert.equal(ensured.ok, true);
    if (!ensured.ok) return;
    const version = await store.findVersion(
      "t-def",
      ensured.automation._id,
      1
    );
    assert.ok(version);
    const steps = version!.steps;
    assert.equal(steps[0]?.kind, "trigger");
    if (steps[0]?.kind === "trigger") {
      assert.deepEqual(steps[0].eventTypes, ["GrowthOpportunityOpened"]);
    }
    assert.equal(steps[1]?.kind, "condition");
    if (steps[1]?.kind === "condition") {
      assert.deepEqual(steps[1].rules, [{ field: "nextAction", op: "absent" }]);
    }
    assert.equal(steps[2]?.kind, "action");
    if (steps[2]?.kind === "action") {
      assert.equal(steps[2].action, "salesSetNextAction");
      assert.equal(steps[2].summary, GROWTH_STARTUP_NEXT_ACTION_SUMMARY);
      assert.equal(steps[2].nextActionKind, "contact");
    }
    assert.equal(GROWTH_STARTUP_NEXT_ACTION_SUMMARY, "Contactar a la persona");
  });

  it("C/E/F/G — Opp abierta → nextAction; Inicio/Personas/Ventas misma SSOT", async () => {
    const automationStore = createMemoryGrowthAutomationStore();
    const store = createMemoryGrowthOpportunityStore();
    const wf = createMemoryGrowthOpportunityWorkflow();
    let salesOps: GrowthAutomationSalesOpsPort = createMemorySalesOpsPort({
      store,
      workflow: wf,
      eventBus: createMemoryGrowthEventBus(),
    });
    const bus = createLoopAwareBus({
      getDeps: () => ({
        automationStore,
        opportunityStore: store,
        salesOps,
      }),
    });
    salesOps = createMemorySalesOpsPort({
      store,
      workflow: wf,
      eventBus: bus,
    });

    const seeded = await ensureGrowthStartupNextActionAutomation(
      automationStore,
      "t-flow"
    );
    assert.equal(seeded.ok, true);

    const { persona, oportunidad } = await openOppWithBus({
      tenantId: "t-flow",
      email: "maria@example.com",
      bus,
      store,
      wf,
    });

    const updated = await store.findById("t-flow", oportunidad._id);
    assert.ok(updated?.nextAction);
    assert.equal(
      updated!.nextAction!.summary,
      GROWTH_STARTUP_NEXT_ACTION_SUMMARY
    );
    assert.equal(updated!.nextAction!.kind, "contact");

    const primary = pickPrimaryNextAction([updated!]);
    assert.ok(primary);
    assert.equal(primary!.summary, GROWTH_STARTUP_NEXT_ACTION_SUMMARY);

    const listItem = toPersonaListItemView(persona, [updated!]);
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
  });

  it("H — automation desactivada → no crea nextAction", async () => {
    const automationStore = createMemoryGrowthAutomationStore();
    const store = createMemoryGrowthOpportunityStore();
    const wf = createMemoryGrowthOpportunityWorkflow();
    let salesOps = createMemorySalesOpsPort({
      store,
      workflow: wf,
      eventBus: createMemoryGrowthEventBus(),
    });
    const bus = createLoopAwareBus({
      getDeps: () => ({ automationStore, opportunityStore: store, salesOps }),
    });
    salesOps = createMemorySalesOpsPort({ store, workflow: wf, eventBus: bus });

    const seeded = await ensureGrowthStartupNextActionAutomation(
      automationStore,
      "t-off"
    );
    assert.equal(seeded.ok, true);
    if (!seeded.ok) return;

    await setGrowthAutomationActive(automationStore, {
      tenantId: "t-off",
      automationId: seeded.automation._id,
      active: false,
      actor: { userId: "ops" },
    });

    const { oportunidad } = await openOppWithBus({
      tenantId: "t-off",
      email: "off@example.com",
      bus,
      store,
      wf,
    });
    const updated = await store.findById("t-off", oportunidad._id);
    assert.equal(updated?.nextAction, null);
  });

  it("I — nextAction existente → condición absent no sobrescribe", async () => {
    const automationStore = createMemoryGrowthAutomationStore();
    const store = createMemoryGrowthOpportunityStore();
    const wf = createMemoryGrowthOpportunityWorkflow();
    const salesOps = createMemorySalesOpsPort({
      store,
      workflow: wf,
      eventBus: createMemoryGrowthEventBus(),
    });

    await ensureGrowthStartupNextActionAutomation(automationStore, "t-keep");

    const personas = createMemoryGrowthPersonaStore();
    const person = await upsertGrowthPersona(personas, {
      tenantId: "t-keep",
      email: "keep@example.com",
      displayName: "Keep",
      origin: {
        kind: "manual",
        sourceCollection: "manual",
        sourceId: "m-keep",
      },
    });
    assert.ok(person.ok);
    if (!person.ok) return;

    const opened = await openGrowthOpportunity(store, wf, {
      tenantId: "t-keep",
      personaId: person.persona._id,
      typeKey: "inquiry",
      origin: {
        kind: "manual",
        sourceCollection: "manual",
        sourceId: "m-keep",
      },
      sourceCollection: "manual",
      sourceId: "m-keep",
      now: "2026-09-14T12:00:00.000Z",
    });
    assert.ok(opened.ok);
    if (!opened.ok) return;

    await setGrowthNextAction(store, {
      tenantId: "t-keep",
      oportunidadId: opened.oportunidad._id,
      summary: "Acción humana previa",
      kind: "contact",
      actorUserId: "human",
      now: "2026-09-14T12:00:30.000Z",
    });

    await handleGrowthAutomationEvent(
      {
        id: "evt-keep",
        type: "GrowthOpportunityOpened",
        tenantId: "t-keep",
        payload: {
          oportunidadId: opened.oportunidad._id,
          personaId: person.persona._id,
        },
      },
      {
        automationStore,
        opportunityStore: store,
        salesOps,
      }
    );

    const still = await store.findById("t-keep", opened.oportunidad._id);
    assert.equal(still?.nextAction?.summary, "Acción humana previa");
  });

  it("J — won/lost limpia nextAction", async () => {
    const store = createMemoryGrowthOpportunityStore();
    const wf = createMemoryGrowthOpportunityWorkflow();
    const personas = createMemoryGrowthPersonaStore();
    const person = await upsertGrowthPersona(personas, {
      tenantId: "t-final",
      email: "final@example.com",
      displayName: "Final",
      origin: {
        kind: "manual",
        sourceCollection: "manual",
        sourceId: "m-final",
      },
    });
    assert.ok(person.ok);
    if (!person.ok) return;

    const opened = await openGrowthOpportunity(store, wf, {
      tenantId: "t-final",
      personaId: person.persona._id,
      typeKey: "inquiry",
      origin: {
        kind: "manual",
        sourceCollection: "manual",
        sourceId: "m-final",
      },
      sourceCollection: "manual",
      sourceId: "m-final",
    });
    assert.ok(opened.ok);
    if (!opened.ok) return;

    await setGrowthNextAction(store, {
      tenantId: "t-final",
      oportunidadId: opened.oportunidad._id,
      summary: "Contactar a la persona",
      kind: "contact",
    });

    await transitionGrowthOpportunity(store, wf, {
      tenantId: "t-final",
      oportunidadId: opened.oportunidad._id,
      transitionId: "activate",
    });
    const won = await transitionGrowthOpportunity(store, wf, {
      tenantId: "t-final",
      oportunidadId: opened.oportunidad._id,
      transitionId: "win",
    });
    assert.equal(won.ok, true);
    if (!won.ok) return;
    assert.equal(won.oportunidad.status, "won");
    assert.equal(won.oportunidad.nextAction, null);

    const opened2 = await openGrowthOpportunity(store, wf, {
      tenantId: "t-final",
      personaId: person.persona._id,
      typeKey: "registration",
      subjectType: "event",
      subjectId: "evt-1",
      origin: {
        kind: "event",
        sourceCollection: "manual",
        sourceId: "m-lost",
      },
      sourceCollection: "manual",
      sourceId: "m-lost",
    });
    assert.ok(opened2.ok);
    if (!opened2.ok) return;
    await setGrowthNextAction(store, {
      tenantId: "t-final",
      oportunidadId: opened2.oportunidad._id,
      summary: "Seguir",
    });
    await transitionGrowthOpportunity(store, wf, {
      tenantId: "t-final",
      oportunidadId: opened2.oportunidad._id,
      transitionId: "activate",
    });
    const lost = await transitionGrowthOpportunity(store, wf, {
      tenantId: "t-final",
      oportunidadId: opened2.oportunidad._id,
      transitionId: "lose",
    });
    assert.equal(lost.ok, true);
    if (!lost.ok) return;
    assert.equal(lost.oportunidad.nextAction, null);
  });

  it("K — tenant A no afecta tenant B", async () => {
    const store = createMemoryGrowthAutomationStore();
    const a = await ensureGrowthStartupNextActionAutomation(store, "tenant-a");
    const b = await ensureGrowthStartupNextActionAutomation(store, "tenant-b");
    assert.equal(a.ok && b.ok, true);
    if (!a.ok || !b.ok) return;
    assert.notEqual(a.automation._id, b.automation._id);
    assert.equal((await store.listAutomations("tenant-a")).length, 1);
    assert.equal((await store.listAutomations("tenant-b")).length, 1);

    await setGrowthAutomationActive(store, {
      tenantId: "tenant-a",
      automationId: a.automation._id,
      active: false,
      actor: { userId: "ops" },
    });
    const stillB = await store.findAutomationById(
      "tenant-b",
      b.automation._id
    );
    assert.equal(stillB?.status, "active");

    const reEnsureA = await ensureGrowthStartupNextActionAutomation(
      store,
      "tenant-a"
    );
    assert.equal(reEnsureA.ok, true);
    if (!reEnsureA.ok) return;
    assert.equal(reEnsureA.created, false);
    assert.equal(reEnsureA.automation.status, "disabled");
  });

  it("L — automation editada/renombrada: ensure no la reemplaza", async () => {
    const store = createMemoryGrowthAutomationStore();
    const seeded = await ensureGrowthStartupNextActionAutomation(
      store,
      "t-edit"
    );
    assert.equal(seeded.ok, true);
    if (!seeded.ok) return;

    const renamed = await updateGrowthAutomationDraft(store, {
      tenantId: "t-edit",
      automationId: seeded.automation._id,
      name: "Mi playbook custom",
      actor: { userId: "ops" },
    });
    assert.equal(renamed.ok, true);
    if (!renamed.ok) return;

    await publishGrowthAutomation(store, {
      tenantId: "t-edit",
      automationId: seeded.automation._id,
      actor: { userId: "ops" },
    });

    await setGrowthAutomationActive(store, {
      tenantId: "t-edit",
      automationId: seeded.automation._id,
      active: false,
      actor: { userId: "ops" },
    });

    const again = await ensureGrowthStartupNextActionAutomation(store, "t-edit");
    assert.equal(again.ok, true);
    if (!again.ok) return;
    assert.equal(again.created, false);
    assert.equal(again.automation._id, seeded.automation._id);
    assert.equal(again.automation.name, "Mi playbook custom");
    assert.equal(again.automation.status, "disabled");
    assert.equal((await store.listAutomations("t-edit")).length, 1);
  });

  it("defensa lectura: pickPrimaryNextAction ignora estados finales", () => {
    const legacy: GrowthOportunidad = {
      _id: "o-won",
      tenantId: "t",
      personaId: "p",
      typeKey: "inquiry",
      subjectType: "none",
      status: "won",
      workflowInstanceId: "w",
      origin: {
        kind: "manual",
        sourceCollection: "m",
        sourceId: "1",
        capturedAt: "2026-09-01T00:00:00.000Z",
      },
      source: { sourceCollection: "m", sourceId: "1" },
      nextAction: {
        summary: "Legacy pendiente",
        kind: "other",
        setAt: "2026-09-01T00:00:00.000Z",
      },
      openedAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-02T00:00:00.000Z",
      closedAt: "2026-09-02T00:00:00.000Z",
    };
    assert.equal(pickPrimaryNextAction([legacy]), null);
  });

  it("createGrowthAutomation rechaza seedKey duplicado en el mismo tenant", async () => {
    const store = createMemoryGrowthAutomationStore();
    const first = await createGrowthAutomation(store, {
      tenantId: "t-dup",
      name: "A",
      steps: GROWTH_STARTUP_NEXT_ACTION_STEPS,
      actor: { userId: "x" },
      seedKey: GROWTH_STARTUP_NEXT_ACTION_SEED_KEY,
    });
    assert.equal(first.ok, true);
    const second = await createGrowthAutomation(store, {
      tenantId: "t-dup",
      name: "B",
      steps: GROWTH_STARTUP_NEXT_ACTION_STEPS,
      actor: { userId: "x" },
      seedKey: GROWTH_STARTUP_NEXT_ACTION_SEED_KEY,
    });
    assert.equal(second.ok, false);
    if (second.ok) return;
    assert.equal(second.code, "conflict");
  });
});
