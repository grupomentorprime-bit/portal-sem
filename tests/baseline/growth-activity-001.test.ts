/**
 * OT-GROWTH-ACTIVITY-001 — lectura comercial unificada de Actividad V1.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { humanizeHomeActivityStory } from "../../src/components/admin/preview/growth-os-master/humanize-home-activity";
import { GROWTH_AUTOMATION_SYSTEM_ACTOR } from "../../src/core/growth/automations/types";
import type { GrowthActivity } from "../../src/core/growth/types";
import {
  dedupeHandoffTransitions,
  encodeActividadFeedCursor,
  decodeActividadFeedCursor,
  filterActividadFeedByCategory,
  growthActividadActorSystemLabel,
  isGrowthAutomationActor,
  paginateActividadFeed,
  projectActivityToFeedItem,
  projectMessageToFeedItem,
  resolveGrowthActividadCategory,
  sortActividadFeedNewestFirst,
  type GrowthActividadFeedItem,
} from "../../src/lib/growth/actividad-view";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

function existsSrc(rel: string): boolean {
  return existsSync(resolve(process.cwd(), rel));
}

function activity(partial: Partial<GrowthActivity> & Pick<GrowthActivity, "kind" | "summary">): GrowthActivity {
  return {
    _id: partial._id ?? "act-1",
    tenantId: partial.tenantId ?? "SEM",
    personaId: partial.personaId ?? "p-1",
    kind: partial.kind,
    summary: partial.summary,
    occurredAt: partial.occurredAt ?? "2026-09-11T12:00:00.000Z",
    ...(partial.oportunidadId ? { oportunidadId: partial.oportunidadId } : {}),
    ...(partial.actorUserId ? { actorUserId: partial.actorUserId } : {}),
    ...(partial.payload ? { payload: partial.payload } : {}),
    ...(partial.sourceId ? { sourceId: partial.sourceId } : {}),
    ...(partial.sourceCollection
      ? { sourceCollection: partial.sourceCollection }
      : {}),
    ...(partial.eventId ? { eventId: partial.eventId } : {}),
  };
}

describe("OT-GROWTH-ACTIVITY-001 — superficie y separación", () => {
  it("crea /admin/actividad y conserva /admin/settings/activity como auditoría", () => {
    assert.equal(existsSrc("src/app/admin/actividad/page.tsx"), true);
    assert.equal(existsSrc("src/app/admin/settings/activity/page.tsx"), true);
    assert.equal(existsSrc("src/app/api/growth/actividad/route.ts"), true);
    assert.equal(existsSrc("src/lib/growth/actividad-read.ts"), true);
    assert.equal(existsSrc("src/lib/growth/actividad-view.ts"), true);

    const page = readSrc("src/app/admin/actividad/page.tsx");
    assert.match(page, /listGrowthActividadFeed/);
    assert.match(page, /growth\.sales\.read/);
    assert.match(page, /growth\.sales\.operate/);
    assert.doesNotMatch(page, /identity\.audit\.read/);
    assert.doesNotMatch(page, /identity_audit|core_events/);

    const settings = readSrc("src/app/admin/settings/activity/page.tsx");
    assert.match(settings, /ActivityClient/);
    assert.match(settings, /Mi actividad/);
  });

  it("nav comercial apunta a /admin/actividad; auditoría Identity queda en Ajustes", () => {
    const nav = readSrc("src/lib/admin/nav-domains.ts");
    assert.match(
      nav,
      /id: "nav-actividad"[\s\S]*?href: "\/admin\/actividad"/
    );
    assert.match(
      nav,
      /requiredAnyPermission: \["growth\.sales\.read", "growth\.sales\.operate"\]/
    );
    assert.match(nav, /href: "\/admin\/settings\/activity"/);
    assert.match(
      nav,
      /id: "config-activity-audit"[\s\S]*?identity\.audit\.read/
    );
  });

  it("API no usa permiso de auditoría Identity ni lee bus/audit", () => {
    const api = readSrc("src/app/api/growth/actividad/route.ts");
    const read = readSrc("src/lib/growth/actividad-read.ts");
    assert.match(api, /growth\.sales\.read/);
    assert.doesNotMatch(api, /can\(ctx,\s*"identity\.audit\.read"\)/);
    assert.doesNotMatch(api, /requirePermission\("identity\.audit\.read"\)/);
    assert.doesNotMatch(read, /\.collection\([^\)]*core_events/);
    assert.doesNotMatch(read, /\.collection\([^\)]*identity_audit/);
    assert.match(read, /GROWTH_ACTIVIDADES_COLLECTION/);
    assert.match(read, /GROWTH_MENSAJES_COLLECTION/);
    assert.match(read, /GROWTH_CONVERSACIONES_COLLECTION/);
  });
});

describe("OT-GROWTH-ACTIVITY-001 — contrato A–L", () => {
  it("A/B — toda lectura exige tenantId del Espacio (sin cruce)", () => {
    const read = readSrc("src/lib/growth/actividad-read.ts");
    assert.match(read, /listGrowthActividadFeed\(\s*tenantId/);
    assert.match(read, /find\(\{ tenantId/);
    assert.match(read, /find\(\{\s*tenantId,\s*_id: \{ \$in: personaIds \}/);
    assert.match(
      read,
      /find\(\{\s*tenantId,\s*_id: \{ \$in: oportunidadIds \}/
    );
    assert.match(
      read,
      /find\(\{\s*tenantId,\s*_id: \{ \$in: conversationIds \}/
    );
    assert.match(read, /identity_memberships[\s\S]*tenantId/);
    assert.doesNotMatch(read, /SEM_TENANT_ID|ADL_TENANT_ID/);
  });

  it("C — actividad comercial se proyecta una sola vez (id estable activity:)", () => {
    const item = projectActivityToFeedItem({
      activity: activity({
        _id: "a1",
        kind: "note",
        summary: "Nota",
        actorUserId: "user-1",
      }),
      personaLabel: "María",
      actorLabel: "Ana",
    });
    assert.ok(item);
    assert.equal(item!.id, "activity:a1");
    assert.equal(item!.category, "ventas");
  });

  it("D — mensajes se proyectan una sola vez desde growth_mensajes", () => {
    const item = projectMessageToFeedItem({
      message: {
        _id: "m1",
        direction: "inbound",
        channel: "whatsapp",
        occurredAt: "2026-09-11T13:00:00.000Z",
        body: "Hola",
      },
      personaId: "p1",
      personaLabel: "María",
      actorLabel: "María",
      channel: "whatsapp",
    });
    assert.equal(item.id, "message:m1");
    assert.equal(item.category, "mensajes");
    assert.equal(item.story, "María envió un mensaje por WhatsApp.");
    assert.equal(item.channel, "WhatsApp");
  });

  it("E/F — Event Bus y auditoría Identity no alimentan el feed (fuentes solo growth_*)", () => {
    const read = readSrc("src/lib/growth/actividad-read.ts");
    assert.doesNotMatch(read, /\.collection\([^\)]*core_events/);
    assert.doesNotMatch(read, /\.collection\([^\)]*identity_audit/);
    assert.doesNotMatch(read, /DOMAIN_EVENT|GrowthMessageReceived|GrowthActivityRecorded/);
  });

  it("G — automatización aparece como Growth OS", () => {
    assert.equal(isGrowthAutomationActor(GROWTH_AUTOMATION_SYSTEM_ACTOR), true);
    assert.equal(growthActividadActorSystemLabel(), "Growth OS");
    assert.equal(
      resolveGrowthActividadCategory("note", GROWTH_AUTOMATION_SYSTEM_ACTOR),
      "automatizaciones"
    );

    const item = projectActivityToFeedItem({
      activity: activity({
        kind: "next_action_set",
        summary: "Próxima acción: Llamar",
        actorUserId: GROWTH_AUTOMATION_SYSTEM_ACTOR,
        payload: { dueAt: "2026-09-12T15:00:00.000Z" },
      }),
      personaLabel: "Pedro",
      actorLabel: "Growth OS",
      dueLabel: "mañana",
    });
    assert.ok(item);
    assert.equal(item!.actorLabel, "Growth OS");
    assert.equal(
      item!.story,
      "Growth OS programó un seguimiento para mañana."
    );
  });

  it("H — estados técnicos quedan humanizados", () => {
    assert.equal(
      humanizeHomeActivityStory({
        kind: "opportunity_transitioned",
        summary: "Oportunidad open → active",
        personaName: "Pedro",
        variant: "feed",
      }).story,
      "Pedro pasó a En seguimiento."
    );
    assert.equal(
      humanizeHomeActivityStory({
        kind: "opportunity_opened",
        summary: "Oportunidad abierta (inquiry)",
        variant: "feed",
        captureOrigin: "form",
      }).story,
      "Formulario web creó una nueva oportunidad."
    );
    assert.doesNotMatch(
      humanizeHomeActivityStory({
        kind: "opportunity_transitioned",
        summary: "Oportunidad open → active",
        variant: "feed",
      }).story,
      /\bopen\b|→|active|typeKey|GrowthActivityRecorded/
    );
  });

  it("I — identity_conflict queda oculto", () => {
    assert.equal(
      resolveGrowthActividadCategory("identity_conflict", undefined),
      null
    );
    const hidden = projectActivityToFeedItem({
      activity: activity({
        kind: "identity_conflict",
        summary: "Conflicto",
      }),
      personaLabel: "X",
      actorLabel: "Sistema",
    });
    assert.equal(hidden, null);
  });

  it("J — filtros devuelven únicamente su categoría", () => {
    const items: GrowthActividadFeedItem[] = [
      {
        id: "activity:1",
        category: "personas",
        story: "a",
        personaId: "p",
        personaLabel: "A",
        actorLabel: "Formulario web",
        occurredAt: "2026-09-11T10:00:00.000Z",
      },
      {
        id: "activity:2",
        category: "ventas",
        story: "b",
        personaId: "p",
        personaLabel: "A",
        actorLabel: "Ana",
        occurredAt: "2026-09-11T11:00:00.000Z",
      },
      {
        id: "message:3",
        category: "mensajes",
        story: "c",
        personaId: "p",
        personaLabel: "A",
        actorLabel: "A",
        occurredAt: "2026-09-11T12:00:00.000Z",
        channel: "WhatsApp",
      },
      {
        id: "activity:4",
        category: "automatizaciones",
        story: "d",
        personaId: "p",
        personaLabel: "A",
        actorLabel: "Growth OS",
        occurredAt: "2026-09-11T13:00:00.000Z",
      },
    ];

    assert.equal(filterActividadFeedByCategory(items, "all").length, 4);
    assert.deepEqual(
      filterActividadFeedByCategory(items, "personas").map((i) => i.id),
      ["activity:1"]
    );
    assert.deepEqual(
      filterActividadFeedByCategory(items, "ventas").map((i) => i.id),
      ["activity:2"]
    );
    assert.deepEqual(
      filterActividadFeedByCategory(items, "mensajes").map((i) => i.id),
      ["message:3"]
    );
    assert.deepEqual(
      filterActividadFeedByCategory(items, "automatizaciones").map((i) => i.id),
      ["activity:4"]
    );
  });

  it("K — orden descendente por occurredAt", () => {
    const sorted = sortActividadFeedNewestFirst([
      {
        id: "activity:old",
        category: "ventas",
        story: "old",
        personaId: "p",
        personaLabel: "A",
        actorLabel: "Ana",
        occurredAt: "2026-09-10T10:00:00.000Z",
      },
      {
        id: "activity:new",
        category: "ventas",
        story: "new",
        personaId: "p",
        personaLabel: "A",
        actorLabel: "Ana",
        occurredAt: "2026-09-11T10:00:00.000Z",
      },
    ]);
    assert.equal(sorted[0].id, "activity:new");
    assert.equal(sorted[1].id, "activity:old");
  });

  it("L — paginación estable por cursor (occurredAt + id)", () => {
    const items: GrowthActividadFeedItem[] = Array.from({ length: 5 }, (_, i) => ({
      id: `activity:${5 - i}`,
      category: "ventas" as const,
      story: `s${5 - i}`,
      personaId: "p",
      personaLabel: "A",
      actorLabel: "Ana",
      occurredAt: `2026-09-11T1${5 - i}:00:00.000Z`,
    }));
    const page1 = paginateActividadFeed(items, 2);
    assert.equal(page1.items.length, 2);
    assert.ok(page1.nextCursor);
    const cursor = decodeActividadFeedCursor(page1.nextCursor);
    assert.ok(cursor);
    const page2 = paginateActividadFeed(items, 2, cursor);
    assert.equal(page2.items.length, 2);
    assert.notEqual(page2.items[0].id, page1.items[0].id);
    const roundTrip = decodeActividadFeedCursor(
      encodeActividadFeedCursor(cursor!)
    );
    assert.deepEqual(roundTrip, cursor);
  });

  it("handoff + transition no duplican la historia", () => {
    const rows = dedupeHandoffTransitions([
      activity({
        _id: "t1",
        kind: "opportunity_transitioned",
        summary: "Oportunidad active → handed_off",
        sourceId: "src-1",
        oportunidadId: "opp-1",
        occurredAt: "2026-09-11T12:00:00.000Z",
        payload: { toState: "handed_off" },
      }),
      activity({
        _id: "h1",
        kind: "handoff",
        summary: "Handoff registrado",
        sourceId: "src-1",
        oportunidadId: "opp-1",
        occurredAt: "2026-09-11T12:00:00.000Z",
      }),
    ]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].kind, "handoff");
  });

  it("contrato del item no expone campos técnicos", () => {
    const item = projectActivityToFeedItem({
      activity: activity({
        _id: "a9",
        kind: "form_submitted",
        summary: "Solicitud recibida",
        tenantId: "SEM",
        eventId: "evt-secret",
        payload: { typeKey: "inquiry" },
      }),
      personaLabel: "María",
      actorLabel: "Formulario web",
      captureOrigin: "form",
    });
    assert.ok(item);
    const json = JSON.stringify(item);
    assert.doesNotMatch(json, /tenantId|eventId|payload|typeKey|claims|growth_actividades/);
    assert.equal(item!.personaLabel, "María");
    assert.equal(item!.actorLabel, "Formulario web");
  });
});

describe("OT-GROWTH-ACTIVITY-001 — índices", () => {
  it("agrega tenantId+occurredAt en actividades y mensajes", () => {
    const growthIdx = readSrc("src/core/growth/indexes.ts");
    const msgIdx = readSrc("src/core/growth/messaging/indexes.ts");
    assert.match(growthIdx, /tenantId_occurredAt/);
    assert.match(growthIdx, /keys: \{ tenantId: 1, occurredAt: -1 \}/);
    assert.match(msgIdx, /tenantId_occurredAt/);
    assert.match(msgIdx, /keys: \{ tenantId: 1, occurredAt: -1 \}/);
  });
});
