/**
 * OT-GROWTH-AUTOMATION-006 — WAIT en UI operativa (reutiliza runner 005).
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
  createMemoryAutomationSchedulePort,
  handleGrowthAutomationEvent,
  publishGrowthAutomation,
  resetAutomationReentrancyForTests,
  setGrowthAutomationActive,
  tryMutatePublishedAutomationVersion,
  updateGrowthAutomationDraft,
  validateAutomationSteps,
  AUTOMATION_WAIT_MAX_DURATION_MS,
  type GrowthAutomationSalesOpsPort,
} from "../../src/core/growth/automations";
import {
  automationFormFromSteps,
  buildAutomationStepsFromForm,
  EMPTY_AUTOMATION_EDITOR_FORM,
  waitDurationMs,
} from "../../src/lib/growth/automations-form";
import {
  automationNaturalProse,
  automationNaturalSummary,
  automationWaitStepLabel,
  AUTOMATION_WAIT_TOGGLE_LABEL,
} from "../../src/lib/growth/automations-labels";

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

async function seedOpenOpportunity(tenantId: string) {
  const personas = createMemoryGrowthPersonaStore();
  const store = createMemoryGrowthOpportunityStore();
  const wf = createMemoryGrowthOpportunityWorkflow();
  const bus = createMemoryGrowthEventBus();
  const persona = await upsertGrowthPersona(personas, {
    tenantId,
    email: `${tenantId}@ui-wait.test`,
    displayName: "UI Wait",
    origin: {
      kind: "admission",
      channel: "portal-admision",
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
      kind: "admission",
      channel: "portal-admision",
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

const WAIT_FORM = {
  ...EMPTY_AUTOMATION_EDITOR_FORM,
  name: "Seguimiento con espera",
  eventType: "GrowthOpportunityOpened" as const,
  conditionEnabled: false,
  actionType: "salesSetNextAction" as const,
  nextActionSummary: "Llamar para confirmar interés",
  waitEnabled: true,
  waitAmount: "2",
  waitUnit: "days" as const,
  postActionType: "salesRecordFollowUp" as const,
  postFollowUpKind: "note" as const,
  postFollowUpSummary: "Volver a contactar",
};

describe("OT-GROWTH-AUTOMATION-006 — superficie UI WAIT", () => {
  it("editor expone Esperar cantidad/unidad sin jerga técnica", () => {
    const editor = readSrc(
      "src/components/admin/growth/AutomatizacionEditorClient.tsx"
    );
    assert.match(editor, /Cuando pase esto/);
    assert.match(editor, /Hacer esto/);
    assert.match(editor, /AUTOMATION_WAIT_TOGGLE_LABEL/);
    assert.match(editor, /AUTOMATION_WAIT_BLOCK_TITLE/);
    assert.match(editor, /AUTOMATION_AFTER_WAIT_TITLE/);
    assert.match(editor, /AUTOMATION_WAIT_UNIT_OPTIONS/);
    assert.match(editor, /Cantidad/);
    assert.match(editor, /index=\{4\}/);
    assert.match(editor, /index=\{5\}/);
    assert.doesNotMatch(editor, /resumeKey|durationMs|scheduledFor|Event Bus/i);
    assert.doesNotMatch(editor, /drag|drop|canvas|ReactFlow/i);
    assert.doesNotMatch(editor, /milisegundo/i);

    const labels = readSrc("src/lib/growth/automations-labels.ts");
    assert.match(labels, /Después, esperar/);
    assert.match(labels, /Después, hacer esto/);
    assert.equal(AUTOMATION_WAIT_TOGGLE_LABEL, "Después, esperar");

    assert.ok(
      existsSync(
        resolve(process.cwd(), "src/lib/growth/automations-wait-units.ts")
      )
    );

    const listPage = readSrc("src/app/admin/automatizaciones/page.tsx");
    const detailPage = readSrc("src/app/admin/automatizaciones/[id]/page.tsx");
    const createPage = readSrc("src/app/admin/automatizaciones/nueva/page.tsx");
    assert.match(listPage, /growth\.automations\.view/);
    assert.match(listPage, /growth\.automations\.manage/);
    assert.match(detailPage, /growth\.automations\.view/);
    assert.match(createPage, /growth\.automations\.manage/);
  });
});

describe("OT-GROWTH-AUTOMATION-006 — formulario ↔ contrato WAIT", () => {
  it("construye Acción → Esperar 2 días → Continuar y resume en prosa", () => {
    const built = buildAutomationStepsFromForm(WAIT_FORM);
    assert.equal(built.ok, true);
    if (!built.ok) return;

    const validated = validateAutomationSteps(built.steps);
    assert.equal(validated.ok, true);
    if (!validated.ok) return;

    const wait = validated.steps.find((s) => s.kind === "wait");
    assert.ok(wait && wait.kind === "wait");
    if (!wait || wait.kind !== "wait") return;
    assert.equal(wait.durationMs, waitDurationMs(2, "days"));
    assert.equal(automationWaitStepLabel(wait), "Esperar 2 días");

    const prose = automationNaturalProse(validated.steps);
    assert.match(prose, /se cree una oportunidad/i);
    assert.match(prose, /definir qué hacer ahora/i);
    assert.match(prose, /esperar 2 días/i);
    assert.match(prose, /registrar seguimiento/i);
    assert.doesNotMatch(prose, /durationMs|resumeKey|waitEnabled|salesSetNextAction/);

    const summary = automationNaturalSummary(validated.steps);
    assert.equal(summary.wait, "Esperar 2 días");
    assert.match(summary.after ?? "", /Volver a contactar/);

    const hydrated = automationFormFromSteps("Seguimiento con espera", validated.steps);
    assert.equal(hydrated.waitEnabled, true);
    assert.equal(hydrated.waitAmount, "2");
    assert.equal(hydrated.waitUnit, "days");
    assert.equal(hydrated.postActionType, "salesRecordFollowUp");
    assert.equal(hydrated.postFollowUpSummary, "Volver a contactar");
  });

  it("valida cantidad/unidad y tope de 30 días", () => {
    const missingAfter = buildAutomationStepsFromForm({
      ...WAIT_FORM,
      postActionType: "",
    });
    assert.equal(missingAfter.ok, false);
    if (!missingAfter.ok) {
      assert.match(missingAfter.error, /después de esperar/i);
    }

    const badAmount = buildAutomationStepsFromForm({
      ...WAIT_FORM,
      waitAmount: "0",
    });
    assert.equal(badAmount.ok, false);

    const tooLong = buildAutomationStepsFromForm({
      ...WAIT_FORM,
      waitAmount: "31",
      waitUnit: "days",
    });
    assert.equal(tooLong.ok, false);
    if (!tooLong.ok) assert.match(tooLong.error, /30 días/);

    const maxOk = buildAutomationStepsFromForm({
      ...WAIT_FORM,
      waitAmount: "30",
      waitUnit: "days",
    });
    assert.equal(maxOk.ok, true);
    if (maxOk.ok) {
      const wait = maxOk.steps.find((s) => s.kind === "wait");
      assert.ok(wait && wait.kind === "wait");
      if (wait && wait.kind === "wait") {
        assert.equal(wait.durationMs, AUTOMATION_WAIT_MAX_DURATION_MS);
      }
    }

    const withoutWait = buildAutomationStepsFromForm({
      ...WAIT_FORM,
      waitEnabled: false,
    });
    assert.equal(withoutWait.ok, true);
    if (withoutWait.ok) {
      assert.equal(
        withoutWait.steps.some((s) => s.kind === "wait"),
        false
      );
    }
  });
});

describe("OT-GROWTH-AUTOMATION-006 — ciclo UI → runner 005", () => {
  beforeEach(() => {
    resetAutomationReentrancyForTests();
  });

  it("guardar → publicar → evento → 1ª acción → WAIT → vencimiento → 2ª acción", async () => {
    const tenantId = "tenant-ui-006";
    const built = buildAutomationStepsFromForm({
      ...WAIT_FORM,
      waitAmount: "1",
      waitUnit: "minutes",
    });
    assert.ok(built.ok);
    if (!built.ok) return;

    const automationStore = createMemoryGrowthAutomationStore();
    const created = await createGrowthAutomation(automationStore, {
      tenantId,
      name: WAIT_FORM.name,
      steps: built.steps,
      actor: { userId: "u1" },
    });
    assert.ok(created.ok);
    if (!created.ok) return;

    const published = await publishGrowthAutomation(automationStore, {
      tenantId,
      automationId: created.automation._id,
      actor: { userId: "u1" },
    });
    assert.ok(published.ok);
    if (!published.ok) return;
    assert.equal(published.automation.status, "active");

    const immut = await tryMutatePublishedAutomationVersion(automationStore, {
      tenantId,
      automationId: created.automation._id,
      version: published.version.version,
      steps: built.steps,
      actor: { userId: "u1" },
    });
    assert.equal(immut.ok, false);
    if (!immut.ok) assert.equal(immut.code, "published_immutable");

    const draft = await updateGrowthAutomationDraft(automationStore, {
      tenantId,
      automationId: created.automation._id,
      name: `${WAIT_FORM.name} (borrador)`,
      steps: built.steps,
      actor: { userId: "u1" },
    });
    assert.ok(draft.ok);
    if (draft.ok) {
      assert.ok(draft.automation.draftVersion != null);
      assert.equal(draft.automation.status, "active");
    }

    const { store, wf, bus, oportunidadId } =
      await seedOpenOpportunity(tenantId);
    const salesOps = createMemorySalesOpsPort({
      store,
      workflow: wf,
      eventBus: bus,
    });
    const schedulePort = createMemoryAutomationSchedulePort();
    const deps = {
      automationStore,
      opportunityStore: store,
      salesOps,
      schedule: schedulePort,
    };

    const beforeSchedule = Date.now();
    const first = await handleGrowthAutomationEvent(
      {
        id: "evt-006-1",
        type: "GrowthOpportunityOpened",
        tenantId,
        payload: { oportunidadId },
        userId: "visitor",
      },
      deps
    );

    assert.equal(first.outcomes[0]?.status, "waiting");
    const waiting = first.outcomes[0];
    if (!waiting || waiting.status !== "waiting") throw new Error("waiting");

    const afterFirst = await store.findById(tenantId, oportunidadId);
    assert.equal(
      afterFirst?.nextAction?.summary,
      "Llamar para confirmar interés"
    );
    assert.equal(schedulePort.items.length, 1);
    const scheduledForMs = Date.parse(schedulePort.items[0]!.scheduledFor);
    const expectedMs = waitDurationMs(1, "minutes");
    assert.ok(scheduledForMs >= beforeSchedule + expectedMs - 2000);
    assert.ok(scheduledForMs <= Date.now() + expectedMs + 2000);

    const beforeDue = await schedulePort.flushDue(
      new Date(Date.now() - 1000).toISOString(),
      async () => {
        throw new Error("no debería publicar antes de tiempo");
      }
    );
    assert.equal(beforeDue, 0);

    let resumedOk = false;
    let resumeActions: Array<{ action: string; activityId?: string }> = [];
    await schedulePort.flushDue(
      new Date(Date.now() + expectedMs + 5000).toISOString(),
      async (item) => {
        const resume = await handleGrowthAutomationEvent(
          {
            id: `resume-${item.scheduledId}`,
            type: item.type,
            tenantId: item.tenantId,
            payload: item.payload,
            userId: "system",
          },
          deps
        );
        assert.equal(resume.outcomes[0]?.status, "resumed");
        const resumed = resume.outcomes[0];
        if (resumed?.status === "resumed") {
          resumeActions = resumed.actions;
        }
        resumedOk = true;
      }
    );
    assert.equal(resumedOk, true);
    assert.ok(
      resumeActions.some((a) => a.action === "salesRecordFollowUp"),
      "segunda acción post-WAIT"
    );
    assert.ok(
      bus.events.some((e) => e.type === "GrowthActivityRecorded"),
      "seguimiento publicado al bus"
    );
  });

  it("aísla por Espacio: tenant B no reanuda ni ejecuta A", async () => {
    const tenantA = "tenant-ui-006-a";
    const tenantB = "tenant-ui-006-b";
    const built = buildAutomationStepsFromForm(WAIT_FORM);
    assert.ok(built.ok);
    if (!built.ok) return;

    const automationStore = createMemoryGrowthAutomationStore();
    const created = await createGrowthAutomation(automationStore, {
      tenantId: tenantA,
      name: WAIT_FORM.name,
      steps: built.steps,
      actor: { userId: "u1" },
    });
    assert.ok(created.ok);
    if (!created.ok) return;
    await publishGrowthAutomation(automationStore, {
      tenantId: tenantA,
      automationId: created.automation._id,
      actor: { userId: "u1" },
    });
    await setGrowthAutomationActive(automationStore, {
      tenantId: tenantA,
      automationId: created.automation._id,
      active: true,
      actor: { userId: "u1" },
    });

    const a = await seedOpenOpportunity(tenantA);
    const salesOpsA = createMemorySalesOpsPort({
      store: a.store,
      workflow: a.wf,
      eventBus: a.bus,
    });
    const schedulePort = createMemoryAutomationSchedulePort();

    await handleGrowthAutomationEvent(
      {
        id: "evt-006-a",
        type: "GrowthOpportunityOpened",
        tenantId: tenantA,
        payload: { oportunidadId: a.oportunidadId },
      },
      {
        automationStore,
        opportunityStore: a.store,
        salesOps: salesOpsA,
        schedule: schedulePort,
      }
    );

    const cross = await handleGrowthAutomationEvent(
      {
        id: "evt-006-b",
        type: "GrowthOpportunityOpened",
        tenantId: tenantB,
        payload: { oportunidadId: a.oportunidadId },
      },
      {
        automationStore,
        opportunityStore: a.store,
        salesOps: salesOpsA,
        schedule: schedulePort,
      }
    );
    assert.equal(cross.outcomes.length, 0);

    const listB = await automationStore.listAutomations(tenantB);
    assert.equal(listB.length, 0);
  });
});

describe("OT-GROWTH-AUTOMATION-006 — no segundo runtime", () => {
  it("reutiliza wait.ts / catalog / schedule existentes", () => {
    const editor = readSrc(
      "src/components/admin/growth/AutomatizacionEditorClient.tsx"
    );
    assert.doesNotMatch(editor, /createMemoryAutomationSchedulePort|flushScheduled/);
    assert.doesNotMatch(editor, /Workflow Engine|segundo runner/i);

    const form = readSrc("src/lib/growth/automations-form.ts");
    assert.match(form, /AUTOMATION_WAIT_MAX_DURATION_MS/);
    assert.match(form, /kind:\s*["']wait["']/);
  });
});
