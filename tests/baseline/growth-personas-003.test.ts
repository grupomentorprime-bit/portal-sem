/**
 * OT-GROWTH-PERSONAS-IMPLEMENT-003 — pruebas focalizadas Personas V1.
 * Endurecimiento CORE-007: permisos, filtro origen, humanización, crear, CTAs.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createMemoryGrowthPersonaStore,
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
import {
  growthOriginArrivalLabel,
  GROWTH_PERSONAS_CONFLICT_MESSAGE,
  GROWTH_PERSONAS_CREATED_MESSAGE,
  GROWTH_PERSONAS_MATCHED_MESSAGE,
  GROWTH_PERSONAS_VALIDATION_MESSAGE,
  GROWTH_PERSONA_ORIGIN_FILTER_OPTIONS,
} from "../../src/lib/growth/labels";
import { buildPersonaOriginMongoFilter } from "../../src/lib/growth/personas-origin-filter";
import { createGrowthPersonaWithStore } from "../../src/lib/growth/personas-create";
import {
  humanizeOriginDisplayLabel,
  isKnownHumanOriginChannel,
} from "../../src/lib/growth/humanize-origin-display";
import {
  pickPrimaryNextAction,
  toPersonaDetailView,
} from "../../src/lib/growth/persona-view";
import type {
  GrowthActivity,
  GrowthOportunidad,
  GrowthPersona,
} from "../../src/core/growth/types";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

function persona(
  partial: Partial<GrowthPersona> & Pick<GrowthPersona, "_id">
): GrowthPersona {
  return {
    tenantId: "espacio-a",
    status: "active",
    displayName: "Ana Pérez",
    email: "ana@example.com",
    emailNormalized: "ana@example.com",
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
  partial: Partial<GrowthOportunidad> &
    Pick<GrowthOportunidad, "_id" | "personaId">
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

describe("OT-GROWTH-PERSONAS-IMPLEMENT-003 — IAM A–J", () => {
  it("A–D / E–I — permisos growth.people en registry + catálogo + roles", () => {
    assert.equal(PERMISSIONS["growth.people.view"], "Ver Personas del Espacio");
    assert.equal(
      PERMISSIONS["growth.people.manage"],
      "Gestionar Personas del Espacio"
    );
    const growth = PERMISSION_MODULES.find((m) => m.id === "growth");
    assert.ok(growth?.permissions.some((p) => p.code === "growth.people.view"));
    assert.ok(
      growth?.permissions.some((p) => p.code === "growth.people.manage")
    );

    for (const code of [
      ROLE_CODES.SUPER_ADMIN,
      ROLE_CODES.INSTITUTION_ADMIN,
      ROLE_CODES.SUPPORT,
      ROLE_CODES.ADMISSIONS,
    ]) {
      const role = PORTAL_TENANT_ROLES.find((r) => r.code === code);
      assert.ok(role?.permissionIds.includes("growth.people.view"), code);
      assert.ok(role?.permissionIds.includes("growth.people.manage"), code);
      if (code !== ROLE_CODES.SUPER_ADMIN) {
        assert.equal(ROLE_PERMISSION_TEMPLATES[code]["growth.people.view"], true);
        assert.equal(
          ROLE_PERMISSION_TEMPLATES[code]["growth.people.manage"],
          true
        );
      }
    }

    for (const code of [
      ROLE_CODES.STUDENT_AFFAIRS,
      ROLE_CODES.COMMUNICATIONS,
      ROLE_CODES.REVIEWER,
      ROLE_CODES.GUEST,
      ROLE_CODES.TEACHER,
      ROLE_CODES.FINANCE,
      ROLE_CODES.STUDENT,
    ]) {
      assert.equal(
        ROLE_PERMISSION_TEMPLATES[code]["growth.people.view"],
        false,
        code
      );
      assert.equal(
        ROLE_PERMISSION_TEMPLATES[code]["growth.people.manage"],
        false,
        code
      );
      const role = PORTAL_TENANT_ROLES.find((r) => r.code === code);
      if (role) {
        assert.equal(role.permissionIds.includes("growth.people.view"), false);
        assert.equal(role.permissionIds.includes("growth.people.manage"), false);
      }
    }

    const map = legacyPermissionIdsToMap(["growth.people.view"]);
    assert.equal(map["growth.people.view"], true);
    const legacy = granularToLegacyPermissions({
      ...Object.fromEntries(
        Object.keys(ROLE_PERMISSION_TEMPLATES[ROLE_CODES.GUEST]).map((k) => [
          k,
          false,
        ])
      ),
      "growth.people.view": true,
      "growth.people.manage": true,
    });
    assert.ok(legacy.includes("growth.people.view"));
    assert.ok(legacy.includes("growth.people.manage"));
  });

  it("A–D / J — pages y nav exigen growth.people.*; API manage para crear", () => {
    const listPage = readSrc("src/app/admin/personas/page.tsx");
    const detailPage = readSrc("src/app/admin/personas/[id]/page.tsx");
    const api = readSrc("src/app/api/growth/personas/route.ts");
    const nav = readSrc("src/lib/admin/nav-domains.ts");
    const listClient = readSrc(
      "src/components/admin/growth/PersonasListClient.tsx"
    );

    assert.match(listPage, /growth\.people\.view/);
    assert.match(listPage, /growth\.people\.manage/);
    assert.match(detailPage, /growth\.people\.view/);
    assert.match(api, /growth\.people\.manage/);
    assert.match(api, /createGrowthPersonaAdmin|upsertGrowthPersona/);
    assert.doesNotMatch(api, /insertOne/);

    assert.match(
      nav,
      /id: "growth-personas"[\s\S]*?growth\.people\.view[\s\S]*?growth\.people\.manage/
    );
    const personasNavBlock =
      nav.match(
        /id: "growth-personas"[\s\S]*?requiredAnyPermission:\s*\[[\s\S]*?\]/
      )?.[0] ?? "";
    assert.match(personasNavBlock, /growth\.people\.view/);
    assert.doesNotMatch(personasNavBlock, /cms\.pages|experience\.forms|settings\.team/);

    assert.match(listClient, /canManage/);
    assert.match(listClient, /Crear persona|GROWTH_PERSONAS_CREATE_CTA/);
  });
});

describe("OT-GROWTH-PERSONAS-IMPLEMENT-003 — filtro origen K–Q", () => {
  it("K–P — tokens de filtro mapean a kind/channel reales", () => {
    assert.deepEqual(buildPersonaOriginMongoFilter("whatsapp"), {
      "origin.channel": "whatsapp",
    });
    assert.deepEqual(buildPersonaOriginMongoFilter("form"), {
      "origin.kind": "form",
    });
    assert.deepEqual(buildPersonaOriginMongoFilter("admission"), {
      "origin.kind": "admission",
    });
    assert.deepEqual(buildPersonaOriginMongoFilter("manual"), {
      "origin.kind": "manual",
    });
    assert.deepEqual(buildPersonaOriginMongoFilter("event"), {
      "origin.kind": "event",
    });
    assert.deepEqual(buildPersonaOriginMongoFilter("portal-web"), {
      "origin.channel": "portal-admision",
    });
    assert.equal(buildPersonaOriginMongoFilter(""), null);
    assert.equal(buildPersonaOriginMongoFilter(undefined), null);
    assert.equal(buildPersonaOriginMongoFilter("inventado"), null);

    const labels = GROWTH_PERSONA_ORIGIN_FILTER_OPTIONS.map((o) => o.label);
    assert.ok(labels.includes("WhatsApp"));
    assert.ok(labels.includes("Formulario"));
    assert.ok(labels.includes("Admisión"));
    assert.ok(labels.includes("Registro manual"));
    assert.ok(labels.includes("Evento"));
    assert.ok(labels.includes("Portal web"));
    assert.ok(labels.includes("Sin origen claro"));
  });

  it("Q — Sin origen claro excluye WhatsApp / Portal web conocidos", () => {
    const filter = buildPersonaOriginMongoFilter("unclear");
    assert.deepEqual(filter, {
      "origin.kind": "unknown",
      "origin.channel": { $nin: ["whatsapp", "portal-admision"] },
    });
    assert.equal(isKnownHumanOriginChannel("whatsapp"), true);
    assert.equal(isKnownHumanOriginChannel("portal-admision"), true);
    assert.equal(isKnownHumanOriginChannel("otro"), false);
  });
});

describe("OT-GROWTH-PERSONAS-IMPLEMENT-003 — humanización R", () => {
  it("R — WhatsApp conocido no antepone Sin origen claro", () => {
    const raw = growthOriginArrivalLabel({
      kind: "unknown",
      channel: "whatsapp",
    });
    assert.equal(raw, "Sin origen claro · whatsapp");
    assert.equal(humanizeOriginDisplayLabel(raw), "WhatsApp");
    assert.doesNotMatch(humanizeOriginDisplayLabel(raw), /Sin origen claro/);

    assert.equal(
      humanizeOriginDisplayLabel("Sin origen claro · portal-admision"),
      "Portal web"
    );
    assert.equal(
      humanizeOriginDisplayLabel("Admisión · portal-admision"),
      "Portal web / Admisión"
    );
  });
});

describe("OT-GROWTH-PERSONAS-IMPLEMENT-003 — conversaciones / CTAs S–U", () => {
  it("S–U — ficha proyecta conversaciones; CTAs fail-safe por permiso", () => {
    const detail = readSrc(
      "src/components/admin/growth/PersonaDetailClient.tsx"
    );
    const page = readSrc("src/app/admin/personas/[id]/page.tsx");
    const read = readSrc("src/lib/growth/personas-read.ts");

    assert.match(read, /listPersonaConversationViews/);
    assert.match(read, /tenantId, personaId/);
    assert.match(read, /GROWTH_CONVERSACIONES_COLLECTION/);
    assert.doesNotMatch(read, /insertOne|sendReply|composer/i);

    assert.match(detail, /canOpenMessages/);
    assert.match(detail, /canOpenSales/);
    assert.match(detail, /canOpenActivity/);
    assert.match(detail, /Abrir en Mensajes|GROWTH_PERSONAS_OPEN_IN_MESSAGES/);
    assert.match(detail, /Abrir en Ventas|GROWTH_PERSONAS_OPEN_IN_SALES/);
    assert.doesNotMatch(detail, /reply|composer|textarea/i);

    assert.match(page, /canOpenSales/);
    assert.match(page, /canOpenMessages/);
    assert.match(page, /growth\.sales\.(view|read|operate)/);
  });
});

describe("OT-GROWTH-PERSONAS-IMPLEMENT-003 — crear V–AB", () => {
  it("V–AA — creación manual usa upsertGrowthPersona + origin manual", async () => {
    const store = createMemoryGrowthPersonaStore();
    const created = await createGrowthPersonaWithStore(store, {
      tenantId: "tenant-a",
      displayName: "María López",
      email: "maria@example.com",
      actorUserId: "user-1",
      now: "2026-09-12T12:00:00.000Z",
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    assert.equal(created.outcome, "created");
    assert.equal(created.message, GROWTH_PERSONAS_CREATED_MESSAGE);

    const personaDoc = await store.findById("tenant-a", created.personaId);
    assert.ok(personaDoc);
    assert.equal(personaDoc?.origin.kind, "manual");
    assert.equal(personaDoc?.displayName, "María López");

    const matched = await createGrowthPersonaWithStore(store, {
      tenantId: "tenant-a",
      displayName: "María L.",
      email: "maria@example.com",
      actorUserId: "user-1",
      now: "2026-09-12T12:05:00.000Z",
    });
    assert.equal(matched.ok, true);
    if (!matched.ok) return;
    assert.equal(matched.outcome, "matched");
    assert.equal(matched.message, GROWTH_PERSONAS_MATCHED_MESSAGE);
    assert.equal(matched.personaId, created.personaId);
  });

  it("Y — identity_conflict sin merge ni IDs en respuesta", async () => {
    const store = createMemoryGrowthPersonaStore();
    await upsertGrowthPersona(store, {
      tenantId: "tenant-a",
      displayName: "Email Owner",
      email: "conflict@example.com",
      origin: {
        kind: "manual",
        sourceCollection: "t",
        sourceId: "e1",
      },
    });
    await upsertGrowthPersona(store, {
      tenantId: "tenant-a",
      displayName: "Phone Owner",
      phone: "+56911112222",
      origin: {
        kind: "manual",
        sourceCollection: "t",
        sourceId: "p1",
      },
    });

    const conflict = await createGrowthPersonaWithStore(store, {
      tenantId: "tenant-a",
      displayName: "Conflicto",
      email: "conflict@example.com",
      phone: "+56911112222",
      actorUserId: "user-1",
    });
    assert.equal(conflict.ok, false);
    if (conflict.ok) return;
    assert.equal(conflict.code, "identity_conflict");
    assert.equal(conflict.message, GROWTH_PERSONAS_CONFLICT_MESSAGE);
    assert.doesNotMatch(JSON.stringify(conflict), /emailPersonaId|phonePersonaId/);
    assert.doesNotMatch(conflict.message, /[a-f0-9]{24}/i);
  });

  it("Z — validación nombre / email o teléfono", async () => {
    const store = createMemoryGrowthPersonaStore();
    const noName = await createGrowthPersonaWithStore(store, {
      tenantId: "tenant-a",
      displayName: "  ",
      email: "a@example.com",
      actorUserId: "u1",
    });
    assert.equal(noName.ok, false);

    const noContact = await createGrowthPersonaWithStore(store, {
      tenantId: "tenant-a",
      displayName: "Sin contacto",
      actorUserId: "u1",
    });
    assert.equal(noContact.ok, false);
    if (!noContact.ok) {
      assert.equal(noContact.message, GROWTH_PERSONAS_VALIDATION_MESSAGE);
    }

    const badContact = await createGrowthPersonaWithStore(store, {
      tenantId: "tenant-a",
      displayName: "Inválido",
      email: "   ",
      phone: "abc",
      actorUserId: "u1",
    });
    assert.equal(badContact.ok, false);
  });

  it("AB — aislamiento tenant en create/dedupe", async () => {
    const store = createMemoryGrowthPersonaStore();
    const adl = await createGrowthPersonaWithStore(store, {
      tenantId: "adl",
      displayName: "Persona ADL",
      email: "shared@example.com",
      actorUserId: "u1",
    });
    assert.equal(adl.ok, true);
    if (!adl.ok) return;

    const sem = await createGrowthPersonaWithStore(store, {
      tenantId: "sem",
      displayName: "Persona SEM",
      email: "shared@example.com",
      actorUserId: "u1",
    });
    assert.equal(sem.ok, true);
    if (!sem.ok) return;
    assert.equal(sem.outcome, "created");
    assert.notEqual(sem.personaId, adl.personaId);

    assert.equal(await store.findById("sem", adl.personaId), null);
    assert.equal(await store.findById("adl", sem.personaId), null);
  });
});

describe("OT-GROWTH-PERSONAS-IMPLEMENT-003 — AC–AF / no alcance", () => {
  it("AC — detalle null indistinguible (findById tenant-scoped)", () => {
    const page = readSrc("src/app/admin/personas/[id]/page.tsx");
    assert.match(page, /No encontramos esta Persona/);
    assert.match(page, /getGrowthPersonaDetailView\(tenantId/);
    assert.match(page, /otro Espacio|Espacio/i);
  });

  it("AD — no persona.nextAction; proyecta pickPrimaryNextAction", () => {
    const detail = toPersonaDetailView(
      persona({ _id: "p1" }),
      [
        oportunidad({
          _id: "o1",
          personaId: "p1",
          nextAction: {
            kind: "contact",
            summary: "Llamar",
            setAt: "2026-09-02T10:00:00.000Z",
          },
        }),
      ],
      [] as GrowthActivity[]
    );
    assert.ok(detail.primaryNextAction);
    assert.equal(detail.primaryNextAction?.summary, "Llamar");
    assert.equal(
      pickPrimaryNextAction([
        oportunidad({
          _id: "o1",
          personaId: "p1",
          nextAction: {
            kind: "contact",
            summary: "Llamar",
            setAt: "2026-09-02T10:00:00.000Z",
          },
        }),
      ])?.summary,
      "Llamar"
    );

    const createSrc = readSrc("src/lib/growth/personas-create.ts");
    const detailSrc = readSrc("src/lib/growth/persona-view.ts");
    assert.doesNotMatch(createSrc, /persona\.nextAction|nextAction:/);
    assert.match(detailSrc, /pickPrimaryNextAction/);
    assert.doesNotMatch(detailSrc, /personaNextAction|nextAction:.*persona/i);
  });

  it("AE — no segundo inbox / timeline / CRM / rutas nuevas", () => {
    assert.equal(existsSync(resolve(process.cwd(), "src/app/admin/contactos")), false);
    assert.equal(existsSync(resolve(process.cwd(), "src/app/admin/leads")), false);
    assert.equal(
      existsSync(resolve(process.cwd(), "src/app/admin/personas/nueva")),
      false
    );
    const detail = readSrc(
      "src/components/admin/growth/PersonaDetailClient.tsx"
    );
    assert.doesNotMatch(detail, /MensajesInboxClient|mini.?inbox/i);
    assert.match(detail, /growth_actividades|GROWTH_TIMELINE|Qué ha pasado/);
  });

  it("AF — API create usa upsertGrowthPersona; sin escritura directa", () => {
    const create = readSrc("src/lib/growth/personas-create.ts");
    assert.match(create, /upsertGrowthPersona/);
    assert.doesNotMatch(create, /\.insertOne\(|store\.insert\(/);
    assert.match(create, /kind:\s*"manual"/);
  });

  it("superficie archivos clave existe", () => {
    for (const rel of [
      "src/app/api/growth/personas/route.ts",
      "src/lib/growth/personas-create.ts",
      "src/lib/growth/personas-read.ts",
      "src/app/admin/personas/page.tsx",
      "src/app/admin/personas/[id]/page.tsx",
      "docs/AI/auditorias/OT-GROWTH-PERSONAS-CONTRACT-002.md",
    ]) {
      assert.ok(existsSync(resolve(process.cwd(), rel)), rel);
    }
  });
});
