/**
 * OT-GROWTH-CAMPAIGNS-003 — Campañas V1 (CRUD, bridge, audiencia, métricas, IAM).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  activateGrowthCampaign,
  createGrowthCampaign,
  createMemoryGrowthCampaignStore,
  deriveCampaignMetrics,
  endGrowthCampaign,
  evaluateCampaignAudienceFilters,
  filterOportunidadesByAudience,
  filterOportunidadesByCampaign,
  getGrowthCampaign,
  listGrowthCampaigns,
  resolveActiveFormCampaignTrackingKey,
  updateGrowthCampaign,
  type CampaignRefsPort,
} from "../../src/core/growth/campaigns";
import {
  createMemoryGrowthIngestStores,
  createMemoryGrowthOpportunityWorkflow,
  projectGrowthFromSignal,
  toGrowthFormInput,
} from "../../src/core/growth";
import {
  evaluateAutomationConditionRule,
  validateAutomationSteps,
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
import { campaignHumanError } from "../../src/lib/growth/campaigns-labels";
import type { GrowthOportunidad } from "../../src/core/growth/types";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

const actor = { userId: "user-1" };

function refsPort(opts?: {
  forms?: Set<string>;
  automations?: Set<string>;
}): CampaignRefsPort {
  const forms = opts?.forms ?? new Set(["form-a", "form-b"]);
  const automations = opts?.automations ?? new Set(["auto-a"]);
  return {
    async formExists(tenantId, formId) {
      return forms.has(`${tenantId}::${formId}`) || forms.has(formId);
    },
    async automationExists(tenantId, automationId) {
      return (
        automations.has(`${tenantId}::${automationId}`) ||
        automations.has(automationId)
      );
    },
  };
}

function baseCreate(overrides?: Record<string, unknown>) {
  return {
    tenantId: "tenant-a",
    name: "Campaña Open Day",
    objective: "Captar interesados al open day",
    trackingKey: "open-day-2026",
    source: { kind: "form" as const, formId: "form-a" },
    actor,
    refs: refsPort(),
    now: "2026-09-11T12:00:00.000Z",
    ...overrides,
  };
}

function opp(partial: Partial<GrowthOportunidad> & {
  _id: string;
  tenantId: string;
  personaId: string;
  status: GrowthOportunidad["status"];
}): GrowthOportunidad {
  return {
    typeKey: "inquiry",
    subjectType: "form",
    subjectId: "form-a",
    origin: {
      kind: "form",
      sourceCollection: "experience_form_submissions",
      sourceId: partial._id,
      capturedAt: "2026-09-11T12:00:00.000Z",
    },
    workflowInstanceId: `wf-${partial._id}`,
    nextAction: null,
    source: {
      sourceCollection: "experience_form_submissions",
      sourceId: partial._id,
    },
    createdAt: "2026-09-11T12:00:00.000Z",
    updatedAt: "2026-09-11T12:00:00.000Z",
    ...partial,
  };
}

describe("OT-GROWTH-CAMPAIGNS-003 — superficie e IAM", () => {
  it("rutas API, módulo core, migración y admin existen", () => {
    for (const rel of [
      "src/core/growth/campaigns/index.ts",
      "src/lib/growth/campaigns.ts",
      "src/lib/growth/campaigns-read.ts",
      "src/app/api/growth/campaigns/route.ts",
      "src/app/api/growth/campaigns/[id]/route.ts",
      "src/app/api/growth/campaigns/[id]/activate/route.ts",
      "src/app/api/growth/campaigns/[id]/end/route.ts",
      "src/app/admin/campanas/page.tsx",
      "src/app/admin/campanas/nueva/page.tsx",
      "src/app/admin/campanas/[id]/page.tsx",
      "src/core/migrations/021-growth-campaigns.ts",
    ]) {
      assert.ok(existsSync(resolve(process.cwd(), rel)), rel);
    }
  });

  it("Q — permisos growth.campaigns en registry + catálogo + roles comerciales", () => {
    assert.ok(PERMISSIONS["growth.campaigns.view"]);
    assert.ok(PERMISSIONS["growth.campaigns.manage"]);
    const growth = PERMISSION_MODULES.find((m) => m.id === "growth");
    assert.ok(growth);
    assert.ok(
      growth?.permissions.some((p) => p.code === "growth.campaigns.view")
    );
    assert.ok(
      growth?.permissions.some((p) => p.code === "growth.campaigns.manage")
    );

    for (const code of [
      ROLE_CODES.SUPER_ADMIN,
      ROLE_CODES.INSTITUTION_ADMIN,
      ROLE_CODES.SUPPORT,
      ROLE_CODES.ADMISSIONS,
    ]) {
      const role = PORTAL_TENANT_ROLES.find((r) => r.code === code);
      assert.ok(role?.permissionIds.includes("growth.campaigns.view"), code);
      assert.ok(role?.permissionIds.includes("growth.campaigns.manage"), code);
      if (code !== ROLE_CODES.SUPER_ADMIN) {
        assert.equal(
          ROLE_PERMISSION_TEMPLATES[code]["growth.campaigns.view"],
          true
        );
        assert.equal(
          ROLE_PERMISSION_TEMPLATES[code]["growth.campaigns.manage"],
          true
        );
      }
    }

    const map = legacyPermissionIdsToMap(["growth.campaigns.view"]);
    assert.equal(map["growth.campaigns.view"], true);
    const legacy = granularToLegacyPermissions({
      ...Object.fromEntries(
        Object.keys(ROLE_PERMISSION_TEMPLATES[ROLE_CODES.GUEST]).map((k) => [
          k,
          false,
        ])
      ),
      "growth.campaigns.view": true,
      "growth.campaigns.manage": true,
    });
    assert.ok(legacy.includes("growth.campaigns.view"));
    assert.ok(legacy.includes("growth.campaigns.manage"));
  });

  it("APIs exigen view/manage; nav apunta a /admin/campanas", () => {
    const listRoute = readSrc("src/app/api/growth/campaigns/route.ts");
    assert.match(listRoute, /growth\.campaigns\.view/);
    assert.match(listRoute, /growth\.campaigns\.manage/);
    const detail = readSrc("src/app/api/growth/campaigns/[id]/route.ts");
    assert.match(detail, /growth\.campaigns\.view/);
    assert.match(detail, /growth\.campaigns\.manage/);
    const nav = readSrc("src/lib/admin/nav-domains.ts");
    assert.match(nav, /id: "nav-campanas"[\s\S]*?href: "\/admin\/campanas"/);
    assert.match(nav, /growth\.campaigns\.view/);
  });

  it("no inventa segundo CRM / inbox / automation engine / envío masivo", () => {
    for (const rel of [
      "src/core/growth/campaigns/service.ts",
      "src/lib/growth/campaigns.ts",
      "src/lib/growth/live-ingest.ts",
    ]) {
      const src = readSrc(rel);
      assert.doesNotMatch(src, /fan-out|whatsapp.?template|Meta Ads/i);
      assert.doesNotMatch(src, /growth_campaign_activities/);
      assert.doesNotMatch(src, /createBroadcast|sendBulk|massSend/i);
    }
    assert.equal(
      existsSync(
        resolve(process.cwd(), "src/core/growth/campaigns/runtime.ts")
      ),
      false
    );
  });
});

describe("OT-GROWTH-CAMPAIGNS-003 — CRUD / estados / multi-tenant", () => {
  it("A — CRUD tenant-scoped", async () => {
    const store = createMemoryGrowthCampaignStore();
    const created = await createGrowthCampaign(store, baseCreate());
    assert.equal(created.ok, true);
    if (!created.ok) return;

    const listed = await listGrowthCampaigns(store, "tenant-a");
    assert.equal(listed.length, 1);
    assert.equal(listed[0]?._id, created.campaign._id);

    const other = await listGrowthCampaigns(store, "tenant-b");
    assert.equal(other.length, 0);

    const updated = await updateGrowthCampaign(store, {
      tenantId: "tenant-a",
      campaignId: created.campaign._id,
      name: "Open Day v2",
      actor,
      refs: refsPort(),
    });
    assert.equal(updated.ok, true);
    if (!updated.ok) return;
    assert.equal(updated.campaign.name, "Open Day v2");

    const got = await getGrowthCampaign(store, {
      tenantId: "tenant-a",
      campaignId: created.campaign._id,
    });
    assert.equal(got?.name, "Open Day v2");

    const cross = await getGrowthCampaign(store, {
      tenantId: "tenant-b",
      campaignId: created.campaign._id,
    });
    assert.equal(cross, null);
  });

  it("B/C — trackingKey único por tenant; mismo key en tenants distintos", async () => {
    const store = createMemoryGrowthCampaignStore();
    const a = await createGrowthCampaign(store, baseCreate());
    assert.equal(a.ok, true);

    const dup = await createGrowthCampaign(
      store,
      baseCreate({ name: "Otra", trackingKey: "open-day-2026" })
    );
    assert.equal(dup.ok, false);
    if (dup.ok) return;
    assert.equal(dup.code, "tracking_key_taken");

    const otherTenant = await createGrowthCampaign(
      store,
      baseCreate({
        tenantId: "tenant-b",
        trackingKey: "open-day-2026",
        refs: refsPort({ forms: new Set(["form-a"]) }),
      })
    );
    assert.equal(otherTenant.ok, true);
  });

  it("D — solo una campaña active por form y tenant", async () => {
    const store = createMemoryGrowthCampaignStore();
    const a = await createGrowthCampaign(store, baseCreate());
    assert.equal(a.ok, true);
    if (!a.ok) return;
    const actA = await activateGrowthCampaign(store, {
      tenantId: "tenant-a",
      campaignId: a.campaign._id,
      actor,
      refs: refsPort(),
    });
    assert.equal(actA.ok, true);

    const b = await createGrowthCampaign(
      store,
      baseCreate({
        name: "Segunda",
        trackingKey: "open-day-b",
        source: { kind: "form", formId: "form-a" },
      })
    );
    assert.equal(b.ok, true);
    if (!b.ok) return;
    const actB = await activateGrowthCampaign(store, {
      tenantId: "tenant-a",
      campaignId: b.campaign._id,
      actor,
      refs: refsPort(),
    });
    assert.equal(actB.ok, false);
    if (actB.ok) return;
    assert.equal(actB.code, "active_form_conflict");
    assert.match(
      campaignHumanError(actB.code),
      /formulario ya está siendo usado/i
    );
  });

  it("L/M — automationId y formId cross-tenant rechazados", async () => {
    const store = createMemoryGrowthCampaignStore();
    const refs: CampaignRefsPort = {
      async formExists(tenantId, formId) {
        return tenantId === "tenant-a" && formId === "form-a";
      },
      async automationExists(tenantId, automationId) {
        return tenantId === "tenant-a" && automationId === "auto-a";
      },
    };

    const badForm = await createGrowthCampaign(
      store,
      baseCreate({
        source: { kind: "form", formId: "form-other" },
        refs,
      })
    );
    assert.equal(badForm.ok, false);
    if (badForm.ok) return;
    assert.equal(badForm.code, "form_not_found");

    const badAuto = await createGrowthCampaign(
      store,
      baseCreate({
        trackingKey: "with-auto",
        automationId: "auto-other",
        refs,
      })
    );
    assert.equal(badAuto.ok, false);
    if (badAuto.ok) return;
    assert.equal(badAuto.code, "automation_not_found");
    assert.equal(
      campaignHumanError(badAuto.code),
      "No pudimos usar esta automatización."
    );
  });

  it("transiciones draft→active→ended; trackingKey inmutable tras activar", async () => {
    const store = createMemoryGrowthCampaignStore();
    const created = await createGrowthCampaign(store, baseCreate());
    assert.equal(created.ok, true);
    if (!created.ok) return;

    const activated = await activateGrowthCampaign(store, {
      tenantId: "tenant-a",
      campaignId: created.campaign._id,
      actor,
      refs: refsPort(),
    });
    assert.equal(activated.ok, true);
    if (!activated.ok) return;
    assert.equal(activated.campaign.status, "active");

    const immutable = await updateGrowthCampaign(store, {
      tenantId: "tenant-a",
      campaignId: created.campaign._id,
      trackingKey: "otro-key",
      actor,
      refs: refsPort(),
    });
    assert.equal(immutable.ok, false);
    if (immutable.ok) return;
    assert.equal(immutable.code, "tracking_key_immutable");

    const reopen = await activateGrowthCampaign(store, {
      tenantId: "tenant-a",
      campaignId: created.campaign._id,
      actor,
      refs: refsPort(),
    });
    assert.equal(reopen.ok, false);

    const ended = await endGrowthCampaign(store, {
      tenantId: "tenant-a",
      campaignId: created.campaign._id,
      actor,
    });
    assert.equal(ended.ok, true);
    if (!ended.ok) return;
    assert.equal(ended.campaign.status, "ended");

    const reactivate = await activateGrowthCampaign(store, {
      tenantId: "tenant-a",
      campaignId: created.campaign._id,
      actor,
      refs: refsPort(),
    });
    assert.equal(reactivate.ok, false);
  });

  it("R — tenant A nunca ve/edita tenant B", async () => {
    const store = createMemoryGrowthCampaignStore();
    const a = await createGrowthCampaign(store, baseCreate());
    assert.equal(a.ok, true);
    if (!a.ok) return;

    const edit = await updateGrowthCampaign(store, {
      tenantId: "tenant-b",
      campaignId: a.campaign._id,
      name: "Hack",
      actor,
      refs: refsPort(),
    });
    assert.equal(edit.ok, false);
    if (edit.ok) return;
    assert.equal(edit.code, "not_found");
  });
});

describe("OT-GROWTH-CAMPAIGNS-003 — tracking bridge + primer origen", () => {
  it("E/F/G — draft/ended no atribuyen; active sí", async () => {
    const store = createMemoryGrowthCampaignStore();
    const created = await createGrowthCampaign(store, baseCreate());
    assert.equal(created.ok, true);
    if (!created.ok) return;

    assert.equal(
      await resolveActiveFormCampaignTrackingKey(
        store,
        "tenant-a",
        "form-a"
      ),
      null
    );

    await activateGrowthCampaign(store, {
      tenantId: "tenant-a",
      campaignId: created.campaign._id,
      actor,
      refs: refsPort(),
    });
    assert.equal(
      await resolveActiveFormCampaignTrackingKey(
        store,
        "tenant-a",
        "form-a"
      ),
      "open-day-2026"
    );

    await endGrowthCampaign(store, {
      tenantId: "tenant-a",
      campaignId: created.campaign._id,
      actor,
    });
    assert.equal(
      await resolveActiveFormCampaignTrackingKey(
        store,
        "tenant-a",
        "form-a"
      ),
      null
    );
  });

  it("H — ingest sin campaña sigue funcionando; toGrowthFormInput pasa campaign", async () => {
    const mapped = toGrowthFormInput({
      _id: "sub-1",
      tenant: "tenant-a",
      formId: "form-a",
      destination: "information_request",
      data: { email: "a@ex.com", phone: "+56 9 1111 1111", fullName: "Ana" },
    });
    assert.equal(mapped.campaign, undefined);

    const withCampaign = toGrowthFormInput({
      _id: "sub-2",
      tenant: "tenant-a",
      formId: "form-a",
      destination: "information_request",
      data: { email: "b@ex.com", phone: "+56 9 2222 2222", fullName: "Bea" },
      campaign: "open-day-2026",
    });
    assert.equal(withCampaign.campaign, "open-day-2026");

    const live = readSrc("src/lib/growth/live-ingest.ts");
    assert.match(live, /resolveFormCampaignTrackingKeyForIngest/);
    assert.match(live, /campaign/);
  });

  it("I/J/K — persona existente conserva origen; nueva + oportunidad reciben campaign", async () => {
    const stores = createMemoryGrowthIngestStores();
    const wf = createMemoryGrowthOpportunityWorkflow();
    const deps = {
      personas: stores.personas,
      oportunidades: stores.oportunidades,
      workflow: wf,
    };

    const first = await projectGrowthFromSignal(deps, {
      kind: "form",
      tenantId: "tenant-a",
      submissionId: "sub-first",
      formId: "form-a",
      destination: "information_request",
      data: {
        fullName: "Ana Pérez",
        email: "ana@ex.com",
        phone: "+56 9 1111 2222",
      },
      campaign: "open-day-2026",
      capturedAt: "2026-09-11T10:00:00.000Z",
    });
    assert.equal(first.ok, true);
    if (!first.ok || first.outcome !== "projected") return;
    assert.equal(first.persona.origin.campaign, "open-day-2026");
    assert.equal(first.oportunidad.origin.campaign, "open-day-2026");

    const second = await projectGrowthFromSignal(deps, {
      kind: "form",
      tenantId: "tenant-a",
      submissionId: "sub-second",
      formId: "form-b",
      destination: "contact",
      data: {
        fullName: "Ana Pérez",
        email: "ana@ex.com",
        phone: "+56 9 1111 2222",
      },
      campaign: "otra-campana",
      capturedAt: "2026-09-11T11:00:00.000Z",
    });
    assert.equal(second.ok, true);
    if (!second.ok || second.outcome !== "projected") return;
    assert.equal(second.persona._id, first.persona._id);
    assert.equal(second.persona.origin.campaign, "open-day-2026");
    assert.equal(second.oportunidad.origin.campaign, "otra-campana");
  });
});

describe("OT-GROWTH-CAMPAIGNS-003 — automatizaciones / audiencia / métricas", () => {
  it("N — condición origin.campaign funciona", () => {
    const validated = validateAutomationSteps([
      {
        kind: "trigger",
        eventTypes: ["GrowthOpportunityOpened"],
      },
      {
        kind: "condition",
        rules: [{ field: "origin.campaign", op: "eq", value: "open-day-2026" }],
      },
      {
        kind: "action",
        action: "salesSetNextAction",
        summary: "Llamar por campaña",
      },
    ]);
    assert.equal(validated.ok, true);

    const match = opp({
      _id: "o1",
      tenantId: "tenant-a",
      personaId: "p1",
      status: "open",
      origin: {
        kind: "form",
        sourceCollection: "experience_form_submissions",
        sourceId: "o1",
        capturedAt: "2026-09-11T12:00:00.000Z",
        campaign: "open-day-2026",
      },
    });
    assert.equal(
      evaluateAutomationConditionRule(match, {
        field: "origin.campaign",
        op: "eq",
        value: "open-day-2026",
      }),
      true
    );
    assert.equal(
      evaluateAutomationConditionRule(match, {
        field: "origin.campaign",
        op: "eq",
        value: "otra",
      }),
      false
    );
  });

  it("O — filtros audiencia AND", () => {
    const items = [
      opp({
        _id: "o1",
        tenantId: "tenant-a",
        personaId: "p1",
        status: "active",
        typeKey: "inquiry",
        origin: {
          kind: "form",
          sourceCollection: "experience_form_submissions",
          sourceId: "o1",
          capturedAt: "2026-09-11T12:00:00.000Z",
          channel: "web",
          formId: "form-a",
          campaign: "open-day-2026",
        },
      }),
      opp({
        _id: "o2",
        tenantId: "tenant-a",
        personaId: "p2",
        status: "open",
        typeKey: "inquiry",
        origin: {
          kind: "form",
          sourceCollection: "experience_form_submissions",
          sourceId: "o2",
          capturedAt: "2026-09-11T12:00:00.000Z",
          channel: "web",
          formId: "form-a",
          campaign: "open-day-2026",
        },
      }),
    ];

    const filtered = filterOportunidadesByAudience(items, [
      { field: "origin.campaign", op: "eq", value: "open-day-2026" },
      { field: "status", op: "eq", value: "active" },
    ]);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?._id, "o1");

    assert.equal(
      evaluateCampaignAudienceFilters(items[0]!, [
        { field: "typeKey", op: "eq", value: "inquiry" },
        { field: "origin.kind", op: "eq", value: "form" },
        { field: "origin.channel", op: "eq", value: "web" },
        { field: "origin.formId", op: "eq", value: "form-a" },
        { field: "origin.campaign", op: "eq", value: "open-day-2026" },
      ]),
      true
    );
  });

  it("P — métricas derivadas correctas", () => {
    const all = [
      opp({
        _id: "o1",
        tenantId: "tenant-a",
        personaId: "p1",
        status: "active",
        origin: {
          kind: "form",
          sourceCollection: "experience_form_submissions",
          sourceId: "o1",
          capturedAt: "2026-09-11T12:00:00.000Z",
          campaign: "open-day-2026",
        },
      }),
      opp({
        _id: "o2",
        tenantId: "tenant-a",
        personaId: "p1",
        status: "won",
        origin: {
          kind: "form",
          sourceCollection: "experience_form_submissions",
          sourceId: "o2",
          capturedAt: "2026-09-11T12:00:00.000Z",
          campaign: "open-day-2026",
        },
      }),
      opp({
        _id: "o3",
        tenantId: "tenant-a",
        personaId: "p2",
        status: "lost",
        origin: {
          kind: "form",
          sourceCollection: "experience_form_submissions",
          sourceId: "o3",
          capturedAt: "2026-09-11T12:00:00.000Z",
          campaign: "open-day-2026",
        },
      }),
      opp({
        _id: "o4",
        tenantId: "tenant-a",
        personaId: "p3",
        status: "open",
        origin: {
          kind: "form",
          sourceCollection: "experience_form_submissions",
          sourceId: "o4",
          capturedAt: "2026-09-11T12:00:00.000Z",
          campaign: "otra",
        },
      }),
      opp({
        _id: "o5",
        tenantId: "tenant-b",
        personaId: "p9",
        status: "won",
        origin: {
          kind: "form",
          sourceCollection: "experience_form_submissions",
          sourceId: "o5",
          capturedAt: "2026-09-11T12:00:00.000Z",
          campaign: "open-day-2026",
        },
      }),
    ];

    const scoped = filterOportunidadesByCampaign(
      all,
      "tenant-a",
      "open-day-2026"
    );
    const metrics = deriveCampaignMetrics(scoped);
    assert.equal(metrics.personasCaptadas, 2);
    assert.equal(metrics.oportunidadesGeneradas, 3);
    assert.equal(metrics.enSeguimiento, 1);
    assert.equal(metrics.ganadas, 1);
    assert.equal(metrics.perdidas, 1);
  });
});

describe("OT-GROWTH-CAMPAIGNS-003 — regresiones S/T", () => {
  it("S — Forms/Capture/Growth Core bridge fail-safe sin hidden/UTM", () => {
    const live = readSrc("src/lib/growth/live-ingest.ts");
    assert.match(live, /resolveFormCampaignTrackingKeyForIngest/);
    assert.doesNotMatch(live, /utm_|hidden.?field|queryParam/i);
    const ingestMap = readSrc("src/core/growth/ingest-map.ts");
    assert.match(ingestMap, /campaign/);
  });

  it("T — Automatizaciones: solo origin.campaign añadido; sin acciones nuevas", () => {
    const catalog = readSrc("src/core/growth/automations/catalog.ts");
    assert.match(catalog, /origin\.campaign/);
    const types = readSrc("src/core/growth/automations/types.ts");
    assert.match(types, /origin\.campaign/);
    assert.match(types, /salesTransitionOpportunity/);
    const conditions = readSrc("src/core/growth/automations/conditions.ts");
    assert.match(conditions, /origin\.campaign/);
  });
});
