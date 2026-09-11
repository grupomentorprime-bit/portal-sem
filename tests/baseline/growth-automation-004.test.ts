/**
 * OT-GROWTH-AUTOMATION-004 — UI operativa Automatizaciones (sin canvas).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
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
  handleGrowthAutomationEvent,
  publishGrowthAutomation,
  setGrowthAutomationActive,
  tryMutatePublishedAutomationVersion,
  updateGrowthAutomationDraft,
  validateAutomationSteps,
  GROWTH_AUTOMATION_SYSTEM_ACTOR,
  type GrowthAutomationSalesOpsPort,
} from "../../src/core/growth/automations";
import {
  buildAutomationStepsFromForm,
  EMPTY_AUTOMATION_EDITOR_FORM,
} from "../../src/lib/growth/automations-form";
import {
  automationDisplayName,
  automationEventLabel,
  automationNaturalSummary,
  automationStatusLabel,
  AUTOMATION_EMPTY_TITLE,
  AUTOMATION_REVIEW_CTA,
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

describe("OT-GROWTH-AUTOMATION-004 — superficie UI", () => {
  it("páginas /admin/automatizaciones + nav con href y permisos", () => {
    for (const rel of [
      "src/app/admin/automatizaciones/page.tsx",
      "src/app/admin/automatizaciones/nueva/page.tsx",
      "src/app/admin/automatizaciones/[id]/page.tsx",
      "src/components/admin/growth/AutomatizacionesListClient.tsx",
      "src/components/admin/growth/AutomatizacionEditorClient.tsx",
      "src/lib/growth/automations-labels.ts",
      "src/lib/growth/automations-form.ts",
      "src/lib/growth/automations-read.ts",
    ]) {
      assert.ok(existsSync(resolve(process.cwd(), rel)), rel);
    }

    const nav = readSrc("src/lib/admin/nav-domains.ts");
    assert.match(
      nav,
      /id: "nav-automatizaciones"[\s\S]*?href: "\/admin\/automatizaciones"/
    );
    assert.match(nav, /growth\.automations\.view/);
    assert.match(nav, /growth\.automations\.manage/);

    const listPage = readSrc("src/app/admin/automatizaciones/page.tsx");
    assert.match(listPage, /growth\.automations\.view/);
    assert.match(listPage, /growth\.automations\.manage/);

    const editor = readSrc(
      "src/components/admin/growth/AutomatizacionEditorClient.tsx"
    );
    assert.doesNotMatch(editor, /Event Bus|versionId|tenantId|payload|workflow/i);
    assert.match(editor, /Cuando pase esto/);
    assert.match(editor, /Si se cumple esto/);
    assert.match(editor, /Hacer esto/);
    assert.match(editor, /data-automation-flow-step/);
    assert.match(editor, /AUTOMATION_ACTIVATE_CTA/);
    assert.match(editor, /AUTOMATION_REVIEW_CTA/);
    assert.match(
      readSrc("src/lib/growth/automations-labels.ts"),
      /Activar automatización/
    );
    assert.match(
      readSrc("src/lib/growth/automations-labels.ts"),
      new RegExp(AUTOMATION_REVIEW_CTA.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    );
    assert.match(
      readSrc("src/lib/growth/automations-labels.ts"),
      /automationDisplayName/
    );
    assert.match(
      readSrc("src/lib/growth/automations-read.ts"),
      /automationDisplayName/
    );

    const list = readSrc(
      "src/components/admin/growth/AutomatizacionesListClient.tsx"
    );
    assert.match(list, /AUTOMATION_EMPTY_TITLE/);
    assert.match(
      readSrc("src/lib/growth/automations-labels.ts"),
      new RegExp(
        AUTOMATION_EMPTY_TITLE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      )
    );
  });

  it("no introduce canvas / segundo runtime", () => {
    const editor = readSrc(
      "src/components/admin/growth/AutomatizacionEditorClient.tsx"
    );
    assert.doesNotMatch(editor, /drag|drop|canvas|ReactFlow|n8n/i);
    assert.doesNotMatch(editor, /resumeKey|durationMs|scheduled|Event Bus/i);

    const labels = readSrc("src/lib/growth/automations-labels.ts");
    assert.doesNotMatch(labels, /if\s*\(\s*tenant|ADL|SEM|Mentor/);
  });
});

describe("OT-GROWTH-AUTOMATION-004 — lenguaje humano + formulario", () => {
  it("oculta marcadores técnicos del nombre en proyección", () => {
    assert.equal(
      automationDisplayName(
        "[capture-004] Seguimiento de nuevas oportunidades"
      ),
      "Seguimiento de nuevas oportunidades"
    );
    assert.equal(
      automationDisplayName("[ops] [tmp] Seguimiento de nuevas oportunidades"),
      "Seguimiento de nuevas oportunidades"
    );
    assert.equal(
      automationDisplayName("Seguimiento de nuevas oportunidades"),
      "Seguimiento de nuevas oportunidades"
    );
    assert.equal(automationDisplayName("[solo-tag]"), "");
    assert.equal(automationDisplayName(""), "");
  });

  it("traduce eventos/acciones/condiciones sin jerga técnica", () => {
    assert.equal(
      automationEventLabel("GrowthOpportunityOpened"),
      "Se cree una oportunidad"
    );
    assert.equal(automationStatusLabel("draft"), "Borrador");
    assert.equal(automationStatusLabel("active"), "Activa");
    assert.equal(automationStatusLabel("disabled"), "Desactivada");

    const built = buildAutomationStepsFromForm({
      ...EMPTY_AUTOMATION_EDITOR_FORM,
      name: "Seguimiento de nuevas oportunidades",
      eventType: "GrowthOpportunityOpened",
      conditionEnabled: true,
      conditionKind: "origin",
      originValue: "channel:portal-admision",
      actionType: "salesSetNextAction",
      nextActionSummary: "Llamar para confirmar interés",
    });
    assert.equal(built.ok, true);
    if (!built.ok) return;

    const summary = automationNaturalSummary(built.steps);
    assert.match(summary.when, /se cree una oportunidad/i);
    assert.match(summary.if ?? "", /Portal web \/ Admisión/);
    assert.match(summary.then, /Definir qué hacer ahora/i);
    assert.match(summary.then, /Llamar para confirmar interés/);

    assert.doesNotMatch(summary.when, /GrowthOpportunityOpened/);
    assert.doesNotMatch(summary.then, /salesSetNextAction/);
    assert.doesNotMatch(summary.if ?? "", /portal-admision/);
  });

  it("rechaza WAIT mal ubicado / acción inventada", () => {
    const wait = validateAutomationSteps([
      { kind: "trigger", eventTypes: ["GrowthOpportunityOpened"] },
      { kind: "wait", durationMs: 1000 },
      {
        kind: "action",
        action: "salesSetNextAction",
        summary: "x",
      },
    ]);
    assert.equal(wait.ok, false);
    if (!wait.ok) assert.equal(wait.code, "steps_out_of_order");

    const bad = buildAutomationStepsFromForm({
      ...EMPTY_AUTOMATION_EDITOR_FORM,
      eventType: "GrowthOpportunityOpened",
      actionType: "" as never,
      nextActionSummary: "x",
    });
    assert.equal(bad.ok, false);
  });
});

describe("OT-GROWTH-AUTOMATION-004 — ciclo de vida + runtime real", () => {
  it("formulario UI → publish → AUTOMATION-003 → sales-ops", async () => {
    const tenantId = "tenant-ui-004";
    const built = buildAutomationStepsFromForm({
      ...EMPTY_AUTOMATION_EDITOR_FORM,
      name: "Seguimiento de nuevas oportunidades",
      eventType: "GrowthOpportunityOpened",
      conditionEnabled: true,
      conditionKind: "origin",
      originValue: "channel:portal-admision",
      actionType: "salesSetNextAction",
      nextActionSummary: "Llamar para confirmar interés",
    });
    assert.ok(built.ok);
    if (!built.ok) return;

    const automationStore = createMemoryGrowthAutomationStore();
    const created = await createGrowthAutomation(automationStore, {
      tenantId,
      name: "Seguimiento de nuevas oportunidades",
      steps: built.steps,
      actor: { userId: "u1" },
    });
    assert.ok(created.ok);
    if (!created.ok) return;
    assert.equal(created.automation.status, "draft");

    const edited = await updateGrowthAutomationDraft(automationStore, {
      tenantId,
      automationId: created.automation._id,
      name: "Seguimiento de nuevas oportunidades",
      steps: built.steps,
      actor: { userId: "u1" },
    });
    assert.ok(edited.ok);

    const published = await publishGrowthAutomation(automationStore, {
      tenantId,
      automationId: created.automation._id,
      actor: { userId: "u1" },
    });
    assert.ok(published.ok);
    if (!published.ok) return;
    assert.equal(published.automation.status, "active");
    assert.equal(published.version.status, "published");

    const immut = await tryMutatePublishedAutomationVersion(automationStore, {
      tenantId,
      automationId: created.automation._id,
      version: published.version.version,
      steps: built.steps,
      actor: { userId: "u1" },
    });
    assert.equal(immut.ok, false);
    if (!immut.ok) assert.equal(immut.code, "published_immutable");

    const personas = createMemoryGrowthPersonaStore();
    const store = createMemoryGrowthOpportunityStore();
    const wf = createMemoryGrowthOpportunityWorkflow();
    const bus = createMemoryGrowthEventBus();
    const person = await upsertGrowthPersona(personas, {
      tenantId,
      email: "lead@example.com",
      displayName: "Lead",
      origin: {
        kind: "admission",
        channel: "portal-admision",
        sourceCollection: "test",
        sourceId: "src-004",
      },
    });
    assert.ok(person.ok);
    if (!person.ok) return;

    const opened = await openGrowthOpportunity(store, wf, {
      tenantId,
      personaId: person.persona._id,
      typeKey: "inquiry",
      origin: {
        kind: "admission",
        channel: "portal-admision",
        sourceCollection: "test",
        sourceId: "src-004",
      },
      sourceCollection: "test",
      sourceId: "src-004",
    });
    assert.ok(opened.ok);
    if (!opened.ok) return;

    const salesOps = createMemorySalesOpsPort({
      store,
      workflow: wf,
      eventBus: bus,
    });

    const result = await handleGrowthAutomationEvent(
      {
        id: "evt-004-1",
        type: "GrowthOpportunityOpened",
        tenantId,
        payload: { oportunidadId: opened.oportunidad._id },
        userId: "visitor",
      },
      {
        automationStore,
        opportunityStore: store,
        salesOps,
      }
    );

    const executed = result.outcomes.filter((o) => o.status === "executed");
    assert.equal(executed.length, 1);

    const updated = await store.findById(tenantId, opened.oportunidad._id);
    assert.equal(updated?.nextAction?.summary, "Llamar para confirmar interés");

    const nextEvt = bus.events.find((e) => e.type === "GrowthNextActionSet");
    assert.ok(nextEvt);
    assert.equal(nextEvt?.userId, GROWTH_AUTOMATION_SYSTEM_ACTOR);

    const disabled = await setGrowthAutomationActive(automationStore, {
      tenantId,
      automationId: created.automation._id,
      active: false,
      actor: { userId: "u1" },
    });
    assert.ok(disabled.ok);
    if (disabled.ok) assert.equal(disabled.automation.status, "disabled");

    const other = await handleGrowthAutomationEvent(
      {
        id: "evt-004-b",
        type: "GrowthOpportunityOpened",
        tenantId: "tenant-b",
        payload: { oportunidadId: opened.oportunidad._id },
      },
      {
        automationStore,
        opportunityStore: store,
        salesOps,
      }
    );
    assert.equal(other.outcomes.length, 0);
  });
});
