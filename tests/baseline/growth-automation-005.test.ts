/**
 * OT-GROWTH-AUTOMATION-005 — runner de esperas y reanudación.
 */
import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";
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
  createMemoryAutomationSchedulePort,
  publishGrowthAutomation,
  setGrowthAutomationActive,
  handleGrowthAutomationEvent,
  resetAutomationReentrancyForTests,
  validateAutomationSteps,
  GROWTH_AUTOMATION_RESUME_EVENT,
  automationResumeKey,
  type GrowthAutomationSalesOpsPort,
} from "../../src/core/growth/automations";
import { loadEnvLocal } from "../../src/core/migrations/env";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

function loadEnvFile(filename: string): void {
  const envPath = resolve(process.cwd(), filename);
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function loadTestMongoEnv(): void {
  loadEnvLocal();
  loadEnvFile(".env");
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

async function seedOpenOpportunity(tenantId: string) {
  const personas = createMemoryGrowthPersonaStore();
  const store = createMemoryGrowthOpportunityStore();
  const wf = createMemoryGrowthOpportunityWorkflow();
  const bus = createMemoryGrowthEventBus();
  const email = `${tenantId}@wait.test`;
  const persona = await upsertGrowthPersona(personas, {
    tenantId,
    email,
    displayName: "Wait Test",
    origin: {
      kind: "manual",
      sourceCollection: "test",
      sourceId: `src-${tenantId}`,
    },
    now: "2026-09-07T12:00:00.000Z",
  });
  assert.equal(persona.ok, true);
  if (!persona.ok) throw new Error("persona");
  const opened = await openGrowthOpportunity(store, wf, {
    tenantId,
    personaId: persona.persona._id,
    typeKey: "inquiry",
    origin: {
      kind: "manual",
      sourceCollection: "test",
      sourceId: `src-${tenantId}`,
    },
    sourceCollection: "test",
    sourceId: `src-${tenantId}`,
    actorUserId: "op",
    eventBus: bus,
    now: "2026-09-07T12:01:00.000Z",
  });
  assert.equal(opened.ok, true);
  if (!opened.ok) throw new Error("open");
  return { store, wf, bus, oportunidadId: opened.oportunidad._id };
}

const WAIT_STEPS = [
  {
    kind: "trigger" as const,
    eventTypes: ["GrowthOpportunityOpened" as const],
  },
  {
    kind: "action" as const,
    action: "salesRecordFollowUp" as const,
    followUpKind: "note" as const,
    summary: "Antes de esperar",
  },
  { kind: "wait" as const, durationMs: 60_000 },
  {
    kind: "action" as const,
    action: "salesSetNextAction" as const,
    summary: "Después de esperar",
  },
];

describe("OT-GROWTH-AUTOMATION-005 — catálogo WAIT", () => {
  it("acepta Acción → WAIT → Continuar; rechaza WAIT mal ubicado", () => {
    const ok = validateAutomationSteps(WAIT_STEPS);
    assert.equal(ok.ok, true);

    const early = validateAutomationSteps([
      { kind: "trigger", eventTypes: ["GrowthOpportunityOpened"] },
      { kind: "wait", durationMs: 1000 },
      {
        kind: "action",
        action: "salesSetNextAction",
        summary: "x",
      },
    ]);
    assert.equal(early.ok, false);
    if (!early.ok) assert.equal(early.code, "steps_out_of_order");

    const noContinue = validateAutomationSteps([
      { kind: "trigger", eventTypes: ["GrowthOpportunityOpened"] },
      {
        kind: "action",
        action: "salesClearNextAction",
      },
      { kind: "wait", durationMs: 1000 },
    ]);
    assert.equal(noContinue.ok, false);
    if (!noContinue.ok) assert.equal(noContinue.code, "missing_post_wait_action");
  });
});

describe("OT-GROWTH-AUTOMATION-005 — espera y reanudación", () => {
  beforeEach(() => {
    resetAutomationReentrancyForTests();
  });

  it("programa espera; antes del vencimiento no reanuda; vencida ejecuta una vez", async () => {
    const tenantId = "tenant-wait-005";
    const { store, wf, bus, oportunidadId } = await seedOpenOpportunity(tenantId);
    const automationStore = createMemoryGrowthAutomationStore();
    const schedulePort = createMemoryAutomationSchedulePort();
    const salesOps = createMemorySalesOpsPort({ store, workflow: wf, eventBus: bus });

    const created = await createGrowthAutomation(automationStore, {
      tenantId,
      name: "Espera 005",
      steps: WAIT_STEPS,
      actor: { userId: "author" },
    });
    assert.equal(created.ok, true);
    if (!created.ok) throw new Error("create");
    await publishGrowthAutomation(automationStore, {
      tenantId,
      automationId: created.automation._id,
      actor: { userId: "author" },
    });
    await setGrowthAutomationActive(automationStore, {
      tenantId,
      automationId: created.automation._id,
      active: true,
      actor: { userId: "author" },
    });

    const deps = {
      automationStore,
      opportunityStore: store,
      salesOps,
      schedule: schedulePort,
    };

    const first = await handleGrowthAutomationEvent(
      {
        id: "evt-source-1",
        type: "GrowthOpportunityOpened",
        tenantId,
        payload: { oportunidadId },
        correlationId: "corr-1",
      },
      deps
    );
    assert.equal(first.outcomes[0]?.status, "waiting");
    const waiting = first.outcomes[0];
    if (waiting.status !== "waiting") throw new Error("waiting");
    assert.equal(schedulePort.items.length, 1);
    assert.equal(schedulePort.items[0].status, "scheduled");
    assert.equal(schedulePort.items[0].tenantId, tenantId);
    assert.match(waiting.resumeKey, /wait:2/);
    assert.equal(
      waiting.resumeKey,
      automationResumeKey({
        tenantId,
        automationId: created.automation._id,
        version: 1,
        sourceEventId: "evt-source-1",
        waitStepIndex: 2,
      })
    );

    // Antes del vencimiento: flush no publica.
    const beforeDue = await schedulePort.flushDue(
      new Date(Date.now() - 1000).toISOString(),
      async () => {
        assert.fail("no debe publicar antes de vencimiento");
      }
    );
    assert.equal(beforeDue, 0);

    // Pre-wait ya ejecutó follow-up (sin nextAction aún).
    assert.equal((await store.findById(tenantId, oportunidadId))?.nextAction, null);

    let resumeCount = 0;
    const published = await schedulePort.flushDue(
      new Date(Date.now() + 120_000).toISOString(),
      async (item) => {
        resumeCount += 1;
        assert.equal(item.type, GROWTH_AUTOMATION_RESUME_EVENT);
        assert.equal(item.tenantId, tenantId);
        const resume = await handleGrowthAutomationEvent(
          {
            id: `evt-resume-${resumeCount}`,
            type: item.type,
            tenantId: item.tenantId,
            payload: item.payload,
            causationId: "evt-source-1",
            correlationId: "corr-1",
          },
          deps
        );
        assert.equal(resume.outcomes[0]?.status, "resumed");
        const resumed = resume.outcomes[0];
        if (resumed.status !== "resumed") throw new Error("resumed");
        assert.equal(resumed.sourceEventId, "evt-source-1");
        assert.equal(resumed.version, 1);
        assert.equal(resumed.automationId, created.automation._id);
        assert.equal(resumed.resumeKey, waiting.resumeKey);
      }
    );
    assert.equal(published, 1);
    assert.equal(resumeCount, 1);
    assert.equal(schedulePort.items[0].status, "published");

    // Segunda flush: no duplica.
    const again = await schedulePort.flushDue(
      new Date(Date.now() + 120_000).toISOString(),
      async () => {
        assert.fail("no debe republicar");
      }
    );
    assert.equal(again, 0);

    // Reanudación duplicada (mismo resumeKey) → skipped_duplicate.
    const dup = await handleGrowthAutomationEvent(
      {
        id: "evt-resume-dup",
        type: GROWTH_AUTOMATION_RESUME_EVENT,
        tenantId,
        payload: schedulePort.items[0].payload,
      },
      deps
    );
    assert.equal(dup.outcomes[0]?.status, "skipped_duplicate");

    const opp = await store.findById(tenantId, oportunidadId);
    assert.ok(opp?.nextAction);
    assert.match(opp!.nextAction!.summary, /Después de esperar/);
  });

  it("reinicio no pierde la espera (sigue en schedule port) y conserva tenant", async () => {
    const tenantA = "tenant-a-005";
    const tenantB = "tenant-b-005";
    const a = await seedOpenOpportunity(tenantA);
    const b = await seedOpenOpportunity(tenantB);
    const automationStore = createMemoryGrowthAutomationStore();
    const schedulePort = createMemoryAutomationSchedulePort();

    for (const [tenantId, seed] of [
      [tenantA, a] as const,
      [tenantB, b] as const,
    ]) {
      const created = await createGrowthAutomation(automationStore, {
        tenantId,
        name: `Auto ${tenantId}`,
        steps: WAIT_STEPS,
        actor: { userId: "author" },
      });
      assert.equal(created.ok, true);
      if (!created.ok) throw new Error("create");
      await publishGrowthAutomation(automationStore, {
        tenantId,
        automationId: created.automation._id,
        actor: { userId: "author" },
      });
      await setGrowthAutomationActive(automationStore, {
        tenantId,
        automationId: created.automation._id,
        active: true,
        actor: { userId: "author" },
      });

      const salesOps = createMemorySalesOpsPort({
        store: seed.store,
        workflow: seed.wf,
        eventBus: seed.bus,
      });
      const result = await handleGrowthAutomationEvent(
        {
          id: `evt-${tenantId}`,
          type: "GrowthOpportunityOpened",
          tenantId,
          payload: { oportunidadId: seed.oportunidadId },
        },
        {
          automationStore,
          opportunityStore: seed.store,
          salesOps,
          schedule: schedulePort,
        }
      );
      assert.equal(result.outcomes[0]?.status, "waiting");
    }

    assert.equal(schedulePort.items.length, 2);
    assert.equal(schedulePort.items[0].tenantId, tenantA);
    assert.equal(schedulePort.items[1].tenantId, tenantB);

    // Simula reinicio: claims in-memory se pierden; la espera persiste en items.
    resetAutomationReentrancyForTests();

    const flushedTenants: string[] = [];
    await schedulePort.flushDue(
      new Date(Date.now() + 120_000).toISOString(),
      async (item) => {
        flushedTenants.push(item.tenantId);
        const seed = item.tenantId === tenantA ? a : b;
        const salesOps = createMemorySalesOpsPort({
          store: seed.store,
          workflow: seed.wf,
          eventBus: seed.bus,
        });
        // Aislamiento: payload tenant debe coincidir.
        assert.equal(
          (item.payload as { tenantId: string }).tenantId,
          item.tenantId
        );
        const resume = await handleGrowthAutomationEvent(
          {
            id: `resume-${item.scheduledId}`,
            type: item.type,
            tenantId: item.tenantId,
            payload: item.payload,
          },
          {
            automationStore,
            opportunityStore: seed.store,
            salesOps,
            schedule: schedulePort,
          }
        );
        assert.equal(resume.outcomes[0]?.status, "resumed");
      }
    );

    assert.deepEqual(flushedTenants.sort(), [tenantA, tenantB].sort());

    // Cross-tenant resume rechazado.
    const cross = await handleGrowthAutomationEvent(
      {
        id: "cross",
        type: GROWTH_AUTOMATION_RESUME_EVENT,
        tenantId: tenantB,
        payload: {
          ...schedulePort.items[0].payload,
          // fuerza mismatch evento vs payload
        },
      },
      {
        automationStore,
        opportunityStore: b.store,
        salesOps: createMemorySalesOpsPort({
          store: b.store,
          workflow: b.wf,
          eventBus: b.bus,
        }),
        schedule: schedulePort,
      }
    );
    // payload.tenantId es A, event.tenantId es B
    assert.equal(cross.outcomes[0]?.status, "skipped_tenant");
  });

  it("fallo de una espera no bloquea las demás; reintento no duplica acción", async () => {
    const tenantId = "tenant-retry-005";
    const { store, wf, bus, oportunidadId } = await seedOpenOpportunity(tenantId);
    const automationStore = createMemoryGrowthAutomationStore();
    const schedulePort = createMemoryAutomationSchedulePort();

    const created = await createGrowthAutomation(automationStore, {
      tenantId,
      name: "Retry wait",
      steps: WAIT_STEPS,
      actor: { userId: "author" },
    });
    assert.equal(created.ok, true);
    if (!created.ok) throw new Error("create");
    await publishGrowthAutomation(automationStore, {
      tenantId,
      automationId: created.automation._id,
      actor: { userId: "author" },
    });
    await setGrowthAutomationActive(automationStore, {
      tenantId,
      automationId: created.automation._id,
      active: true,
      actor: { userId: "author" },
    });

    let failNext = true;
    const baseSales = createMemorySalesOpsPort({
      store,
      workflow: wf,
      eventBus: bus,
    });
    const salesOps: GrowthAutomationSalesOpsPort = {
      ...baseSales,
      async salesSetNextAction(req) {
        if (failNext) {
          failNext = false;
          return { ok: false, reason: "action_failed", error: "simulated" };
        }
        return baseSales.salesSetNextAction(req);
      },
    };

    const deps = {
      automationStore,
      opportunityStore: store,
      salesOps,
      schedule: schedulePort,
    };

    await handleGrowthAutomationEvent(
      {
        id: "evt-retry-src",
        type: "GrowthOpportunityOpened",
        tenantId,
        payload: { oportunidadId },
      },
      deps
    );

    // Primera reanudación falla → claim liberado.
    await assert.rejects(async () => {
      await handleGrowthAutomationEvent(
        {
          id: "evt-resume-fail",
          type: GROWTH_AUTOMATION_RESUME_EVENT,
          tenantId,
          payload: schedulePort.items[0].payload,
        },
        deps
      );
    });

    assert.equal((await store.findById(tenantId, oportunidadId))?.nextAction, null);

    // Reintento ejecuta una sola vez.
    const ok = await handleGrowthAutomationEvent(
      {
        id: "evt-resume-ok",
        type: GROWTH_AUTOMATION_RESUME_EVENT,
        tenantId,
        payload: schedulePort.items[0].payload,
      },
      deps
    );
    assert.equal(ok.outcomes[0]?.status, "resumed");
    assert.ok((await store.findById(tenantId, oportunidadId))?.nextAction);

    const dup = await handleGrowthAutomationEvent(
      {
        id: "evt-resume-ok-2",
        type: GROWTH_AUTOMATION_RESUME_EVENT,
        tenantId,
        payload: schedulePort.items[0].payload,
      },
      deps
    );
    assert.equal(dup.outcomes[0]?.status, "skipped_duplicate");
  });
});

describe("OT-GROWTH-AUTOMATION-005 — infraestructura reutilizada", () => {
  it("no introduce segundo bus/scheduler; usa flushScheduledEvents + claim", () => {
    const publisher = readSrc("src/core/events/publisher/index.ts");
    const runner = readSrc("src/core/events/scheduled-runner.ts");
    const wait = readSrc("src/core/growth/automations/wait.ts");
    assert.match(publisher, /claimDueScheduledEvent/);
    assert.match(publisher, /flushScheduledEvents/);
    assert.match(runner, /flushScheduledEventsDetailed/);
    assert.match(wait, /GROWTH_AUTOMATION_RESUME_EVENT/);
    assert.doesNotMatch(runner, /new WorkflowEngine|second bus|BullMQ|agenda\.js/i);
  });
});

describe("OT-GROWTH-AUTOMATION-005 — claim Mongo de programados", () => {
  it("claim atómico: un vencido pasa a publishing una sola vez", async (t) => {
    loadTestMongoEnv();
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;
    if (!uri || !dbName) {
      t.skip("Sin MONGODB_URI/MONGODB_DB");
      return;
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    // core_scheduled_events usa _id string (sched-…), no ObjectId.
    const col = db.collection("core_scheduled_events");
    const id = `sched-test-005-${Date.now()}`;
    const past = new Date(Date.now() - 60_000).toISOString();
    const nowIso = new Date().toISOString();

    try {
      await col.insertOne({
        _id: id,
        tenantId: "tenant-flush-005",
        type: "GrowthAutomationResume",
        entityType: "growth_automation",
        entityId: "auto-test",
        payload: { kind: "automation_resume", probe: true },
        scheduledFor: past,
        status: "scheduled",
        createdAt: nowIso,
      } as never);

      const first = await col.findOneAndUpdate(
        { status: "scheduled", scheduledFor: { $lte: nowIso }, _id: id } as never,
        { $set: { status: "publishing", updatedAt: nowIso } },
        { returnDocument: "after" }
      );
      assert.ok(first);
      assert.equal((first as unknown as { _id: string })._id, id);
      assert.equal((first as unknown as { status: string }).status, "publishing");

      const second = await col.findOneAndUpdate(
        { status: "scheduled", scheduledFor: { $lte: nowIso }, _id: id } as never,
        { $set: { status: "publishing", updatedAt: nowIso } },
        { returnDocument: "after" }
      );
      assert.equal(second, null);

      await col.updateOne(
        { _id: id } as never,
        { $set: { status: "published", updatedAt: new Date().toISOString() } }
      );
      const stored = await col.findOne({ _id: id } as never);
      assert.equal(stored?.status, "published");
    } finally {
      await col.deleteOne({ _id: id } as never);
      await client.close();
    }
  });
});
