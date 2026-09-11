/**
 * OT-GROWTH-AUTOMATION-007 — historial «Qué ha pasado».
 */
import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
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
  AUTOMATION_HISTORY_COMPLETED_LINE,
  AUTOMATION_HISTORY_FAILED_LINE,
  createAutomationRunRecorder,
  createGrowthAutomation,
  createMemoryAutomationSchedulePort,
  createMemoryGrowthAutomationRunStore,
  createMemoryGrowthAutomationStore,
  formatAutomationRunWhen,
  handleGrowthAutomationEvent,
  listAutomationRuns,
  publishGrowthAutomation,
  resetAutomationReentrancyForTests,
  sanitizeAutomationErrorDetail,
  setGrowthAutomationActive,
  type GrowthAutomationSalesOpsPort,
} from "../../src/core/growth/automations";
import {
  AUTOMATION_HISTORY_SECTION_TITLE,
  AUTOMATION_RUN_STATUS_LABELS,
} from "../../src/lib/growth/automations-labels";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

function createMemorySalesOpsPort(input: {
  store: GrowthOpportunityStore;
  workflow: GrowthOpportunityWorkflowPort;
  eventBus: GrowthEventBusPort;
  failNext?: { action?: string; detail?: string };
}): GrowthAutomationSalesOpsPort {
  const { store, workflow, eventBus } = input;
  return {
    async salesTransitionOpportunity(req) {
      if (input.failNext?.action === "salesTransitionOpportunity") {
        return {
          ok: false,
          reason: "transition_failed",
          error: input.failNext.detail ?? "fallo de prueba",
        };
      }
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
      if (input.failNext?.action === "salesRecordFollowUp") {
        return {
          ok: false,
          reason: input.failNext.detail ?? "follow_up_failed",
        };
      }
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
      if (input.failNext?.action === "salesSetNextAction") {
        return {
          ok: false,
          reason: input.failNext.detail ?? "next_action_failed",
        };
      }
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
  const email = `${tenantId}@hist007.test`;
  const persona = await upsertGrowthPersona(personas, {
    tenantId,
    email,
    displayName: "Hist Test",
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

const SIMPLE_STEPS = [
  {
    kind: "trigger" as const,
    eventTypes: ["GrowthOpportunityOpened" as const],
  },
  {
    kind: "action" as const,
    action: "salesSetNextAction" as const,
    summary: "Llamar para confirmar interés",
  },
];

const WAIT_STEPS = [
  {
    kind: "trigger" as const,
    eventTypes: ["GrowthOpportunityOpened" as const],
  },
  {
    kind: "action" as const,
    action: "salesSetNextAction" as const,
    summary: "Llamar para confirmar interés",
  },
  { kind: "wait" as const, durationMs: 2 * 86_400_000 },
  {
    kind: "action" as const,
    action: "salesRecordFollowUp" as const,
    followUpKind: "note" as const,
    summary: "Volver a contactar",
  },
];

describe("OT-GROWTH-AUTOMATION-007 — superficie y límites", () => {
  it("expone API history, UI y migración sin segundo bus", () => {
    assert.ok(
      existsSyncSafe("src/app/api/growth/automations/[id]/history/route.ts")
    );
    assert.ok(
      existsSyncSafe("src/components/admin/growth/AutomatizacionHistory.tsx")
    );
    assert.ok(
      existsSyncSafe("src/core/migrations/017-growth-automation-runs.ts")
    );
    const historyRoute = readSrc(
      "src/app/api/growth/automations/[id]/history/route.ts"
    );
    assert.match(historyRoute, /growth\.automations\.view/);
    assert.doesNotMatch(historyRoute, /resumeKey|eventId|attemptKey/);

    const ui = readSrc(
      "src/components/admin/growth/AutomatizacionHistory.tsx"
    );
    assert.match(ui, new RegExp(AUTOMATION_HISTORY_SECTION_TITLE));
    assert.doesNotMatch(
      ui,
      /resumeKey|eventId|automationId|payload|stack/i
    );

    const runtime = readSrc("src/lib/growth/automations-runtime.ts");
    assert.match(runtime, /runRecorder/);
    assert.doesNotMatch(runtime, /createMemoryGrowthEventBus/);

    assert.equal(AUTOMATION_RUN_STATUS_LABELS.completed, "Terminada");
    assert.equal(AUTOMATION_RUN_STATUS_LABELS.waiting, "Esperando");
    assert.equal(
      AUTOMATION_RUN_STATUS_LABELS.needs_attention,
      "Necesita atención"
    );
    assert.equal(AUTOMATION_RUN_STATUS_LABELS.in_progress, "En curso");
  });

  it("sanitiza detalles de error técnicos", () => {
    assert.equal(
      sanitizeAutomationErrorDetail("resumeKey=abc eventId=xyz"),
      undefined
    );
    assert.equal(
      sanitizeAutomationErrorDetail("Estado no permitido\nat Object.foo"),
      "Estado no permitido"
    );
  });
});

function existsSyncSafe(rel: string): boolean {
  try {
    readFileSync(resolve(process.cwd(), rel));
    return true;
  } catch {
    return false;
  }
}

describe("OT-GROWTH-AUTOMATION-007 — historial de ejecuciones", () => {
  beforeEach(() => {
    resetAutomationReentrancyForTests();
  });

  it("evento → acción → historial terminado (sin duplicar en reintento)", async () => {
    const tenantId = "tenant-hist-done";
    const { store, wf, bus, oportunidadId } =
      await seedOpenOpportunity(tenantId);
    const automationStore = createMemoryGrowthAutomationStore();
    const runStore = createMemoryGrowthAutomationRunStore();
    const salesOps = createMemorySalesOpsPort({
      store,
      workflow: wf,
      eventBus: bus,
    });

    const created = await createGrowthAutomation(automationStore, {
      tenantId,
      name: "Simple 007",
      steps: SIMPLE_STEPS,
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
      runRecorder: createAutomationRunRecorder(runStore),
    };

    const first = await handleGrowthAutomationEvent(
      {
        id: "evt-done-1",
        type: "GrowthOpportunityOpened",
        tenantId,
        payload: { oportunidadId },
      },
      deps
    );
    assert.equal(first.outcomes[0]?.status, "executed");

    const runs = await listAutomationRuns(runStore, {
      tenantId,
      automationId: created.automation._id,
    });
    assert.equal(runs.length, 1);
    assert.equal(runs[0].status, "completed");
    assert.equal(runs[0].attemptKey, "evt-done-1");
    const texts = runs[0].lines.map((l) => l.text);
    assert.ok(texts.includes("Se creó una oportunidad."));
    assert.ok(
      texts.some((t) =>
        t.includes("Definió qué hacer ahora: “Llamar para confirmar interés”.")
      )
    );
    assert.ok(texts.includes(AUTOMATION_HISTORY_COMPLETED_LINE));
    assert.doesNotMatch(texts.join("\n"), /evt-done|resumeKey|automationId/);

    // Reintento del mismo evento → skipped_duplicate; sin segundo run.
    const dup = await handleGrowthAutomationEvent(
      {
        id: "evt-done-1",
        type: "GrowthOpportunityOpened",
        tenantId,
        payload: { oportunidadId },
      },
      deps
    );
    assert.equal(dup.outcomes[0]?.status, "skipped_duplicate");
    const again = await listAutomationRuns(runStore, {
      tenantId,
      automationId: created.automation._id,
    });
    assert.equal(again.length, 1);
  });

  it("evento → acción → espera → historial Esperando", async () => {
    const tenantId = "tenant-hist-wait";
    const { store, wf, bus, oportunidadId } =
      await seedOpenOpportunity(tenantId);
    const automationStore = createMemoryGrowthAutomationStore();
    const runStore = createMemoryGrowthAutomationRunStore();
    const schedulePort = createMemoryAutomationSchedulePort();
    const salesOps = createMemorySalesOpsPort({
      store,
      workflow: wf,
      eventBus: bus,
    });

    const created = await createGrowthAutomation(automationStore, {
      tenantId,
      name: "Wait 007",
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
      runRecorder: createAutomationRunRecorder(runStore),
    };

    const first = await handleGrowthAutomationEvent(
      {
        id: "evt-wait-1",
        type: "GrowthOpportunityOpened",
        tenantId,
        payload: { oportunidadId },
      },
      deps
    );
    assert.equal(first.outcomes[0]?.status, "waiting");

    const runs = await listAutomationRuns(runStore, {
      tenantId,
      automationId: created.automation._id,
    });
    assert.equal(runs.length, 1);
    assert.equal(runs[0].status, "waiting");
    assert.ok(runs[0].scheduledFor);
    const texts = runs[0].lines.map((l) => l.text);
    assert.ok(texts.some((t) => t.startsWith("Está esperando 2 días")));
    assert.ok(texts.some((t) => t.startsWith("Continuará el ")));
    assert.equal(runs[0].waitDurationLabel, "2 días");
  });

  it("reanudar → segunda acción → Terminada", async () => {
    const tenantId = "tenant-hist-resume";
    const { store, wf, bus, oportunidadId } =
      await seedOpenOpportunity(tenantId);
    const automationStore = createMemoryGrowthAutomationStore();
    const runStore = createMemoryGrowthAutomationRunStore();
    const schedulePort = createMemoryAutomationSchedulePort();
    const salesOps = createMemorySalesOpsPort({
      store,
      workflow: wf,
      eventBus: bus,
    });

    const created = await createGrowthAutomation(automationStore, {
      tenantId,
      name: "Resume 007",
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
      runRecorder: createAutomationRunRecorder(runStore),
    };

    await handleGrowthAutomationEvent(
      {
        id: "evt-resume-src",
        type: "GrowthOpportunityOpened",
        tenantId,
        payload: { oportunidadId },
      },
      deps
    );

    await schedulePort.flushDue(
      new Date(Date.now() + 3 * 86_400_000).toISOString(),
      async (item) => {
        const resume = await handleGrowthAutomationEvent(
          {
            id: "evt-resume-fire",
            type: item.type,
            tenantId: item.tenantId,
            payload: item.payload,
          },
          deps
        );
        assert.equal(resume.outcomes[0]?.status, "resumed");
      }
    );

    const runs = await listAutomationRuns(runStore, {
      tenantId,
      automationId: created.automation._id,
    });
    assert.equal(runs.length, 1);
    assert.equal(runs[0].status, "completed");
    assert.equal(runs[0].attemptKey, "evt-resume-src");
    const texts = runs[0].lines.map((l) => l.text);
    assert.ok(
      texts.some((t) => t.includes("Registró el seguimiento “Volver a contactar”."))
    );
    assert.ok(texts.includes(AUTOMATION_HISTORY_COMPLETED_LINE));
    assert.ok(!texts.some((t) => t.startsWith("Está esperando ")));
  });

  it("fallo → Necesita atención", async () => {
    const tenantId = "tenant-hist-fail";
    const { store, wf, bus, oportunidadId } =
      await seedOpenOpportunity(tenantId);
    const automationStore = createMemoryGrowthAutomationStore();
    const runStore = createMemoryGrowthAutomationRunStore();
    const salesOps = createMemorySalesOpsPort({
      store,
      workflow: wf,
      eventBus: bus,
      failNext: {
        action: "salesSetNextAction",
        detail: "No hay permiso operativo",
      },
    });

    const created = await createGrowthAutomation(automationStore, {
      tenantId,
      name: "Fail 007",
      steps: SIMPLE_STEPS,
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

    const result = await handleGrowthAutomationEvent(
      {
        id: "evt-fail-1",
        type: "GrowthOpportunityOpened",
        tenantId,
        payload: { oportunidadId },
      },
      {
        automationStore,
        opportunityStore: store,
        salesOps,
        runRecorder: createAutomationRunRecorder(runStore),
      }
    );
    assert.equal(result.outcomes[0]?.status, "action_failed");

    const runs = await listAutomationRuns(runStore, {
      tenantId,
      automationId: created.automation._id,
    });
    assert.equal(runs.length, 1);
    assert.equal(runs[0].status, "needs_attention");
    assert.ok(
      runs[0].lines.some((l) => l.text === AUTOMATION_HISTORY_FAILED_LINE)
    );
    assert.equal(runs[0].errorDetail, "No hay permiso operativo");
  });

  it("aislamiento multi-tenant: A no ve ejecuciones de B", async () => {
    const tenantA = "tenant-hist-a";
    const tenantB = "tenant-hist-b";
    const a = await seedOpenOpportunity(tenantA);
    const b = await seedOpenOpportunity(tenantB);
    const automationStore = createMemoryGrowthAutomationStore();
    const runStore = createMemoryGrowthAutomationRunStore();

    const ids: string[] = [];
    for (const [tenantId, seed] of [
      [tenantA, a] as const,
      [tenantB, b] as const,
    ]) {
      const created = await createGrowthAutomation(automationStore, {
        tenantId,
        name: `Auto ${tenantId}`,
        steps: SIMPLE_STEPS,
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
      ids.push(created.automation._id);

      await handleGrowthAutomationEvent(
        {
          id: `evt-${tenantId}`,
          type: "GrowthOpportunityOpened",
          tenantId,
          payload: { oportunidadId: seed.oportunidadId },
        },
        {
          automationStore,
          opportunityStore: seed.store,
          salesOps: createMemorySalesOpsPort({
            store: seed.store,
            workflow: seed.wf,
            eventBus: seed.bus,
          }),
          runRecorder: createAutomationRunRecorder(runStore),
        }
      );
    }

    const runsA = await listAutomationRuns(runStore, {
      tenantId: tenantA,
      automationId: ids[0],
    });
    const runsB = await listAutomationRuns(runStore, {
      tenantId: tenantB,
      automationId: ids[1],
    });
    assert.equal(runsA.length, 1);
    assert.equal(runsB.length, 1);
    assert.equal(runsA[0].tenantId, tenantA);
    assert.equal(runsB[0].tenantId, tenantB);

    const cross = await listAutomationRuns(runStore, {
      tenantId: tenantA,
      automationId: ids[1],
    });
    assert.equal(cross.length, 0);
  });

  it("formatea cuándo en lenguaje humano", () => {
    const now = new Date("2026-09-07T15:00:00.000Z");
    const today = formatAutomationRunWhen("2026-09-07T13:32:00.000Z", now);
    assert.match(today, /^Hoy,/);
    const other = formatAutomationRunWhen("2026-09-06T19:20:00.000Z", now);
    assert.match(other, /sep/i);
  });
});
