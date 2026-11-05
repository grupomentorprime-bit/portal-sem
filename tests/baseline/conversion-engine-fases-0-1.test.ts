import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  clearGrowthAssessmentPorts,
  getGrowthAssessmentPort,
  registerGrowthAssessmentPort,
} from "../../src/core/growth/assessment";
import { executeAutomationActionStep } from "../../src/core/growth/automations/execute-action";
import { evaluateAutomationConditionRule } from "../../src/core/growth/automations/conditions";
import { createMemoryFunnelDirectory } from "../../src/core/growth/funnel-memory";
import { isPipelineFollowUp } from "../../src/core/growth/funnel-stages";
import {
  archiveGrowthFunnel,
  availableGrowthFunnelTransitions,
  createGrowthFunnel,
  createGrowthFunnelStage,
  deactivateGrowthFunnelStage,
  ensureGrowthFunnelsForTenant,
  listGrowthFunnelStages,
  makeDefaultGrowthFunnel,
  renameGrowthFunnelStage,
  reorderGrowthFunnelStage,
} from "../../src/core/growth/funnels";
import { createMemoryGrowthOpportunityStore } from "../../src/core/growth/opportunity-memory-store";
import { createMemoryGrowthOpportunityWorkflow } from "../../src/core/growth/opportunity-workflow-port";
import { openGrowthOpportunity } from "../../src/core/growth/open-opportunity";
import { transitionGrowthOpportunity } from "../../src/core/growth/transition-opportunity";
import type { GrowthOportunidad } from "../../src/core/growth/types";
import {
  createCumpleGrowthAssessmentPort,
  toCumpleGrowthAssessmentView,
} from "../../src/sites/cumple/growth-assessment";
import { createMemoryCumpleDiagnosticoStore, recordCumpleDiagnostico } from "../../src/sites/cumple/diagnostico-record";
import { CUMPLE_FORM_ID, CUMPLE_TENANT_ID } from "../../src/sites/cumple/site";

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) files.push(...walk(path));
    else if (path.endsWith(".ts") || path.endsWith(".tsx")) files.push(path);
  }
  return files;
}

function payload(company = "Comercial Andes") {
  return {
    company,
    headcount: "50-99",
    contractors: "no",
    multiSite: "no",
    personalData: "no",
    comunicacionesComerciales: true,
    answers: {
      "ley-karin": { protocolo: "si", investigacion: "no", registro: "si" },
      sst: { matriz: "si", programa: "si", evidencia: "si" },
      laboral: { jornada: "si", reglamento: "si", registros: "si" },
    },
  };
}

function legacyOpportunity(patch: Partial<GrowthOportunidad> & Pick<GrowthOportunidad, "_id" | "tenantId" | "personaId">): GrowthOportunidad {
  return {
    typeKey: "inquiry",
    subjectType: "form",
    subjectId: "form-1",
    origin: {
      kind: "form",
      sourceCollection: "experience_form_submissions",
      sourceId: patch._id,
      capturedAt: "2026-10-01T00:00:00.000Z",
    },
    status: "active",
    funnelKey: "",
    organizationId: null,
    workflowInstanceId: `wf-${patch._id}`,
    nextAction: {
      summary: "Llamar",
      kind: "contact",
      setAt: "2026-10-01T00:00:00.000Z",
    },
    source: { sourceCollection: "experience_form_submissions", sourceId: patch._id },
    handoff: { delivered: false, adapter: "academico" },
    openedAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z",
    ...patch,
  };
}

