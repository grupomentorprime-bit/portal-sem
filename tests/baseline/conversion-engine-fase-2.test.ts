/**
 * Conversion Engine fase 2 — pruebas de aceptación del contrato.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { executeAutomationActionStep } from "../../src/core/growth/automations/execute-action";
import { evaluateAutomationConditionRule } from "../../src/core/growth/automations/conditions";
import { assignGrowthOpportunityOwner } from "../../src/core/growth/assign-owner";
import { applyCustomFieldPatch, presentFunnelFieldRows } from "../../src/core/growth/custom-fields";
import { recordGrowthActivity } from "../../src/core/growth/activity";
import {
  addGrowthFunnelFieldOption,
  createGrowthFunnelField,
  deactivateGrowthFunnelField,
  patchGrowthFunnelFieldOption,
  renameGrowthFunnelField,
  reorderGrowthFunnelFields,
} from "../../src/core/growth/funnel-fields";
import { createMemoryFunnelDirectory } from "../../src/core/growth/funnel-memory";
import { createGrowthFunnel } from "../../src/core/growth/funnels";
import { clearGrowthNextAction, setGrowthNextAction } from "../../src/core/growth/next-action";
import { createMemoryGrowthOpportunityStore } from "../../src/core/growth/opportunity-memory-store";
import {
  GROWTH_STALE_DAY_MS,
  growthPriorityBand,
} from "../../src/core/growth/priority";
import {
  backfillFunnelPhase2,
  backfillOpportunityPhase2,
  backfillSpaceConfigPhase2,
} from "../../src/core/growth/phase2-backfill";
import {
  countGrowthBands,
  countUnassignedOpportunities,
  growthWorkRelation,
  myGrowthWork,
  priorityGrowthQueue,
} from "../../src/core/growth/work-queue";
import { GROWTH_ACTIVIDAD_VENTAS_KINDS } from "../../src/lib/growth/actividad-view";
import { compareGrowthPriority } from "../../src/core/growth/priority";
import { filterAdminNavGroups } from "../../src/lib/admin/nav-access";
import type { GrowthActivity, GrowthOportunidad, GrowthSpaceConfig } from "../../src/core/growth/types";
import type { GrowthFunnel } from "../../src/core/growth/funnel-types";

const NOW = new Date("2026-10-18T12:00:00.000Z");
const DAY = GROWTH_STALE_DAY_MS;

function opportunity(patch: Partial<GrowthOportunidad> = {}): GrowthOportunidad {
  return {
    _id: patch._id ?? "opp-1",
    tenantId: patch.tenantId ?? "space-a",
    personaId: patch.personaId ?? "persona-1",
    typeKey: "inquiry",
    subjectType: "form",
    origin: {
      kind: "form",
      sourceCollection: "experience_form_submissions",
      sourceId: "sub-1",
      capturedAt: "2026-10-01T00:00:00.000Z",
    },
    status: patch.status ?? "open",
    funnelKey: patch.funnelKey ?? "default",
    organizationId: null,
    source: {
      sourceCollection: "experience_form_submissions",
      sourceId: "sub-1",
    },
    workflowInstanceId: "wf-1",
    nextAction: patch.nextAction === undefined ? null : patch.nextAction,
    openedAt: patch.openedAt ?? "2026-10-01T00:00:00.000Z",
    updatedAt: patch.updatedAt ?? "2026-10-10T00:00:00.000Z",
    ownerUserId: patch.ownerUserId,
    customFields: patch.customFields,
    lastActivityAt: patch.lastActivityAt,
  };
}

describe("Conversion Engine fase 2", () => {
  it("1. asignar, reasignar y quitar conserva la oportunidad y agrega actividad", async () => {
    const store = createMemoryGrowthOpportunityStore();
    const original = opportunity({
      nextAction: {
        summary: "Llamar",
        kind: "contact",
        setAt: "2026-10-02T00:00:00.000Z",
      },
    });
    await store.insert(original);
    const previous = await recordGrowthActivity(store, {
      tenantId: original.tenantId,
      personaId: original.personaId,
      oportunidadId: original._id,
      kind: "note",
      summary: "Nota vieja",
      occurredAt: "2026-10-02T00:00:00.000Z",
    });
    assert.equal(previous.ok, true);
    const members = new Set(["ana", "bruno"]);
    const isMember = async (_tenant: string, userId: string) => members.has(userId);

    const assigned = await assignGrowthOpportunityOwner(store, {
      tenantId: "space-a",
      oportunidadId: original._id,
      actorUserId: "ana",
      ownerUserId: "ana",
      now: "2026-10-18T12:00:00.000Z",
      isMember,
    });
    assert.equal(assigned.ok, true);
    if (!assigned.ok) return;
    assert.equal(assigned.oportunidad._id, original._id);
    assert.equal(assigned.oportunidad.personaId, original.personaId);
    assert.equal(assigned.oportunidad.funnelKey, "default");
    assert.equal(assigned.oportunidad.status, "open");
    assert.equal(assigned.oportunidad.nextAction?.summary, "Llamar");
    assert.equal(assigned.activity?.kind, "opportunity_assigned");
    assert.deepEqual(assigned.activity?.payload, { fromUserId: null, toUserId: "ana" });

    const reassigned = await assignGrowthOpportunityOwner(store, {
      tenantId: "space-a",
      oportunidadId: original._id,
      actorUserId: "ana",
      ownerUserId: "bruno",
      now: "2026-10-18T13:00:00.000Z",
      isMember,
    });
    assert.equal(reassigned.ok, true);
    const cleared = await assignGrowthOpportunityOwner(store, {
      tenantId: "space-a",
      oportunidadId: original._id,
      actorUserId: "ana",
      ownerUserId: null,
      now: "2026-10-18T14:00:00.000Z",
      isMember,
    });
    assert.equal(cleared.ok, true);
    if (!cleared.ok) return;
    assert.equal(cleared.oportunidad.ownerUserId, undefined);
    assert.equal(cleared.oportunidad.nextAction?.summary, "Llamar");
    const notes = [...store.activities.values()].filter((item) => item.kind === "note");
    assert.equal(notes.length, 1);
    assert.equal(notes[0]?.summary, "Nota vieja");
    const assignments = [...store.activities.values()].filter(
      (item) => item.kind === "opportunity_assigned"
    );
    assert.equal(assignments.length, 3);
    assert.equal(new Set(assignments.map((item) => item.ingestKey)).size, 3);
  });

  it("2. el destino debe ser del mismo Espacio", async () => {
    const store = createMemoryGrowthOpportunityStore();
    await store.insert(opportunity());
    await store.insert(opportunity({ _id: "opp-b", tenantId: "space-b", ownerUserId: "ana" }));
    const rejected = await assignGrowthOpportunityOwner(store, {
      tenantId: "space-a",
      oportunidadId: "opp-1",
      actorUserId: "ana",
      ownerUserId: "externo",
      isMember: async (tenantId, userId) => tenantId === "space-a" && userId === "ana",
    });
    assert.deepEqual(rejected, { ok: false, reason: "not_member" });
    const stored = await store.findById("space-a", "opp-1");
    assert.equal(stored?.ownerUserId, undefined);
    const other = await store.findById("space-b", "opp-b");
    assert.equal(other?.ownerUserId, "ana");
    assert.equal(await store.findById("space-a", "opp-b"), null);
  });

  it("3. cerrar la acción deja al responsable y quitarlo deja la acción", async () => {
    const store = createMemoryGrowthOpportunityStore();
    await store.insert(
      opportunity({
        ownerUserId: "ana",
        nextAction: {
          summary: "Llamar",
          kind: "contact",
          setAt: "2026-10-02T00:00:00.000Z",
          assigneeUserId: "bruno",
        },
      })
    );
    const cleared = await clearGrowthNextAction(store, {
      tenantId: "space-a",
      oportunidadId: "opp-1",
      actorUserId: "ana",
    });
    assert.equal(cleared.ok, true);
    if (!cleared.ok) return;
    assert.equal(cleared.oportunidad.ownerUserId, "ana");
    assert.equal(cleared.oportunidad.nextAction, null);

    await setGrowthNextAction(store, {
      tenantId: "space-a",
      oportunidadId: "opp-1",
      summary: "Escribir",
      actorUserId: "ana",
    });
    const unowned = await assignGrowthOpportunityOwner(store, {
      tenantId: "space-a",
      oportunidadId: "opp-1",
      actorUserId: "ana",
      ownerUserId: null,
      isMember: async () => true,
    });
    assert.equal(unowned.ok, true);
    if (!unowned.ok) return;
    assert.equal(unowned.oportunidad.nextAction?.summary, "Escribir");
    assert.equal(unowned.oportunidad.ownerUserId, undefined);
  });

  it("4 y 5. Mi trabajo es una fila por oportunidad abierta del usuario", () => {
    const mine = opportunity({
      _id: "mia",
      ownerUserId: "ana",
      nextAction: {
        summary: "Llamar",
        kind: "contact",
        setAt: "2026-10-01T00:00:00.000Z",
        dueAt: "2026-10-17T00:00:00.000Z",
        assigneeUserId: "ana",
      },
    });
    const assignedAction = opportunity({
      _id: "accion",
      ownerUserId: "bruno",
      openedAt: "2026-10-03T00:00:00.000Z",
      nextAction: {
        summary: "Revisar",
        kind: "review",
        setAt: "2026-10-04T00:00:00.000Z",
        assigneeUserId: "ana",
      },
      lastActivityAt: "2026-10-17T00:00:00.000Z",
    });
    const loose = opportunity({ _id: "suelta" });
    const closed = opportunity({ _id: "cerrada", status: "won", ownerUserId: "ana" });
    const otherSpace = opportunity({ _id: "otra", tenantId: "space-b", ownerUserId: "ana" });
    const rows = myGrowthWork(
      [mine, mine, assignedAction, loose, closed, otherSpace],
      "ana",
      "space-a",
      NOW,
      7
    );
    const ids = [...rows.overdue, ...rows.unfollowed, ...rows.stale, ...rows.current].map(
      (item) => item._id
    );
    assert.deepEqual(ids.filter((id) => id === "mia"), ["mia"]);
    assert.equal(growthWorkRelation(mine, "ana"), "both");
    assert.equal(growthWorkRelation(assignedAction, "ana"), "action");
    assert.ok(ids.includes("accion"));
    assert.equal(ids.includes("suelta"), false);
    assert.equal(ids.includes("cerrada"), false);
    assert.equal(ids.includes("otra"), false);
    assert.equal(countUnassignedOpportunities([loose, mine]), 1);
  });

  it("6. la banda es única y una oportunidad final no entra", () => {
    const overdue = opportunity({
      nextAction: {
        summary: "Llamar",
        kind: "contact",
        setAt: "2026-09-01T00:00:00.000Z",
        dueAt: "2026-10-01T00:00:00.000Z",
      },
      lastActivityAt: "2026-09-01T00:00:00.000Z",
    });
    assert.equal(growthPriorityBand(overdue, NOW, 7), "overdue");
    const bare = opportunity({ lastActivityAt: "2026-09-01T00:00:00.000Z" });
    assert.equal(growthPriorityBand(bare, NOW, 7), "unfollowed");
    const stale = opportunity({
      nextAction: {
        summary: "Esperar",
        kind: "wait",
        setAt: "2026-10-01T00:00:00.000Z",
        dueAt: "2026-10-30T00:00:00.000Z",
      },
      lastActivityAt: "2026-10-01T00:00:00.000Z",
    });
    assert.equal(growthPriorityBand(stale, NOW, 7), "stale");
    assert.equal(growthPriorityBand({ ...overdue, status: "won" }, NOW, 7), null);
    assert.equal(growthPriorityBand({ ...bare, status: "lost" }, NOW, 7), null);
  });

  it("7. el umbral de 7 días y el movimiento sacan de estancada", async () => {
    const future = {
      summary: "Llamar",
      kind: "contact" as const,
      setAt: "2026-10-01T00:00:00.000Z",
      dueAt: "2026-10-30T00:00:00.000Z",
    };
    const stale = opportunity({
      nextAction: future,
      lastActivityAt: new Date(NOW.getTime() - 7 * DAY).toISOString(),
    });
    assert.equal(growthPriorityBand(stale, NOW, 7), "stale");
    const fresh = opportunity({
      nextAction: future,
      lastActivityAt: new Date(NOW.getTime() - 7 * DAY + 1).toISOString(),
    });
    assert.equal(growthPriorityBand(fresh, NOW, 7), "current");

    const store = createMemoryGrowthOpportunityStore();
    await store.insert(stale);
    await recordGrowthActivity(store, {
      tenantId: "space-a",
      personaId: "persona-1",
      oportunidadId: "opp-1",
      kind: "note",
      summary: "Nota",
      occurredAt: NOW.toISOString(),
    });
    const moved = await store.findById("space-a", "opp-1");
    assert.equal(growthPriorityBand(moved!, NOW, 7), "current");
  });

  it("8. filtros, conteos y orden de Kanban usan la misma prioridad", () => {
    const overdue = opportunity({
      _id: "vencida",
      updatedAt: "2026-10-18T00:00:00.000Z",
      nextAction: {
        summary: "Llamar",
        kind: "contact",
        setAt: "2026-10-01T00:00:00.000Z",
        dueAt: "2026-10-10T00:00:00.000Z",
      },
    });
    const current = opportunity({
      _id: "al-dia",
      updatedAt: "2026-10-18T11:00:00.000Z",
      lastActivityAt: "2026-10-18T11:00:00.000Z",
      nextAction: {
        summary: "Esperar",
        kind: "wait",
        setAt: "2026-10-18T11:00:00.000Z",
        dueAt: "2026-10-20T00:00:00.000Z",
      },
    });
    const counts = countGrowthBands([overdue, current], NOW, 7);
    const queue = priorityGrowthQueue([current, overdue], NOW, 7, 10);
    assert.equal(counts.overdue, 1);
    assert.equal(counts.current, 1);
    assert.equal(queue[0]?._id, "vencida");
    assert.equal(compareGrowthPriority(overdue, current, NOW, 7) < 0, true);
    assert.equal(overdue.status, current.status);
  });

  it("9. crear, renombrar, reordenar y desactivar un campo conserva valores", async () => {
    const directory = createMemoryFunnelDirectory();
    const created = await createGrowthFunnel(directory, {
      tenantId: "space-a",
      key: "ventas",
      name: "Ventas",
    });
    assert.equal(created.ok, true);
    const first = await createGrowthFunnelField(directory, {
      tenantId: "space-a",
      funnelKey: "ventas",
      key: "cargo",
      label: "Cargo",
      type: "text",
    });
    assert.equal(first.ok, true);
    await createGrowthFunnelField(directory, {
      tenantId: "space-a",
      funnelKey: "ventas",
      key: "origen",
      label: "Origen",
      type: "text",
    });
    const renamed = await renameGrowthFunnelField(directory, {
      tenantId: "space-a",
      funnelKey: "ventas",
      fieldKey: "cargo",
      label: "Cargo actual",
    });
    assert.equal(renamed.ok, true);
    if (!renamed.ok) return;
    assert.equal(renamed.funnel.fields?.find((field) => field.key === "cargo")?.type, "text");
    const moved = await reorderGrowthFunnelFields(directory, {
      tenantId: "space-a",
      funnelKey: "ventas",
      fieldKey: "origen",
      direction: "up",
    });
    assert.equal(moved.ok, true);
    if (!moved.ok) return;
    assert.equal(moved.funnel.fields?.[0]?.key, "origen");
    const reused = await createGrowthFunnelField(directory, {
      tenantId: "space-a",
      funnelKey: "ventas",
      key: "cargo",
      label: "Otro",
      type: "number",
    });
    assert.deepEqual(reused, { ok: false, reason: "duplicate_key" });
    const off = await deactivateGrowthFunnelField(directory, {
      tenantId: "space-a",
      funnelKey: "ventas",
      fieldKey: "cargo",
    });
    assert.equal(off.ok, true);
    const fields = moved.funnel.fields!.map((field) =>
      field.key === "cargo" ? { ...field, active: false, label: "Cargo actual" } : field
    );
    const rows = presentFunnelFieldRows(fields, { cargo: "Directora" });
    assert.equal(rows.find((row) => row.key === "cargo")?.readOnly, true);
    assert.equal(presentFunnelFieldRows(fields, {}).some((row) => row.key === "cargo"), false);
    const values = { cargo: "Directora" };
    const patched = applyCustomFieldPatch(fields, values, { cargo: "Otra" });
    assert.equal(patched.ok, true);
    if (!patched.ok) return;
    assert.equal(patched.customFields.cargo, "Directora");
  });

  it("9b. agregar, renombrar y desactivar una opción conserva la clave y el valor", async () => {
    const directory = createMemoryFunnelDirectory();
    await createGrowthFunnel(directory, { tenantId: "space-a", key: "ventas", name: "Ventas" });
    const created = await createGrowthFunnelField(directory, {
      tenantId: "space-a",
      funnelKey: "ventas",
      key: "canal",
      label: "Canal",
      type: "select",
      options: [{ key: "web", label: "Web" }],
    });
    assert.equal(created.ok, true);
    const added = await addGrowthFunnelFieldOption(directory, {
      tenantId: "space-a",
      funnelKey: "ventas",
      fieldKey: "canal",
      key: "referido",
      label: "Referido",
    });
    assert.equal(added.ok, true);
    if (!added.ok) return;
    const renamed = await patchGrowthFunnelFieldOption(directory, {
      tenantId: "space-a",
      funnelKey: "ventas",
      fieldKey: "canal",
      optionKey: "referido",
      label: "Referido interno",
    });
    assert.equal(renamed.ok, true);
    const off = await patchGrowthFunnelFieldOption(directory, {
      tenantId: "space-a",
      funnelKey: "ventas",
      fieldKey: "canal",
      optionKey: "web",
      active: false,
    });
    assert.equal(off.ok, true);
    if (!off.ok) return;
    const options = off.funnel.fields?.find((field) => field.key === "canal")?.options ?? [];
    assert.deepEqual(
      options.map((option) => ({ key: option.key, label: option.label, active: option.active })),
      [
        { key: "web", label: "Web", active: false },
        { key: "referido", label: "Referido interno", active: true },
      ]
    );
    const rows = presentFunnelFieldRows(off.funnel.fields ?? [], { canal: "web" });
    const row = rows.find((item) => item.key === "canal");
    assert.equal(row?.value, "web");
    assert.equal(row?.options.find((option) => option.key === "web")?.label, "Web");
    assert.equal(row?.options.find((option) => option.key === "web")?.active, false);
    const empty = presentFunnelFieldRows(off.funnel.fields ?? [], {});
    assert.equal(
      empty.find((item) => item.key === "canal")?.options.some((option) => option.key === "web"),
      false
    );
  });

  it("10. el alta no exige campos y el detalle marca incompleto sin bloquear", () => {
    const opened = opportunity();
    assert.equal(opened.ownerUserId, undefined);
    assert.equal(opened.customFields, undefined);
    const fields = [
      {
        key: "cargo",
        label: "Cargo",
        type: "text" as const,
        required: true,
        position: 0,
        active: true,
      },
    ];
    const saved = applyCustomFieldPatch(fields, {}, { cargo: "" });
    assert.equal(saved.ok, true);
    if (!saved.ok) return;
    assert.deepEqual(saved.incomplete, ["cargo"]);
    const tooLong = applyCustomFieldPatch(fields, {}, { cargo: "x".repeat(501) });
    assert.equal(tooLong.ok, false);
  });

  it("11. automatización de acción vencida y de responsable", async () => {
    const store = createMemoryGrowthOpportunityStore();
    await store.insert(opportunity());
    const members = new Set(["ana"]);
    const set = await setGrowthNextAction(store, {
      tenantId: "space-a",
      oportunidadId: "opp-1",
      summary: "Llamar",
      dueAt: "2026-10-01T00:00:00.000Z",
      actorUserId: "growth-automation",
    });
    assert.equal(set.ok, true);
    if (!set.ok) return;
    assert.equal(growthPriorityBand(set.oportunidad, NOW, 7), "overdue");

    const assigned = await executeAutomationActionStep({
      tenantId: "space-a",
      oportunidadId: "opp-1",
      step: { kind: "action", action: "salesAssignOwner", userId: "ana" },
      salesOps: {
        async salesTransitionOpportunity() {
          return { ok: false, reason: "unused" };
        },
        async salesRecordFollowUp() {
          return { ok: false, reason: "unused" };
        },
        async salesSetNextAction() {
          return { ok: false, reason: "unused" };
        },
        async salesClearNextAction() {
          return { ok: false, reason: "unused" };
        },
        async salesAssignOwner(input) {
          return assignGrowthOpportunityOwner(store, {
            tenantId: input.tenantId,
            oportunidadId: input.oportunidadId,
            actorUserId: input.actor.userId,
            ownerUserId: input.userId,
            isMember: async (_tenant, userId) => members.has(userId),
          });
        },
      },
    });
    assert.equal(assigned.ok, true);
    const owned = await store.findById("space-a", "opp-1");
    assert.equal(owned?.ownerUserId, "ana");
    const before = structuredClone(owned);
    const foreign = await executeAutomationActionStep({
      tenantId: "space-a",
      oportunidadId: "opp-1",
      step: { kind: "action", action: "salesAssignOwner", userId: "ajeno" },
      salesOps: {
        async salesTransitionOpportunity() {
          return { ok: false, reason: "unused" };
        },
        async salesRecordFollowUp() {
          return { ok: false, reason: "unused" };
        },
        async salesSetNextAction() {
          return { ok: false, reason: "unused" };
        },
        async salesClearNextAction() {
          return { ok: false, reason: "unused" };
        },
        async salesAssignOwner(input) {
          return assignGrowthOpportunityOwner(store, {
            tenantId: input.tenantId,
            oportunidadId: input.oportunidadId,
            actorUserId: input.actor.userId,
            ownerUserId: input.userId,
            isMember: async (_tenant, userId) => members.has(userId),
          });
        },
      },
    });
    assert.equal(foreign.ok, false);
    const after = await store.findById("space-a", "opp-1");
    assert.equal(after?.ownerUserId, before?.ownerUserId);
    assert.equal(after?.status, before?.status);
    assert.equal(after?.nextAction?.summary, before?.nextAction?.summary);
  });

  it("12. condiciones previas siguen y la asignación entra a Actividad", () => {
    const item = opportunity({
      status: "open",
      nextAction: {
        summary: "Llamar",
        kind: "contact",
        setAt: "2026-10-01T00:00:00.000Z",
      },
    });
    assert.equal(
      evaluateAutomationConditionRule(item, { field: "status", op: "eq", value: "open" }),
      true
    );
    assert.equal(
      evaluateAutomationConditionRule(item, { field: "nextAction", op: "exists" }),
      true
    );
    assert.equal(
      evaluateAutomationConditionRule(item, { field: "owner", op: "absent" }),
      true
    );
    assert.ok(GROWTH_ACTIVIDAD_VENTAS_KINDS.includes("opportunity_assigned"));
    const previous: GrowthActivity = {
      _id: "act-1",
      tenantId: "space-a",
      personaId: "persona-1",
      kind: "note",
      summary: "Nota vieja",
      occurredAt: "2026-10-01T00:00:00.000Z",
    };
    assert.equal(previous.summary, "Nota vieja");
  });

  it("13. navegación CRM y compatibilidad de documentos previos", () => {
    const groups = filterAdminNavGroups(
      [
        "cms.pages.read",
        "growth.people.view",
        "growth.sales.read",
        "growth.funnels.manage",
      ],
      false,
      []
    );
    const conversion = groups.find((group) => group.id === "conversion");
    assert.deepEqual(
      conversion?.items.map((item) => item.label),
      [
        "Panel comercial",
        "Oportunidades",
        "Personas",
        "Embudos",
        "Mi trabajo",
        "Mensajes",
        "Actividad",
      ]
    );
    assert.deepEqual(
      conversion?.items.map((item) => item.href),
      [
        "/admin/conversion",
        "/admin/ventas",
        "/admin/personas",
        "/admin/ventas/embudos",
        "/admin/ventas/mi-trabajo",
        "/admin/mensajes",
        "/admin/actividad",
      ]
    );
    assert.equal(groups.some((group) => group.id === "dashboard"), true);
    const legacy = opportunity({ funnelKey: "default", status: "open" });
    const filled = backfillOpportunityPhase2(legacy, null);
    assert.equal(filled.ownerUserId, undefined);
    assert.equal(filled.customFields, undefined);
    assert.equal(filled.lastActivityAt, legacy.updatedAt);
    assert.equal(filled.status, "open");
    assert.equal(filled.funnelKey, "default");
    const funnel: GrowthFunnel = {
      _id: "f",
      tenantId: "space-a",
      key: "default",
      name: "Ventas",
      status: "active",
      isDefault: true,
      workflowDefinitionKey: "growth.opportunity.default",
      createdAt: legacy.openedAt,
      updatedAt: legacy.updatedAt,
    };
    assert.deepEqual(backfillFunnelPhase2(funnel).fields, []);
    const config = {
      _id: "c",
      tenantId: "space-a",
      opportunityTypes: [],
      createdAt: legacy.openedAt,
      updatedAt: legacy.updatedAt,
    } satisfies GrowthSpaceConfig;
    assert.equal(backfillSpaceConfigPhase2(config).staleAfterDays, 7);
  });
});
