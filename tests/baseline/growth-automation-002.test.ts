/**
 * OT-GROWTH-AUTOMATION-002 — persistencia versionada + IAM (sin ejecución).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createGrowthAutomation,
  createMemoryGrowthAutomationStore,
  getGrowthAutomation,
  listGrowthAutomations,
  publishGrowthAutomation,
  setGrowthAutomationActive,
  tryMutatePublishedAutomationVersion,
  updateGrowthAutomationDraft,
  validateAutomationSteps,
  GROWTH_AUTOMATION_SYSTEM_ACTOR,
} from "../../src/core/growth/automations";
import { PERMISSIONS } from "../../src/core/identity/permissions/registry";
import { PERMISSION_MODULES } from "../../src/core/identity/permissions/catalog";
import { PORTAL_TENANT_ROLES } from "../../src/core/identity/roles/defaults";
import { ROLE_PERMISSION_TEMPLATES } from "../../src/core/identity/permissions/role-templates";
import { ROLE_CODES } from "../../src/core/identity/roles/codes";
import {
  granularToLegacyPermissions,
  legacyPermissionIdsToMap,
} from "../../src/core/identity/permissions/resolver";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

const VALID_STEPS = [
  {
    kind: "trigger",
    eventTypes: ["GrowthOpportunityOpened"],
  },
  {
    kind: "condition",
    rules: [{ field: "status", op: "eq", value: "open" }],
  },
  {
    kind: "action",
    action: "salesSetNextAction",
    summary: "Llamar al interesado",
  },
];

describe("OT-GROWTH-AUTOMATION-002 — superficie e IAM", () => {
  it("rutas API y módulo core existen", () => {
    for (const rel of [
      "src/core/growth/automations/index.ts",
      "src/lib/growth/automations.ts",
      "src/app/api/growth/automations/route.ts",
      "src/app/api/growth/automations/[id]/route.ts",
      "src/app/api/growth/automations/[id]/publish/route.ts",
      "src/app/api/growth/automations/[id]/active/route.ts",
      "src/core/migrations/016-growth-automations.ts",
    ]) {
      assert.ok(existsSync(resolve(process.cwd(), rel)), rel);
    }
  });

  it("permisos growth.automations en registry + catálogo + roles comerciales", () => {
    assert.ok(PERMISSIONS["growth.automations.view"]);
    assert.ok(PERMISSIONS["growth.automations.manage"]);
    const growth = PERMISSION_MODULES.find((m) => m.id === "growth");
    assert.ok(growth);
    assert.ok(
      growth?.permissions.some((p) => p.code === "growth.automations.view")
    );
    assert.ok(
      growth?.permissions.some((p) => p.code === "growth.automations.manage")
    );

    for (const code of [
      ROLE_CODES.SUPER_ADMIN,
      ROLE_CODES.INSTITUTION_ADMIN,
      ROLE_CODES.SUPPORT,
      ROLE_CODES.ADMISSIONS,
    ]) {
      const role = PORTAL_TENANT_ROLES.find((r) => r.code === code);
      assert.ok(role?.permissionIds.includes("growth.automations.view"), code);
      assert.ok(role?.permissionIds.includes("growth.automations.manage"), code);
      assert.equal(
        ROLE_PERMISSION_TEMPLATES[code]["growth.automations.view"],
        true
      );
      assert.equal(
        ROLE_PERMISSION_TEMPLATES[code]["growth.automations.manage"],
        true
      );
    }

    const map = legacyPermissionIdsToMap(["growth.automations.view"]);
    assert.equal(map["growth.automations.view"], true);
    const legacy = granularToLegacyPermissions({
      ...Object.fromEntries(
        Object.keys(ROLE_PERMISSION_TEMPLATES[ROLE_CODES.GUEST]).map((k) => [
          k,
          false,
        ])
      ),
      "growth.automations.view": true,
      "growth.automations.manage": true,
    });
    assert.ok(legacy.includes("growth.automations.view"));
    assert.ok(legacy.includes("growth.automations.manage"));
  });

  it("APIs exigen view/manage y no importan sales-ops ni ejecutan", () => {
    const listRoute = readSrc("src/app/api/growth/automations/route.ts");
    assert.match(listRoute, /growth\.automations\.view/);
    assert.match(listRoute, /growth\.automations\.manage/);

    const detail = readSrc("src/app/api/growth/automations/[id]/route.ts");
    assert.match(detail, /growth\.automations\.view/);
    assert.match(detail, /growth\.automations\.manage/);

    const publish = readSrc(
      "src/app/api/growth/automations/[id]/publish/route.ts"
    );
    assert.match(publish, /growth\.automations\.manage/);

    for (const rel of [
      "src/core/growth/automations/service.ts",
      "src/lib/growth/automations.ts",
      "src/app/api/growth/automations/route.ts",
      "src/app/api/growth/automations/[id]/route.ts",
      "src/app/api/growth/automations/[id]/publish/route.ts",
      "src/app/api/growth/automations/[id]/active/route.ts",
    ]) {
      const src = readSrc(rel);
      assert.doesNotMatch(src, /from ["']@\/lib\/growth\/sales-ops["']/);
      assert.doesNotMatch(src, /salesTransitionOpportunity\(/);
      assert.doesNotMatch(src, /salesRecordFollowUp\(/);
      assert.doesNotMatch(src, /subscribe\(|flushScheduled|runAutomation/);
    }

    assert.equal(GROWTH_AUTOMATION_SYSTEM_ACTOR, "growth-automation");
  });
});

describe("OT-GROWTH-AUTOMATION-002 — catálogo cerrado", () => {
  it("acepta Trigger → Condición → Acción del contrato", () => {
    const ok = validateAutomationSteps(VALID_STEPS);
    assert.equal(ok.ok, true);
  });

  it("rechaza trigger / condición / acción fuera de ADR-011", () => {
    const badTrigger = validateAutomationSteps([
      { kind: "trigger", eventTypes: ["CmsPagePublished"] },
      { kind: "action", action: "salesClearNextAction" },
    ]);
    assert.equal(badTrigger.ok, false);
    if (!badTrigger.ok) assert.equal(badTrigger.code, "invalid_trigger");

    const badCond = validateAutomationSteps([
      { kind: "trigger", eventTypes: ["GrowthPersonaUpserted"] },
      {
        kind: "condition",
        rules: [{ field: "message.replied", op: "eq", value: true }],
      },
      { kind: "action", action: "salesClearNextAction" },
    ]);
    assert.equal(badCond.ok, false);
    if (!badCond.ok) assert.equal(badCond.code, "invalid_condition");

    const badAction = validateAutomationSteps([
      { kind: "trigger", eventTypes: ["GrowthActivityRecorded"] },
      { kind: "action", action: "sendWhatsApp" },
    ]);
    assert.equal(badAction.ok, false);
    if (!badAction.ok) assert.equal(badAction.code, "invalid_action");
  });

  it("acepta WAIT tras acciones (runner AUTOMATION-005)", () => {
    const wait = validateAutomationSteps([
      { kind: "trigger", eventTypes: ["GrowthNextActionSet"] },
      { kind: "action", action: "salesClearNextAction" },
      { kind: "wait", durationMs: 3600000 },
      {
        kind: "action",
        action: "salesRecordFollowUp",
        followUpKind: "note",
        summary: "Continuar tras espera",
      },
    ]);
    assert.equal(wait.ok, true);
  });
});

describe("OT-GROWTH-AUTOMATION-002 — persistencia versionada e aislamiento", () => {
  it("tenant A no lee ni escribe Automatizaciones de tenant B", async () => {
    const store = createMemoryGrowthAutomationStore();
    const created = await createGrowthAutomation(store, {
      tenantId: "tenant-a",
      name: "Auto A",
      steps: VALID_STEPS,
      actor: { userId: "user-a" },
      now: "2026-09-06T12:00:00.000Z",
    });
    assert.equal(created.ok, true);
    if (!created.ok) throw new Error("create");

    const crossRead = await getGrowthAutomation(store, {
      tenantId: "tenant-b",
      automationId: created.automation._id,
    });
    assert.equal(crossRead.ok, false);

    const crossUpdate = await updateGrowthAutomationDraft(store, {
      tenantId: "tenant-b",
      automationId: created.automation._id,
      name: "Hacked",
      actor: { userId: "user-b" },
    });
    assert.equal(crossUpdate.ok, false);

    const listB = await listGrowthAutomations(store, "tenant-b");
    assert.equal(listB.length, 0);

    const listA = await listGrowthAutomations(store, "tenant-a");
    assert.equal(listA.length, 1);
    assert.equal(listA[0]?._id, created.automation._id);
  });

  it("versión publicada no se modifica; editar crea borrador nuevo", async () => {
    const store = createMemoryGrowthAutomationStore();
    const created = await createGrowthAutomation(store, {
      tenantId: "tenant-a",
      name: "Seguimiento open",
      steps: VALID_STEPS,
      actor: { userId: "user-a" },
      now: "2026-09-06T12:00:00.000Z",
    });
    assert.equal(created.ok, true);
    if (!created.ok) throw new Error("create");

    const published = await publishGrowthAutomation(store, {
      tenantId: "tenant-a",
      automationId: created.automation._id,
      actor: { userId: "user-a" },
      now: "2026-09-06T12:05:00.000Z",
    });
    assert.equal(published.ok, true);
    if (!published.ok) throw new Error("publish");
    assert.equal(published.version.status, "published");
    assert.equal(published.automation.status, "active");
    assert.equal(published.automation.publishedVersion, 1);
    assert.equal(published.automation.draftVersion, null);

    const mutate = await tryMutatePublishedAutomationVersion(store, {
      tenantId: "tenant-a",
      automationId: created.automation._id,
      version: 1,
      steps: [
        {
          kind: "trigger",
          eventTypes: ["GrowthHandoffRecorded"],
        },
        { kind: "action", action: "salesClearNextAction" },
      ],
      actor: { userId: "user-a" },
    });
    assert.equal(mutate.ok, false);
    if (!mutate.ok) assert.equal(mutate.code, "published_immutable");

    const afterPublish = await getGrowthAutomation(store, {
      tenantId: "tenant-a",
      automationId: created.automation._id,
    });
    assert.equal(afterPublish.ok, true);
    if (!afterPublish.ok) throw new Error("get");
    assert.equal(afterPublish.published?.steps[0]?.kind, "trigger");
    if (afterPublish.published?.steps[0]?.kind === "trigger") {
      assert.deepEqual(afterPublish.published.steps[0].eventTypes, [
        "GrowthOpportunityOpened",
      ]);
    }

    const edited = await updateGrowthAutomationDraft(store, {
      tenantId: "tenant-a",
      automationId: created.automation._id,
      steps: [
        {
          kind: "trigger",
          eventTypes: ["GrowthOpportunityTransitioned"],
        },
        {
          kind: "action",
          action: "salesRecordFollowUp",
          followUpKind: "note",
          summary: "Revisar transición",
        },
      ],
      actor: { userId: "user-a" },
      now: "2026-09-06T12:10:00.000Z",
    });
    assert.equal(edited.ok, true);
    if (!edited.ok) throw new Error("edit");
    assert.equal(edited.createdNewDraft, true);
    assert.equal(edited.version.version, 2);
    assert.equal(edited.version.status, "draft");
    assert.equal(edited.automation.publishedVersion, 1);
    assert.equal(edited.automation.draftVersion, 2);

    const still = await store.findVersion(
      "tenant-a",
      created.automation._id,
      1
    );
    assert.ok(still);
    assert.equal(still?.status, "published");
    if (still?.steps[0]?.kind === "trigger") {
      assert.deepEqual(still.steps[0].eventTypes, ["GrowthOpportunityOpened"]);
    }
  });

  it("crear/editar/publicar/activar no ejecuta ni toca sales-ops (solo persistencia)", async () => {
    const store = createMemoryGrowthAutomationStore();
    const created = await createGrowthAutomation(store, {
      tenantId: "tenant-a",
      name: "Sin runtime",
      steps: VALID_STEPS,
      actor: { userId: "user-a" },
    });
    assert.equal(created.ok, true);
    if (!created.ok) throw new Error("create");

    await updateGrowthAutomationDraft(store, {
      tenantId: "tenant-a",
      automationId: created.automation._id,
      name: "Sin runtime v2",
      actor: { userId: "user-a" },
    });

    const published = await publishGrowthAutomation(store, {
      tenantId: "tenant-a",
      automationId: created.automation._id,
      actor: { userId: "user-a" },
    });
    assert.equal(published.ok, true);
    if (!published.ok) throw new Error("publish");

    const disabled = await setGrowthAutomationActive(store, {
      tenantId: "tenant-a",
      automationId: created.automation._id,
      active: false,
      actor: { userId: "user-a" },
    });
    assert.equal(disabled.ok, true);
    if (!disabled.ok) throw new Error("disable");
    assert.equal(disabled.automation.status, "disabled");

    // Store solo contiene definición; no hay colección de runs/intentos.
    assert.equal(store.automations.size, 1);
    assert.equal(store.versions.size, 1);
  });

  it("migración 016 registrada en registry", () => {
    const registry = readSrc("src/core/migrations/registry.ts");
    assert.match(registry, /016-growth-automations/);
    assert.match(registry, /migration016GrowthAutomations/);
  });
});