describe("conversion engine fases 0 y 1", () => {
  it("1. el núcleo growth no importa CUMPLE", () => {
    const roots = ["src/core/growth", "src/lib/growth"];
    const offenders: string[] = [];
    for (const root of roots) {
      for (const file of walk(root)) {
        const source = readFileSync(file, "utf8");
        if (source.includes("@/sites/cumple") || source.includes("@/lib/cumple")) {
          offenders.push(file);
        }
      }
    }
    assert.deepEqual(offenders, []);
    const adapter = readFileSync("src/sites/cumple/growth-assessment.ts", "utf8");
    assert.match(adapter, /registerGrowthAssessmentPort\(CUMPLE_TENANT_ID/);
  });

  it("2. un Espacio sin adaptador no tiene evaluación", () => {
    clearGrowthAssessmentPorts();
    assert.equal(getGrowthAssessmentPort("espacio-sin-mentor"), null);
  });

  it("3. CUMPLE sigue mostrando diagnóstico, informe, materias y anteriores", async () => {
    clearGrowthAssessmentPorts();
    const store = createMemoryCumpleDiagnosticoStore();
    const first = await recordCumpleDiagnostico(store, {
      tenantId: CUMPLE_TENANT_ID,
      submissionId: "sub-a",
      formId: CUMPLE_FORM_ID,
      data: payload("Andes"),
      capturedAt: "2026-10-01T00:00:00.000Z",
      oportunidadId: "opp-1",
      now: "2026-10-01T00:00:00.000Z",
    });
    const second = await recordCumpleDiagnostico(store, {
      tenantId: CUMPLE_TENANT_ID,
      submissionId: "sub-b",
      formId: CUMPLE_FORM_ID,
      data: payload("Andes"),
      capturedAt: "2026-10-02T00:00:00.000Z",
      oportunidadId: "opp-1",
      now: "2026-10-02T00:00:00.000Z",
    });
    assert.equal(first.ok && second.ok, true);
    const port = createCumpleGrowthAssessmentPort(store);
    registerGrowthAssessmentPort(CUMPLE_TENANT_ID, port);
    assert.equal(getGrowthAssessmentPort("otro-espacio"), null);
    const view = await port.viewForOpportunity(CUMPLE_TENANT_ID, "opp-1");
    assert.ok(view);
    assert.match(view.reportPath ?? "", /^\/informe\//);
    assert.ok(view.items.some((item) => item.id === "ley-karin" && item.statusLabel));
    assert.equal(view.previousCount, 1);
    assert.equal(view.organizationName, "Andes");
    assert.equal(view.disclaimer.length > 0, true);
    const listed = await port.listForPersona(CUMPLE_TENANT_ID, "persona", ["opp-1"]);
    assert.equal(listed.length, 2);
    assert.equal(toCumpleGrowthAssessmentView([]), null);
  });

  it("4. el formulario CUMPLE planifica y persiste; otro formulario no", async () => {
    const store = createMemoryCumpleDiagnosticoStore();
    const port = createCumpleGrowthAssessmentPort(store);
    const plan = port.planFormCapture({ formId: CUMPLE_FORM_ID, data: payload() });
    assert.ok(plan);
    assert.match(plan.summary, /Revisar/);
    assert.equal(port.planFormCapture({ formId: "contacto", data: payload() }), null);
    const oportunidades = createMemoryGrowthOpportunityStore();
    await port.persistFormCapture({
      tenantId: CUMPLE_TENANT_ID,
      formId: "contacto",
      submissionId: "otro",
      data: payload(),
      createdAt: "2026-10-03T00:00:00.000Z",
      actividades: oportunidades,
      oportunidades,
    });
    assert.equal(store.all().length, 0);
    await port.persistFormCapture({
      tenantId: CUMPLE_TENANT_ID,
      formId: CUMPLE_FORM_ID,
      submissionId: "diag-1",
      data: payload(),
      createdAt: "2026-10-03T00:00:00.000Z",
      personaId: "p1",
      oportunidadId: "o1",
      actividades: oportunidades,
      oportunidades,
    });
    assert.equal(store.all().length, 1);
    assert.equal(store.all()[0]?.oportunidadId, "o1");
  });

  it("5 a 14. embudos, migración, etapas, vistas y compatibilidad", async () => {
    const store = createMemoryGrowthOpportunityStore();
    const workflow = createMemoryGrowthOpportunityWorkflow();
    const directory = createMemoryFunnelDirectory({
      opportunities: store.oportunidades,
      workflow,
    });
    const tenant = "espacio-a";
    const legacy = legacyOpportunity({
      _id: "opp-legacy",
      tenantId: tenant,
      personaId: "persona-1",
      status: "won",
      closedAt: "2026-10-02T00:00:00.000Z",
    });
    const before = {
      personaId: legacy.personaId,
      typeKey: legacy.typeKey,
      status: legacy.status,
      origin: legacy.origin,
      source: legacy.source,
      nextAction: legacy.nextAction,
      handoff: legacy.handoff,
      openedAt: legacy.openedAt,
      closedAt: legacy.closedAt,
      workflowInstanceId: legacy.workflowInstanceId,
    };
    await store.insert(legacy);
    store.oportunidades.get(`${tenant}::opp-legacy`)!.funnelKey = "";
    workflow.instances.set(legacy.workflowInstanceId, {
      tenantId: tenant,
      entityId: legacy._id,
      currentState: "won",
      definitionKey: "growth.opportunity",
      status: "completed",
      history: [
        { fromState: "open", toState: "open", at: "2026-10-01T00:00:00.000Z" },
        { fromState: "open", toState: "won", at: "2026-10-02T00:00:00.000Z" },
      ],
    });
    await store.recordActivity({
      _id: "act-1",
      tenantId: tenant,
      personaId: "persona-1",
      oportunidadId: legacy._id,
      kind: "opportunity_opened",
      summary: "Oportunidad abierta",
      occurredAt: "2026-10-01T00:00:00.000Z",
    });

    await ensureGrowthFunnelsForTenant(directory, tenant, "2026-10-17T00:00:00.000Z");
    const migrated = await store.findById(tenant, legacy._id);
    assert.ok(migrated);
    assert.equal(migrated.funnelKey, "default");
    assert.equal(migrated.organizationId, null);
    assert.equal(migrated._id, legacy._id);
    assert.deepEqual(
      {
        personaId: migrated.personaId,
        typeKey: migrated.typeKey,
        status: migrated.status,
        origin: migrated.origin,
        source: migrated.source,
        nextAction: migrated.nextAction,
        handoff: migrated.handoff,
        openedAt: migrated.openedAt,
        closedAt: migrated.closedAt,
        workflowInstanceId: migrated.workflowInstanceId,
      },
      before
    );
    assert.equal(store.activities.size, 1);
    const instance = workflow.instances.get(legacy.workflowInstanceId);
    assert.equal(instance?.definitionKey, "growth.opportunity.default");
    assert.equal(instance?.currentState, "won");
    assert.equal(instance?.history.length, 2);

    const stages = await listGrowthFunnelStages(directory, tenant, "default");
    assert.equal(stages?.find((stage) => stage.key === "open")?.label, "Abierta");
    assert.equal(stages?.find((stage) => stage.key === "active")?.label, "En seguimiento");
    const stuck = await transitionGrowthOpportunity(store, workflow, {
      tenantId: tenant,
      oportunidadId: legacy._id,
      toState: "active",
    });
    assert.equal(stuck.ok, false);

    const other = "espacio-b";
    await ensureGrowthFunnelsForTenant(directory, other);
    const activeOpp = await openGrowthOpportunity(store, workflow, {
      tenantId: other,
      personaId: "persona-c",
      typeKey: "conversion",
      subjectType: "none",
      origin: { kind: "manual", sourceCollection: "manual", sourceId: "m-1" },
      sourceCollection: "manual",
      sourceId: "m-1",
    });
    assert.equal(activeOpp.ok, true);
    if (!activeOpp.ok) return;
    await transitionGrowthOpportunity(store, workflow, {
      tenantId: other,
      oportunidadId: activeOpp.oportunidad._id,
      toState: "active",
    });
    const conditioned = await store.findById(other, activeOpp.oportunidad._id);
    assert.equal(conditioned?.status, "active");
    assert.equal(
      evaluateAutomationConditionRule(conditioned!, { field: "status", op: "eq", value: "active" }),
      true
    );
    const automated = await executeAutomationActionStep({
      tenantId: other,
      oportunidadId: activeOpp.oportunidad._id,
      step: { kind: "action", action: "salesTransitionOpportunity", toState: "won" },
      salesOps: {
        async salesTransitionOpportunity(input) {
          const result = await transitionGrowthOpportunity(store, workflow, {
            tenantId: input.tenantId,
            oportunidadId: input.oportunidadId,
            toState: input.toState,
            actorUserId: input.actor.userId,
          });
          if (!result.ok) return { ok: false, reason: result.reason, error: result.error };
          return {
            ok: true,
            oportunidad: result.oportunidad,
            activity: result.activity,
            fromState: result.fromState,
            toState: result.toState,
          };
        },
        async salesRecordFollowUp() {
          return { ok: false, reason: "not_found" };
        },
        async salesSetNextAction() {
          return { ok: false, reason: "not_found" };
        },
        async salesClearNextAction() {
          return { ok: false, reason: "not_found" };
        },
      },
    });
    assert.equal(automated.ok, true);
    assert.equal((await store.findById(other, activeOpp.oportunidad._id))?.status, "won");

    await ensureGrowthFunnelsForTenant(directory, other);
    const created = await createGrowthFunnelStage(directory, {
      tenantId: tenant,
      funnelKey: "default",
      key: "propuesta",
      label: "Propuesta",
    });
    assert.equal(created.ok, true);
    const otherStages = await listGrowthFunnelStages(directory, other, "default");
    assert.equal(otherStages?.some((stage) => stage.key === "propuesta"), false);
    assert.equal((await directory.listOpportunities(other)).some((item) => item.tenantId === tenant), false);

    const activitiesBeforeEdit = store.activities.size;
    const renamed = await renameGrowthFunnelStage(directory, {
      tenantId: tenant,
      funnelKey: "default",
      stageKey: "propuesta",
      label: "Propuesta comercial",
    });
    assert.equal(renamed.ok, true);
    if (renamed.ok) {
      assert.equal(renamed.stages.find((stage) => stage.key === "propuesta")?.label, "Propuesta comercial");
    }
    await reorderGrowthFunnelStage(directory, {
      tenantId: tenant,
      funnelKey: "default",
      stageKey: "propuesta",
      direction: "up",
    });
    const afterEdit = await store.findById(tenant, legacy._id);
    assert.equal(afterEdit?.status, "won");
    assert.equal(store.activities.size, activitiesBeforeEdit);
    const visible = await listGrowthFunnelStages(directory, tenant, "default");
    assert.equal(visible?.find((stage) => stage.key === "propuesta")?.label, "Propuesta comercial");

    const follow = await openGrowthOpportunity(store, workflow, {
      tenantId: tenant,
      personaId: "persona-2",
      typeKey: "inquiry",
      subjectType: "none",
      origin: { kind: "unknown", channel: "whatsapp", sourceCollection: "whatsapp", sourceId: "wa-1" },
      sourceCollection: "whatsapp",
      sourceId: "wa-1",
    });
    assert.equal(follow.ok && follow.oportunidad.status, "open");
    if (!follow.ok) return;
    await transitionGrowthOpportunity(store, workflow, {
      tenantId: tenant,
      oportunidadId: follow.oportunidad._id,
      toState: "propuesta",
    });
    const blockedInitial = await deactivateGrowthFunnelStage(directory, {
      tenantId: tenant,
      funnelKey: "default",
      stageKey: "open",
    });
    assert.equal(blockedInitial.ok, false);
    if (!blockedInitial.ok) assert.equal(blockedInitial.reason, "cannot_deactivate_initial");
    const blockedResult = await deactivateGrowthFunnelStage(directory, {
      tenantId: tenant,
      funnelKey: "default",
      stageKey: "won",
    });
    assert.equal(blockedResult.ok, false);
    const deactivated = await deactivateGrowthFunnelStage(directory, {
      tenantId: tenant,
      funnelKey: "default",
      stageKey: "active",
    });
    assert.equal(deactivated.ok, true);
    const onlyInitial = await deactivateGrowthFunnelStage(directory, {
      tenantId: tenant,
      funnelKey: "default",
      stageKey: "propuesta",
    });
    assert.equal(onlyInitial.ok, true);
    const lastActive = await deactivateGrowthFunnelStage(directory, {
      tenantId: tenant,
      funnelKey: "default",
      stageKey: "open",
    });
    assert.equal(lastActive.ok, false);
    const currentStages = await listGrowthFunnelStages(directory, tenant, "default");
    assert.ok(currentStages);
    const fromInactive = availableGrowthFunnelTransitions(currentStages, "active");
    assert.equal(fromInactive.some((item) => item.toState === "active"), false);
    assert.equal(fromInactive.some((item) => item.toState === "propuesta"), false);
    assert.equal(fromInactive.some((item) => item.toState === "won"), true);
    assert.equal(fromInactive.some((item) => item.toState === "open"), true);

    const secondFunnel = await createGrowthFunnel(directory, {
      tenantId: tenant,
      key: "admision",
      name: "Admisión",
    });
    assert.equal(secondFunnel.ok, true);
    const archivedDefault = await archiveGrowthFunnel(directory, { tenantId: tenant, key: "default" });
    assert.equal(archivedDefault.ok, false);
    if (!archivedDefault.ok) assert.equal(archivedDefault.reason, "default_required");
    await makeDefaultGrowthFunnel(directory, { tenantId: tenant, key: "admision" });
    const archivedBusy = await archiveGrowthFunnel(directory, { tenantId: tenant, key: "default" });
    assert.equal(archivedBusy.ok, false);
    if (!archivedBusy.ok) assert.equal(archivedBusy.reason, "open_opportunities");

    const listSource = readFileSync("src/components/admin/growth/VentasListClient.tsx", "utf8");
    assert.match(listSource, /function OpportunityMoveControl/);
    assert.match(listSource, /requestOpportunityTransition/);
    assert.equal(listSource.split("<OpportunityMoveControl").length - 1, 1);
    assert.match(listSource, /vista === "kanban"/);
    assert.match(listSource, /onMove\(item\.id, transition\.toState, transition\.label\)/);
    const moved = await transitionGrowthOpportunity(store, workflow, {
      tenantId: tenant,
      oportunidadId: follow.oportunidad._id,
      toState: "won",
    });
    assert.equal(moved.ok, true);
    if (moved.ok) assert.equal(moved.activity.kind, "opportunity_transitioned");

    const formOpen = await openGrowthOpportunity(store, workflow, {
      tenantId: other,
      personaId: "persona-b",
      typeKey: "inquiry",
      subjectType: "form",
      subjectId: "form-x",
      origin: { kind: "form", sourceCollection: "experience_form_submissions", sourceId: "f-1" },
      sourceCollection: "experience_form_submissions",
      sourceId: "f-1",
    });
    const formAgain = await openGrowthOpportunity(store, workflow, {
      tenantId: other,
      personaId: "persona-b",
      typeKey: "inquiry",
      subjectType: "form",
      subjectId: "form-x",
      origin: { kind: "form", sourceCollection: "experience_form_submissions", sourceId: "f-2" },
      sourceCollection: "experience_form_submissions",
      sourceId: "f-2",
    });
    assert.equal(formOpen.ok && formOpen.oportunidad.funnelKey, "default");
    assert.equal(formOpen.ok && formOpen.oportunidad.status, "open");
    assert.equal(formAgain.ok && formAgain.outcome, "reused");
    const whatsapp = await openGrowthOpportunity(store, workflow, {
      tenantId: other,
      personaId: "persona-b",
      typeKey: "inquiry",
      subjectType: "none",
      origin: { kind: "unknown", channel: "whatsapp", sourceCollection: "whatsapp", sourceId: "w-1" },
      sourceCollection: "whatsapp",
      sourceId: "w-1",
    });
    const whatsappAgain = await openGrowthOpportunity(store, workflow, {
      tenantId: other,
      personaId: "persona-b",
      typeKey: "inquiry",
      subjectType: "none",
      origin: { kind: "unknown", channel: "whatsapp", sourceCollection: "whatsapp", sourceId: "w-2" },
      sourceCollection: "whatsapp",
      sourceId: "w-2",
    });
    assert.equal(whatsapp.ok && whatsapp.oportunidad.status, "open");
    assert.equal(whatsapp.ok && whatsapp.oportunidad.funnelKey, "default");
    assert.equal(whatsappAgain.ok && whatsappAgain.outcome, "reused");

    const sample = [
      legacyOpportunity({ _id: "a", tenantId: tenant, personaId: "p", status: "active", funnelKey: "default" }),
      legacyOpportunity({ _id: "b", tenantId: tenant, personaId: "p", status: "active", funnelKey: "default" }),
      legacyOpportunity({ _id: "c", tenantId: tenant, personaId: "p", status: "open", funnelKey: "default" }),
      legacyOpportunity({ _id: "d", tenantId: tenant, personaId: "p", status: "won", funnelKey: "default" }),
      legacyOpportunity({ _id: "e", tenantId: tenant, personaId: "p", status: "lost", funnelKey: "default" }),
    ];
    const beforeFollow = sample.filter((item) => item.status === "active").length;
    const beforeWon = sample.filter((item) => item.status === "won").length;
    const beforeLost = sample.filter((item) => item.status === "lost").length;
    const initials = { default: "open" };
    const afterFollow = sample.filter((item) =>
      isPipelineFollowUp(item.status, item.funnelKey, initials)
    ).length;
    assert.equal(afterFollow, beforeFollow);
    assert.equal(sample.filter((item) => item.status === "won").length, beforeWon);
    assert.equal(sample.filter((item) => item.status === "lost").length, beforeLost);
    assert.equal(isPipelineFollowUp("propuesta", "default", initials), true);
  });
});
