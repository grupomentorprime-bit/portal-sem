/**
 * OT-GROWTH-CORE-007 — UI mínima Personas / Oportunidades (proyección + labels).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";
import { loadEnvLocal } from "../../src/core/migrations/env";
import type {
  GrowthActivity,
  GrowthOportunidad,
  GrowthPersona,
} from "../../src/core/growth/types";
import {
  GROWTH_NO_NEXT_ACTION_LABEL,
  GROWTH_ORIGIN_SECTION_LABEL,
  GROWTH_NEXT_ACTION_SECTION_LABEL,
  GROWTH_RELATED_HISTORY_LABEL,
  GROWTH_SITUATION_SECTION_LABEL,
  GROWTH_TIMELINE_SECTION_LABEL,
  GROWTH_VIEW_DETAIL_LABEL,
  growthActivityKindLabel,
  growthOpportunityStatusLabel,
  growthOpportunityTypeLabel,
  growthOriginArrivalLabel,
} from "../../src/lib/growth/labels";
import {
  escapeGrowthSearchRegex,
  personaMatchesSearch,
  pickPrimaryNextAction,
  sortActivitiesNewestFirst,
  toOportunidadDetailView,
  toPersonaDetailView,
  toPersonaListItemView,
} from "../../src/lib/growth/persona-view";

const FORBIDDEN_UI =
  /\b(CRM|pipeline|lead|trigger|activity log|tenant|ingest)\b/i;

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

function persona(partial: Partial<GrowthPersona> & Pick<GrowthPersona, "_id">): GrowthPersona {
  return {
    tenantId: "espacio-a",
    status: "active",
    displayName: "Ana Pérez",
    email: "ana@example.com",
    emailNormalized: "ana@example.com",
    phone: "+56911112222",
    phoneNormalized: "911112222",
    emails: [],
    phones: [],
    origin: {
      kind: "admission",
      channel: "portal-admision",
      sourceCollection: "portal_interesados",
      sourceId: "i1",
      capturedAt: "2026-09-01T10:00:00.000Z",
    },
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-02T10:00:00.000Z",
    ...partial,
  };
}

function oportunidad(
  partial: Partial<GrowthOportunidad> & Pick<GrowthOportunidad, "_id" | "personaId">
): GrowthOportunidad {
  return {
    tenantId: "espacio-a",
    typeKey: "conversion",
    subjectType: "program",
    subjectLabel: "Teología",
    origin: {
      kind: "admission",
      sourceCollection: "portal_interesados",
      sourceId: "i1",
      capturedAt: "2026-09-01T10:00:00.000Z",
    },
    status: "active",
    workflowInstanceId: "wf1",
    nextAction: null,
    source: { sourceCollection: "portal_interesados", sourceId: "i1" },
    openedAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-02T10:00:00.000Z",
    ...partial,
  };
}

describe("OT-GROWTH-CORE-007 — labels humanos", () => {
  it("origen / estado / tipo / actividad en lenguaje visible", () => {
    assert.equal(
      growthOriginArrivalLabel({ kind: "form", channel: "contacto" }),
      "Formulario · contacto"
    );
    assert.equal(growthOpportunityStatusLabel("handed_off"), "Traspasada");
    assert.equal(growthOpportunityTypeLabel("inquiry"), "Consulta");
    assert.equal(growthActivityKindLabel("application_received"), "Postulación recibida");
    assert.equal(GROWTH_ORIGIN_SECTION_LABEL, "De dónde llegó");
    assert.equal(GROWTH_TIMELINE_SECTION_LABEL, "Qué ha pasado");
    assert.equal(GROWTH_NEXT_ACTION_SECTION_LABEL, "Qué hacer ahora");
    assert.equal(GROWTH_SITUATION_SECTION_LABEL, "Situación");
    assert.equal(GROWTH_RELATED_HISTORY_LABEL, "Hechos de esta Oportunidad");
    assert.equal(GROWTH_VIEW_DETAIL_LABEL, "Ver detalle");
    assert.equal(GROWTH_NO_NEXT_ACTION_LABEL, "Sin próxima acción");
  });

  it("labels sin jerga prohibida", () => {
    const samples = [
      growthOriginArrivalLabel({ kind: "admission" }),
      growthOpportunityStatusLabel("open"),
      growthOpportunityTypeLabel("conversion"),
      growthActivityKindLabel("form_submitted"),
      GROWTH_NO_NEXT_ACTION_LABEL,
      GROWTH_ORIGIN_SECTION_LABEL,
      GROWTH_TIMELINE_SECTION_LABEL,
      GROWTH_NEXT_ACTION_SECTION_LABEL,
      GROWTH_SITUATION_SECTION_LABEL,
      GROWTH_RELATED_HISTORY_LABEL,
    ];
    for (const s of samples) {
      assert.equal(FORBIDDEN_UI.test(s), false, s);
    }
  });
});

describe("OT-GROWTH-CORE-007 — proyección de vista", () => {
  it("búsqueda por nombre / email / teléfono", () => {
    const p = persona({ _id: "p1" });
    assert.equal(personaMatchesSearch(p, "ana"), true);
    assert.equal(personaMatchesSearch(p, "EXAMPLE"), true);
    assert.equal(personaMatchesSearch(p, "91111"), true);
    assert.equal(personaMatchesSearch(p, "otro"), false);
  });

  it("escape de regex de búsqueda", () => {
    assert.equal(escapeGrowthSearchRegex("a+b (c)"), "a\\+b \\(c\\)");
  });

  it("timeline ordenado desc por occurredAt", () => {
    const acts: GrowthActivity[] = [
      {
        _id: "a1",
        tenantId: "espacio-a",
        personaId: "p1",
        kind: "note",
        summary: "Primera",
        occurredAt: "2026-09-01T10:00:00.000Z",
      },
      {
        _id: "a2",
        tenantId: "espacio-a",
        personaId: "p1",
        kind: "contact",
        summary: "Segunda",
        occurredAt: "2026-09-03T10:00:00.000Z",
      },
    ];
    const sorted = sortActivitiesNewestFirst(acts);
    assert.equal(sorted[0]._id, "a2");
    assert.equal(sorted[1]._id, "a1");
  });

  it("próxima acción prioriza Oportunidad no final con dueAt cercano", () => {
    const ops = [
      oportunidad({
        _id: "o-final",
        personaId: "p1",
        status: "won",
        nextAction: {
          summary: "Cerrar expediente",
          kind: "other",
          setAt: "2026-09-04T10:00:00.000Z",
          dueAt: "2026-09-05T10:00:00.000Z",
        },
      }),
      oportunidad({
        _id: "o-open",
        personaId: "p1",
        status: "active",
        typeKey: "inquiry",
        nextAction: {
          summary: "Llamar hoy",
          kind: "contact",
          setAt: "2026-09-02T10:00:00.000Z",
          dueAt: "2026-09-06T10:00:00.000Z",
        },
      }),
      oportunidad({
        _id: "o-soon",
        personaId: "p1",
        status: "open",
        typeKey: "registration",
        nextAction: {
          summary: "Confirmar cupo",
          kind: "review",
          setAt: "2026-09-01T10:00:00.000Z",
          dueAt: "2026-09-04T10:00:00.000Z",
        },
      }),
    ];
    const primary = pickPrimaryNextAction(ops);
    assert.ok(primary);
    assert.equal(primary.summary, "Confirmar cupo");
    assert.equal(primary.oportunidadId, "o-soon");
  });

  it("listado muestra Sin próxima acción cuando no hay nextAction", () => {
    const view = toPersonaListItemView(persona({ _id: "p1" }), [
      oportunidad({ _id: "o1", personaId: "p1", nextAction: null }),
    ]);
    assert.equal(view.nextActionLabel, GROWTH_NO_NEXT_ACTION_LABEL);
    assert.equal(view.originLabel.includes("Admisión"), true);
  });

  it("ficha agrupa Oportunidades, timeline y historial por Oportunidad", () => {
    const p = persona({ _id: "p1" });
    const ops = [
      oportunidad({ _id: "o1", personaId: "p1", typeKey: "inquiry" }),
      oportunidad({
        _id: "o2",
        personaId: "p1",
        typeKey: "conversion",
        openedAt: "2026-09-03T10:00:00.000Z",
        nextAction: {
          summary: "Revisar postulación",
          kind: "review",
          setAt: "2026-09-03T11:00:00.000Z",
        },
      }),
    ];
    const acts: GrowthActivity[] = [
      {
        _id: "a1",
        tenantId: "espacio-a",
        personaId: "p1",
        oportunidadId: "o2",
        kind: "application_received",
        summary: "Postulación recibida",
        occurredAt: "2026-09-03T10:00:00.000Z",
      },
      {
        _id: "a2",
        tenantId: "espacio-a",
        personaId: "p1",
        kind: "opportunity_opened",
        summary: "Oportunidad abierta",
        occurredAt: "2026-09-01T10:00:00.000Z",
      },
      {
        _id: "a-hidden",
        tenantId: "espacio-a",
        personaId: "p1",
        kind: "identity_conflict",
        summary: "Conflicto interno",
        occurredAt: "2026-09-04T10:00:00.000Z",
      },
    ];
    const detail = toPersonaDetailView(p, ops, acts);
    assert.equal(detail.oportunidades[0].id, "o2");
    assert.equal(detail.activities[0].id, "a1");
    assert.equal(
      detail.activities.some((a) => a.id === "a-hidden"),
      false
    );
    assert.equal(detail.oportunidades[0].relatedActivities.length, 1);
    assert.equal(detail.oportunidades[0].relatedActivities[0].id, "a1");
    assert.equal(detail.primaryNextAction?.summary, "Revisar postulación");
    assert.equal(detail.originLabel, "Admisión · portal-admision");
  });

  it("detalle de Oportunidad incluye Persona y historial relacionado", () => {
    const p = persona({ _id: "p1", displayName: "Ana Pérez" });
    const op = oportunidad({
      _id: "o1",
      personaId: "p1",
      typeKey: "conversion",
      nextAction: {
        summary: "Llamar",
        kind: "contact",
        setAt: "2026-09-02T10:00:00.000Z",
      },
    });
    const acts: GrowthActivity[] = [
      {
        _id: "a1",
        tenantId: "espacio-a",
        personaId: "p1",
        oportunidadId: "o1",
        kind: "application_received",
        summary: "Postulación recibida",
        occurredAt: "2026-09-03T10:00:00.000Z",
      },
    ];
    const view = toOportunidadDetailView(op, p, acts);
    assert.equal(view.personaDisplayName, "Ana Pérez");
    assert.equal(view.typeLabel, growthOpportunityTypeLabel("conversion"));
    assert.equal(view.nextAction?.summary, "Llamar");
    assert.equal(view.relatedActivities.length, 1);
  });

  it("aislamiento conceptual: misma proyección no mezcla tenantId en filtros de búsqueda", () => {
    const a = persona({ _id: "p-a", tenantId: "espacio-a", displayName: "Solo A" });
    const b = persona({
      _id: "p-b",
      tenantId: "espacio-b",
      displayName: "Solo B",
      email: "b@example.com",
      emailNormalized: "b@example.com",
    });
    assert.equal(personaMatchesSearch(a, "Solo A"), true);
    assert.equal(personaMatchesSearch(b, "Solo A"), false);
    assert.notEqual(a.tenantId, b.tenantId);
  });
});

describe("OT-GROWTH-CORE-007 — superficie /admin", () => {
  it("rutas y nav de Personas existen en primer nivel", () => {
    const root = process.cwd();
    assert.ok(existsSync(resolve(root, "src/app/admin/personas/page.tsx")));
    assert.ok(existsSync(resolve(root, "src/app/admin/personas/[id]/page.tsx")));

    const nav = readFileSync(resolve(root, "src/lib/admin/nav-domains.ts"), "utf8");
    assert.match(nav, /href: "\/admin\/personas"/);
    assert.match(nav, /label: "Personas"/);
    assert.match(nav, /id: "growth-personas"/);
    assert.match(nav, /id: "personas"/);
    assert.match(
      nav,
      /groupIds: \["dashboard", "personas", "ventas", "mensajes", "actividad"\]/
    );
    assert.doesNotMatch(
      nav,
      /id: "formularios"[\s\S]*?id: "growth-personas"/
    );
  });

  it("estado vacío usa lenguaje humano de llegada", () => {
    const labels = readFileSync(
      resolve(process.cwd(), "src/lib/growth/labels.ts"),
      "utf8"
    );
    assert.match(labels, /GROWTH_PERSONAS_EMPTY_TITLE/);
    assert.match(labels, /formularios, consultas o postulaciones/);
    assert.match(labels, /de dónde llegaron, qué buscan y qué hacer después/);
  });

  it("listado jerarquiza Persona → Situación → Qué hacer ahora", () => {
    const list = readFileSync(
      resolve(process.cwd(), "src/components/admin/growth/PersonasListClient.tsx"),
      "utf8"
    );
    assert.match(list, /GROWTH_SITUATION_SECTION_LABEL/);
    assert.match(list, /GROWTH_NEXT_ACTION_SECTION_LABEL/);
    assert.match(list, /sm:grid-cols-\[minmax\(0,1\.35fr\)/);
    assert.doesNotMatch(list, /Próxima acción/);

    const detail = readFileSync(
      resolve(process.cwd(), "src/components/admin/growth/PersonaDetailClient.tsx"),
      "utf8"
    );
    assert.match(detail, /GROWTH_NEXT_ACTION_SECTION_LABEL/);
    assert.match(detail, /GROWTH_RELATED_HISTORY_LABEL/);
    assert.match(detail, /GROWTH_TIMELINE_SECTION_LABEL/);
    assert.doesNotMatch(detail, /Próxima acción/);
  });

  it("UI y pages sin jerga prohibida", () => {
    const root = process.cwd();
    const files = [
      "src/components/admin/growth/PersonasListClient.tsx",
      "src/components/admin/growth/PersonaDetailClient.tsx",
      "src/lib/growth/labels.ts",
      "src/app/admin/personas/page.tsx",
      "src/app/admin/personas/[id]/page.tsx",
    ];
    for (const rel of files) {
      const text = readFileSync(resolve(root, rel), "utf8");
      assert.equal(FORBIDDEN_UI.test(text), false, rel);
    }
  });

  it("lectura siempre filtra por tenantId (Persona y Oportunidad)", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/lib/growth/personas-read.ts"),
      "utf8"
    );
    assert.match(src, /tenantId/);
    assert.match(src, /findById\(tenantId, personaId\)/);
    assert.match(src, /findById\(tenantId, oportunidadId\)/);
    assert.match(src, /listByPersona\(tenantId, personaId\)/);
    assert.match(src, /personaFilter\._id = \{ \$in: opportunityPersonaIds \}/);
    assert.match(src, /find\(\{ tenantId, oportunidadId \}\)/);
  });

  it("aislamiento Espacio: Persona/Oportunidad de ADL no se ve desde SEM (y viceversa)", async (t) => {
    loadTestMongoEnv();
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;
    if (!uri || !dbName) {
      t.skip("Sin MONGODB_URI/MONGODB_DB");
      return;
    }

    const { createMongoGrowthOpportunityStore, createMongoGrowthPersonaStore } =
      await import("../../src/core/growth");

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const personasStore = createMongoGrowthPersonaStore(db);
    const oportunidadesStore = createMongoGrowthOpportunityStore(db);

    const suffix = Date.now();
    const adlTenant = `test-adl-core007-${suffix}`;
    const semTenant = `test-sem-core007-${suffix}`;
    const adlPersonaId = `persona-adl-${suffix}`;
    const semPersonaId = `persona-sem-${suffix}`;
    const adlOpId = `op-adl-${suffix}`;
    const semOpId = `op-sem-${suffix}`;
    const now = new Date().toISOString();

    const personas = db.collection("growth_personas");
    const oportunidades = db.collection("growth_oportunidades");

    try {
      await personas.insertMany([
        {
          _id: adlPersonaId,
          tenantId: adlTenant,
          status: "active",
          displayName: "Persona ADL",
          email: `adl-${suffix}@example.com`,
          emailNormalized: `adl-${suffix}@example.com`,
          emails: [],
          phones: [],
          origin: {
            kind: "admission",
            sourceCollection: "portal_interesados",
            sourceId: `adl-${suffix}`,
            capturedAt: now,
          },
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: semPersonaId,
          tenantId: semTenant,
          status: "active",
          displayName: "Persona SEM",
          email: `sem-${suffix}@example.com`,
          emailNormalized: `sem-${suffix}@example.com`,
          emails: [],
          phones: [],
          origin: {
            kind: "form",
            sourceCollection: "experience_form_submissions",
            sourceId: `sem-${suffix}`,
            capturedAt: now,
          },
          createdAt: now,
          updatedAt: now,
        },
      ] as never[]);
      await oportunidades.insertMany([
        {
          _id: adlOpId,
          tenantId: adlTenant,
          personaId: adlPersonaId,
          typeKey: "conversion",
          subjectType: "program",
          origin: {
            kind: "admission",
            sourceCollection: "portal_interesados",
            sourceId: `adl-${suffix}`,
            capturedAt: now,
          },
          status: "open",
          workflowInstanceId: `wf-adl-${suffix}`,
          nextAction: null,
          source: {
            sourceCollection: "portal_interesados",
            sourceId: `adl-${suffix}`,
          },
          openedAt: now,
          updatedAt: now,
        },
        {
          _id: semOpId,
          tenantId: semTenant,
          personaId: semPersonaId,
          typeKey: "inquiry",
          subjectType: "none",
          origin: {
            kind: "form",
            sourceCollection: "experience_form_submissions",
            sourceId: `sem-${suffix}`,
            capturedAt: now,
          },
          status: "open",
          workflowInstanceId: `wf-sem-${suffix}`,
          nextAction: null,
          source: {
            sourceCollection: "experience_form_submissions",
            sourceId: `sem-${suffix}`,
          },
          openedAt: now,
          updatedAt: now,
        },
      ] as never[]);

      // Misma resolución que /admin/personas: stores Core + filtro tenantId
      const adlListed = await personas
        .find({ tenantId: adlTenant, status: { $ne: "merged" } })
        .toArray();
      const semListed = await personas
        .find({ tenantId: semTenant, status: { $ne: "merged" } })
        .toArray();
      assert.equal(adlListed.some((p) => String(p._id) === adlPersonaId), true);
      assert.equal(adlListed.some((p) => String(p._id) === semPersonaId), false);
      assert.equal(semListed.some((p) => String(p._id) === semPersonaId), true);
      assert.equal(semListed.some((p) => String(p._id) === adlPersonaId), false);

      assert.equal(
        await personasStore.findById(semTenant, adlPersonaId),
        null
      );
      assert.equal(
        await personasStore.findById(adlTenant, semPersonaId),
        null
      );
      assert.ok(await personasStore.findById(adlTenant, adlPersonaId));
      assert.ok(await personasStore.findById(semTenant, semPersonaId));

      assert.equal(
        await oportunidadesStore.findById(semTenant, adlOpId),
        null
      );
      assert.equal(
        await oportunidadesStore.findById(adlTenant, semOpId),
        null
      );
      assert.ok(await oportunidadesStore.findById(adlTenant, adlOpId));
      assert.ok(await oportunidadesStore.findById(semTenant, semOpId));
    } finally {
      await personas.deleteMany({
        _id: { $in: [adlPersonaId, semPersonaId] },
      } as never);
      await oportunidades.deleteMany({
        _id: { $in: [adlOpId, semOpId] },
      } as never);
      await client.close();
    }
  });

  it("carpeta de validación lista para capturas", () => {
    const dir = resolve(process.cwd(), "docs/validation/OT-GROWTH-CORE-007");
    assert.ok(existsSync(resolve(dir, "README.md")));
    const files = readdirSync(dir);
    assert.ok(files.includes("README.md"));
  });
});
