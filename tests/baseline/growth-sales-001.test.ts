/**
 * OT-GROWTH-SALES-001 — Ventas V1 operativa sobre Growth Core.
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
  listAvailableGrowthOpportunityTransitions,
  openGrowthOpportunity,
  recordGrowthActivity,
  setGrowthNextAction,
  transitionGrowthOpportunity,
  upsertGrowthPersona,
} from "../../src/core/growth";
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

async function seedOpp(tenantId: string, email: string, sourceId: string) {
  const personas = createMemoryGrowthPersonaStore();
  const store = createMemoryGrowthOpportunityStore();
  const wf = createMemoryGrowthOpportunityWorkflow();
  const bus = createMemoryGrowthEventBus();

  const person = await upsertGrowthPersona(personas, {
    tenantId,
    email,
    displayName: email.split("@")[0],
    origin: {
      kind: "form",
      sourceCollection: "test",
      sourceId,
    },
    now: "2026-09-05T10:00:00.000Z",
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
      sourceId,
    },
    sourceCollection: "test",
    sourceId,
    now: "2026-09-05T10:01:00.000Z",
    eventBus: bus,
  });
  assert.equal(opened.ok, true);
  if (!opened.ok) throw new Error("open");

  return {
    personas,
    store,
    wf,
    bus,
    persona: person.persona,
    oportunidad: opened.oportunidad,
  };
}

describe("OT-GROWTH-SALES-001 — superficie y permisos", () => {
  it("rutas /admin/ventas y APIs growth existen", () => {
    for (const rel of [
      "src/app/admin/ventas/page.tsx",
      "src/app/admin/ventas/[id]/page.tsx",
      "src/app/api/growth/oportunidades/route.ts",
      "src/app/api/growth/oportunidades/[id]/route.ts",
      "src/app/api/growth/oportunidades/[id]/transition/route.ts",
      "src/app/api/growth/oportunidades/[id]/activities/route.ts",
      "src/app/api/growth/oportunidades/[id]/next-action/route.ts",
      "src/lib/growth/sales-ops.ts",
      "src/lib/growth/ventas-read.ts",
    ]) {
      assert.ok(existsSync(resolve(process.cwd(), rel)), rel);
    }
  });

  it("nav Ventas apunta a /admin/ventas con permisos growth.sales", () => {
    const nav = readSrc("src/lib/admin/nav-domains.ts");
    assert.match(nav, /href: "\/admin\/ventas"/);
    assert.match(nav, /growth\.sales\.read/);
    assert.doesNotMatch(
      nav,
      /id: "nav-ventas"[\s\S]{0,200}experience\.forms/
    );
  });

  it("permisos growth.sales en registry + catálogo + roles comerciales", () => {
    assert.ok(PERMISSIONS["growth.sales.read"]);
    assert.ok(PERMISSIONS["growth.sales.operate"]);
    const growth = PERMISSION_MODULES.find((m) => m.id === "growth");
    assert.ok(growth);
    assert.ok(growth?.permissions.some((p) => p.code === "growth.sales.view"));
    assert.ok(
      growth?.permissions.some((p) => p.code === "growth.sales.operate")
    );

    for (const code of [
      ROLE_CODES.SUPER_ADMIN,
      ROLE_CODES.INSTITUTION_ADMIN,
      ROLE_CODES.SUPPORT,
      ROLE_CODES.ADMISSIONS,
    ]) {
      const role = PORTAL_TENANT_ROLES.find((r) => r.code === code);
      assert.ok(role?.permissionIds.includes("growth.sales.read"), code);
      assert.ok(role?.permissionIds.includes("growth.sales.operate"), code);
      assert.equal(ROLE_PERMISSION_TEMPLATES[code]["growth.sales.view"], true);
      assert.equal(
        ROLE_PERMISSION_TEMPLATES[code]["growth.sales.operate"],
        true
      );
    }

    const map = legacyPermissionIdsToMap(["growth.sales.read"]);
    assert.equal(map["growth.sales.view"], true);
    const legacy = granularToLegacyPermissions({
      ...Object.fromEntries(
        Object.keys(ROLE_PERMISSION_TEMPLATES[ROLE_CODES.GUEST]).map((k) => [
          k,
          false,
        ])
      ),
      "growth.sales.view": true,
      "growth.sales.operate": true,
    });
    assert.ok(legacy.includes("growth.sales.read"));
    assert.ok(legacy.includes("growth.sales.operate"));
  });

  it("APIs exigen growth.sales y pasan actor de sesión (no growth-ingest)", () => {
    const transition = readSrc(
      "src/app/api/growth/oportunidades/[id]/transition/route.ts"
    );
    const activities = readSrc(
      "src/app/api/growth/oportunidades/[id]/activities/route.ts"
    );
    const nextAction = readSrc(
      "src/app/api/growth/oportunidades/[id]/next-action/route.ts"
    );
    const salesOps = readSrc("src/lib/growth/sales-ops.ts");
    assert.match(transition, /growth\.sales\.operate/);
    assert.match(transition, /ctx\.user\._id/);
    assert.match(activities, /growth\.sales\.operate/);
    assert.match(nextAction, /growth\.sales\.operate/);
    assert.match(salesOps, /actorUserId: input\.actor\.userId/);
    assert.match(transition, /actor: \{ userId: ctx\.user\._id \}/);
    assert.doesNotMatch(transition, /performedBy:\s*["']growth-ingest["']/);
  });

  it("no introduce crm_* ni segundo motor", () => {
    const salesOps = readSrc("src/lib/growth/sales-ops.ts");
    assert.match(salesOps, /transitionGrowthOpportunity/);
    assert.match(salesOps, /setGrowthNextAction/);
    assert.match(salesOps, /recordGrowthActivity/);
    assert.doesNotMatch(salesOps, /crm_/);
  });
});

describe("OT-GROWTH-SALES-001 — operaciones Core reutilizadas", () => {
  it("transición válida + actor humano + evento", async () => {
    const ctx = await seedOpp("space-a", "ventas@ex.com", "sales-1");
    const actor = "user-operator-42";
    const tr = await transitionGrowthOpportunity(ctx.store, ctx.wf, {
      tenantId: "space-a",
      oportunidadId: ctx.oportunidad._id,
      transitionId: "activate",
      actorUserId: actor,
      eventBus: ctx.bus,
    });
    assert.equal(tr.ok, true);
    if (!tr.ok) return;
    assert.equal(tr.toState, "active");
    assert.equal(tr.activity.actorUserId, actor);
    assert.notEqual(tr.activity.actorUserId, "growth-ingest");
    assert.ok(
      ctx.bus.events.some((e) => e.type === "GrowthOpportunityTransitioned")
    );
    assert.equal(
      ctx.bus.events.find((e) => e.type === "GrowthOpportunityTransitioned")
        ?.userId,
      actor
    );
  });

  it("transición inválida se rechaza", async () => {
    const ctx = await seedOpp("space-a", "bad@ex.com", "sales-bad");
    const bad = await transitionGrowthOpportunity(ctx.store, ctx.wf, {
      tenantId: "space-a",
      oportunidadId: ctx.oportunidad._id,
      toState: "won",
      actorUserId: "user-1",
      eventBus: ctx.bus,
    });
    assert.equal(bad.ok, false);
    if (bad.ok) return;
    assert.equal(bad.reason, "invalid_transition");
  });

  it("note/contact + set/clear próxima acción emiten eventos", async () => {
    const ctx = await seedOpp("space-a", "follow@ex.com", "sales-follow");
    const actor = "user-op-9";

    const note = await recordGrowthActivity(
      ctx.store,
      {
        tenantId: "space-a",
        personaId: ctx.persona._id,
        oportunidadId: ctx.oportunidad._id,
        kind: "note",
        summary: "Llamó y dejó mensaje",
        actorUserId: actor,
      },
      { eventBus: ctx.bus }
    );
    assert.equal(note.ok, true);
    if (!note.ok) return;
    assert.equal(note.activity.actorUserId, actor);

    const contact = await recordGrowthActivity(
      ctx.store,
      {
        tenantId: "space-a",
        personaId: ctx.persona._id,
        oportunidadId: ctx.oportunidad._id,
        kind: "contact",
        summary: "WhatsApp respondido",
        actorUserId: actor,
      },
      { eventBus: ctx.bus }
    );
    assert.equal(contact.ok, true);

    const set = await setGrowthNextAction(ctx.store, {
      tenantId: "space-a",
      oportunidadId: ctx.oportunidad._id,
      summary: "Rellamar mañana",
      actorUserId: actor,
      eventBus: ctx.bus,
    });
    assert.equal(set.ok, true);
    if (!set.ok) return;
    assert.equal(set.activity.actorUserId, actor);
    assert.ok(ctx.bus.events.some((e) => e.type === "GrowthNextActionSet"));
    assert.ok(ctx.bus.events.some((e) => e.type === "GrowthActivityRecorded"));

    const { clearGrowthNextAction } = await import("../../src/core/growth");
    const cleared = await clearGrowthNextAction(ctx.store, {
      tenantId: "space-a",
      oportunidadId: ctx.oportunidad._id,
      actorUserId: actor,
      eventBus: ctx.bus,
    });
    assert.equal(cleared.ok, true);
    if (!cleared.ok) return;
    assert.equal(cleared.oportunidad.nextAction, null);
    assert.equal(cleared.activity.actorUserId, actor);
  });

  it("aislamiento por tenantId entre Espacios", async () => {
    const a = await seedOpp("space-a", "a@ex.com", "iso-a");
    const b = await seedOpp("space-b", "b@ex.com", "iso-b");

    const cross = await a.store.findById("space-b", a.oportunidad._id);
    assert.equal(cross, null);

    const own = await a.store.findById("space-a", a.oportunidad._id);
    assert.ok(own);

    const bad = await transitionGrowthOpportunity(a.store, a.wf, {
      tenantId: "space-b",
      oportunidadId: a.oportunidad._id,
      transitionId: "activate",
      actorUserId: "user-x",
    });
    assert.equal(bad.ok, false);
    if (!bad.ok) assert.equal(bad.reason, "not_found");

    assert.notEqual(a.oportunidad._id, b.oportunidad._id);
  });

  it("transiciones disponibles salen de la plantilla growth.opportunity", () => {
    const open = listAvailableGrowthOpportunityTransitions("open");
    assert.deepEqual(
      open.map((t) => t.id),
      ["activate"]
    );
    const active = listAvailableGrowthOpportunityTransitions("active");
    assert.ok(active.some((t) => t.id === "win"));
    assert.equal(listAvailableGrowthOpportunityTransitions("won").length, 0);
  });
});
