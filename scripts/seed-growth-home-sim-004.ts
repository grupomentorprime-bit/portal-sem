/**
 * Simulación reversible para llenar el Home Growth OS (OT-GROWTH-UX-HOME-004).
 *
 * - Respeta las etapas abiertas del embudo del Espacio.
 * - Etiqueta captureTag = "home-sim-004" (borrado selectivo).
 * - No modifica filas sin esa etiqueta.
 *
 * Uso:
 *   CAPTURE_TENANT_ID=cumple npx tsx --env-file=.env scripts/seed-growth-home-sim-004.ts
 *   CAPTURE_TENANT_ID=cumple npx tsx --env-file=.env scripts/seed-growth-home-sim-004.ts cleanup
 */
import { MongoClient, type Db } from "mongodb";

const TAG = "home-sim-004";
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
if (!uri || !dbName) {
  console.error("Faltan MONGODB_URI / MONGODB_DB");
  process.exit(1);
}

const tenantId = process.env.CAPTURE_TENANT_ID?.trim() || "cumple";
const mode = process.argv[2] === "cleanup" ? "cleanup" : "seed";

function isoDaysAgo(days: number, hour = 12): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hour, Math.floor(Math.random() * 40), 0, 0);
  return d.toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString();
}

function id(suffix: string): string {
  return `${TAG}-${suffix}`;
}

const RESULT_KEYS = new Set(["won", "lost", "archived", "handed_off"]);

type OriginSpec = {
  kind: "form" | "manual" | "event" | "admission";
  channel?: string;
  campaign?: boolean;
};

type PersonSeed = {
  key: string;
  displayName: string;
  stageKey: string;
  openedDaysAgo: number;
  closedDaysAgo?: number;
  origin: OriginSpec;
  owner: "marco" | "none";
  attention?: "overdue" | "unfollowed" | "stale" | "current";
  subjectLabel: string;
};

const NAMES = [
  "Juan Carlos Pérez",
  "Laura Méndez",
  "Andrés Soto",
  "Valeria Núñez",
  "Daniela Rojas",
  "Carlos Ibáñez",
  "Fernanda Lagos",
  "Pedro Salas",
  "Camila Ortiz",
  "Ignacio Vega",
  "Sofía Herrera",
  "Martín Castillo",
  "Paula Jiménez",
  "Ricardo Muñoz",
  "Elena Vargas",
  "Diego Fuentes",
  "Antonia Reyes",
  "Gabriel Paredes",
  "Constanza Silva",
  "Tomás Bravo",
  "Isidora Molina",
  "Benjamín Castro",
  "Javiera León",
  "Matías Contreras",
];

async function cleanup(db: Db): Promise<void> {
  const byTag = { captureTag: TAG, tenantId };
  const byIdPrefix = { _id: { $regex: `^${TAG}-` } };
  const collections = [
    "growth_actividades",
    "growth_oportunidades",
    "growth_personas",
    "growth_campaigns",
  ] as const;
  for (const name of collections) {
    const a = await db.collection(name).deleteMany(byTag);
    const b = await db.collection(name).deleteMany(byIdPrefix);
    console.log(`cleanup ${name}: tag=${a.deletedCount} idPrefix=${b.deletedCount}`);
  }
}

function buildPeople(openStages: Array<{ key: string; label: string }>): PersonSeed[] {
  const people: PersonSeed[] = [];
  let nameIdx = 0;
  const nextName = () => NAMES[nameIdx++ % NAMES.length]!;

  // Distribución decreciente por etapa abierta (aspecto de embudo)
  const counts = openStages.map((_, i) => Math.max(1, openStages.length - i + 1));
  // p.ej. 5 etapas → 6,5,4,3,2
  openStages.forEach((stage, stageIndex) => {
    const n = counts[stageIndex] ?? 1;
    for (let i = 0; i < n; i++) {
      const key = `${String(stageIndex + 1).padStart(2, "0")}${String(i + 1).padStart(2, "0")}`;
      const origins: OriginSpec[] = [
        { kind: "form", channel: "web" },
        { kind: "form", channel: "whatsapp" },
        { kind: "form", channel: "web", campaign: true },
        { kind: "event", channel: "referido" },
        { kind: "admission", channel: "portal" },
        { kind: "manual", channel: "registro" },
      ];
      const origin = origins[(stageIndex + i) % origins.length]!;
      const attentionCycle: Array<PersonSeed["attention"]> = [
        "overdue",
        "unfollowed",
        "stale",
        "current",
        "overdue",
      ];
      people.push({
        key,
        displayName: nextName(),
        stageKey: stage.key,
        openedDaysAgo: 2 + stageIndex * 3 + i,
        origin,
        owner: i % 3 === 0 ? "none" : "marco",
        attention: attentionCycle[i % attentionCycle.length],
        subjectLabel: stage.label,
      });
    }
  });

  // Ganadas del período (para KPI + cohorte)
  for (let i = 0; i < 5; i++) {
    people.push({
      key: `w${i + 1}`,
      displayName: nextName(),
      stageKey: "won",
      openedDaysAgo: 18 + i,
      closedDaysAgo: 1 + i,
      origin:
        i % 2 === 0
          ? { kind: "form", channel: "web", campaign: true }
          : { kind: "form", channel: "whatsapp" },
      owner: "marco",
      subjectLabel: "Cierre ganado",
    });
  }

  // Una pérdida
  people.push({
    key: "l1",
    displayName: nextName(),
    stageKey: "lost",
    openedDaysAgo: 20,
    closedDaysAgo: 4,
    origin: { kind: "manual", channel: "registro" },
    owner: "none",
    subjectLabel: "Sin respuesta",
  });

  return people;
}

async function seed(db: Db): Promise<void> {
  await cleanup(db);

  const membership = await db.collection("identity_memberships").findOne({
    tenantId,
    status: "active",
  });
  if (!membership?.userId) {
    throw new Error(`Sin membresía activa en tenant ${tenantId}`);
  }
  const marcoId = String(membership.userId);

  const funnel = await db.collection("growth_funnels").findOne({ tenantId });
  const funnelKey = String(funnel?.key ?? "default");
  const defKey = String(
    funnel?.workflowDefinitionKey ?? "growth.opportunity.default"
  );
  const definition = await db.collection("workflow_definitions").findOne({
    tenantId,
    key: defKey,
  });
  const allStates =
    (definition?.states as Array<{ key: string; label: string }> | undefined) ??
    [];
  const openStages = allStates.filter((s) => !RESULT_KEYS.has(s.key));
  if (openStages.length === 0) {
    throw new Error(`Sin etapas abiertas en embudo de ${tenantId}`);
  }
  console.log(
    "openStages",
    openStages.map((s) => `${s.key}:${s.label}`).join(", ")
  );

  let campaignTracking = "home-sim-campana";
  const existingCampaign = await db.collection("growth_campaigns").findOne({
    tenantId,
  });
  if (
    existingCampaign &&
    typeof existingCampaign.trackingKey === "string" &&
    existingCampaign.trackingKey.trim()
  ) {
    campaignTracking = existingCampaign.trackingKey.trim();
  } else {
    await db.collection("growth_campaigns").insertOne({
      _id: id("campaign"),
      tenantId,
      name: "Campaña simulación Home",
      trackingKey: campaignTracking,
      status: "active",
      createdAt: isoDaysAgo(30),
      updatedAt: isoDaysAgo(0),
      captureTag: TAG,
    });
  }

  const people = buildPeople(openStages);
  const personas: Record<string, unknown>[] = [];
  const oportunidades: Record<string, unknown>[] = [];
  const actividades: Record<string, unknown>[] = [];

  const pushAct = (doc: Record<string, unknown>) => {
    const actId = String(doc._id);
    actividades.push({ ...doc, ingestKey: actId, captureTag: TAG });
  };

  let phoneSeq = 0;
  for (const spec of people) {
    const personaId = id(`persona-${spec.key}`);
    const oportunidadId = id(`opp-${spec.key}`);
    const openedAt = isoDaysAgo(spec.openedDaysAgo, 10);
    const closedAt =
      spec.closedDaysAgo != null ? isoDaysAgo(spec.closedDaysAgo, 16) : undefined;
    const updatedAt = closedAt ?? isoDaysAgo(Math.min(spec.openedDaysAgo, 2), 15);
    const isOpen = !RESULT_KEYS.has(spec.stageKey);

    const origin = {
      kind: spec.origin.kind,
      channel: spec.origin.channel,
      campaign: spec.origin.campaign ? campaignTracking : undefined,
      sourceCollection: "home_sim",
      sourceId: id(`src-${spec.key}`),
      capturedAt: openedAt,
    };

    phoneSeq += 1;
    const phoneDigits = `5698${String(phoneSeq).padStart(7, "0")}`;
    personas.push({
      _id: personaId,
      tenantId,
      status: "active",
      displayName: spec.displayName,
      firstName: spec.displayName.split(" ")[0],
      lastName: spec.displayName.split(" ").slice(1).join(" "),
      email: `${spec.key}.${TAG}@example.invalid`,
      emailNormalized: `${spec.key}.${TAG}@example.invalid`,
      phone: `+56 9 ${phoneDigits.slice(4, 8)} ${phoneDigits.slice(8)}`,
      phoneNormalized: phoneDigits,
      emails: [],
      phones: [
        {
          value: `+56 9 ${phoneDigits.slice(4)}`,
          normalized: phoneDigits,
          firstSeenAt: openedAt,
          lastSeenAt: openedAt,
        },
      ],
      origin,
      createdAt: openedAt,
      updatedAt,
      captureTag: TAG,
    });

    let nextAction: Record<string, unknown> | null = null;
    let lastActivityAt = updatedAt;
    if (isOpen) {
      if (spec.attention === "overdue") {
        nextAction = {
          summary: "Llamar para avanzar propuesta",
          kind: "contact",
          dueAt: isoDaysAgo(4, 9),
          setAt: isoDaysAgo(7, 11),
          assigneeUserId: marcoId,
        };
        lastActivityAt = isoDaysAgo(3, 14);
      } else if (spec.attention === "unfollowed") {
        nextAction = null;
        lastActivityAt = openedAt;
      } else if (spec.attention === "stale") {
        nextAction = {
          summary: "Enviar material de programa",
          kind: "review",
          dueAt: isoDaysAgo(-5, 12),
          setAt: isoDaysAgo(14, 11),
        };
        lastActivityAt = isoDaysAgo(14, 10);
      } else {
        nextAction = {
          summary: "Confirmar interés esta semana",
          kind: "contact",
          dueAt: isoDaysAgo(-3, 12),
          setAt: isoDaysAgo(1, 11),
          assigneeUserId: marcoId,
        };
        lastActivityAt = hoursAgo(6);
      }
    }

    oportunidades.push({
      _id: oportunidadId,
      tenantId,
      personaId,
      typeKey: "inquiry",
      subjectType: "program",
      subjectLabel: spec.subjectLabel,
      origin,
      status: spec.stageKey,
      funnelKey,
      ownerUserId: spec.owner === "marco" ? marcoId : undefined,
      workflowInstanceId: id(`wf-${spec.key}`),
      nextAction,
      lastActivityAt,
      source: {
        sourceCollection: "home_sim",
        sourceId: id(`src-${spec.key}`),
      },
      openedAt,
      updatedAt,
      closedAt,
      captureTag: TAG,
    });

    pushAct({
      _id: id(`act-open-${spec.key}`),
      tenantId,
      personaId,
      oportunidadId,
      kind: "opportunity_opened",
      summary: `Oportunidad abierta (${spec.subjectLabel})`,
      occurredAt: openedAt,
      payload: { status: "open" },
    });

    if (spec.owner === "marco") {
      pushAct({
        _id: id(`act-assign-${spec.key}`),
        tenantId,
        personaId,
        oportunidadId,
        kind: "opportunity_assigned",
        summary: "Se asignó responsable",
        occurredAt: isoDaysAgo(spec.openedDaysAgo, 11),
        payload: { toUserId: marcoId },
      });
    }

    // Cadena de transiciones hasta la etapa actual
    const path = ["open", ...openStages.map((s) => s.key).filter((k) => k !== "open")];
    // unique path in funnel order
    const orderedKeys = openStages.map((s) => s.key);
    const targetIndex = orderedKeys.indexOf(
      isOpen ? spec.stageKey : orderedKeys[orderedKeys.length - 1]!
    );
    for (let i = 0; i < Math.max(targetIndex, 0); i++) {
      const from = orderedKeys[i]!;
      const to = orderedKeys[i + 1]!;
      pushAct({
        _id: id(`act-move-${spec.key}-${i}`),
        tenantId,
        personaId,
        oportunidadId,
        kind: "opportunity_transitioned",
        summary: `Oportunidad ${from} → ${to}`,
        occurredAt: isoDaysAgo(Math.max(spec.openedDaysAgo - i - 1, 0), 13 + i),
        payload: { fromState: from, toState: to },
      });
    }

    if (spec.stageKey === "won" && closedAt) {
      const from =
        orderedKeys[orderedKeys.length - 1] ?? orderedKeys[0] ?? "active";
      pushAct({
        _id: id(`act-won-${spec.key}`),
        tenantId,
        personaId,
        oportunidadId,
        kind: "opportunity_transitioned",
        summary: `Oportunidad ${from} → won`,
        occurredAt: closedAt,
        payload: { fromState: from, toState: "won" },
      });
      pushAct({
        _id: id(`act-note-won-${spec.key}`),
        tenantId,
        personaId,
        oportunidadId,
        kind: "note",
        summary: "Oportunidad ganada",
        occurredAt: closedAt,
      });
    }

    if (spec.stageKey === "lost" && closedAt) {
      pushAct({
        _id: id(`act-lost-${spec.key}`),
        tenantId,
        personaId,
        oportunidadId,
        kind: "opportunity_transitioned",
        summary: "Oportunidad active → lost",
        occurredAt: closedAt,
        payload: { fromState: "active", toState: "lost" },
      });
    }

    if (isOpen && (spec.attention === "overdue" || spec.attention === "current")) {
      pushAct({
        _id: id(`act-next-${spec.key}`),
        tenantId,
        personaId,
        oportunidadId,
        kind: "next_action_set",
        summary: `Próxima acción: ${(nextAction?.summary as string) ?? "Seguimiento"}`,
        occurredAt: isoDaysAgo(Math.min(spec.openedDaysAgo, 4), 12),
      });
    }

    if (spec.origin.kind === "form") {
      pushAct({
        _id: id(`act-form-${spec.key}`),
        tenantId,
        personaId,
        oportunidadId,
        kind: "form_submitted",
        summary: `${spec.displayName} envió un formulario.`,
        occurredAt: openedAt,
      });
    }

    if (spec.origin.channel === "whatsapp") {
      pushAct({
        _id: id(`act-contact-${spec.key}`),
        tenantId,
        personaId,
        oportunidadId,
        kind: "contact",
        summary: `Contacto por WhatsApp con ${spec.displayName}`,
        occurredAt: isoDaysAgo(Math.max(spec.openedDaysAgo - 1, 0), 15),
      });
    }
  }

  // Feed reciente (últimas horas) — ids únicos por persona para evitar colisiones.
  const openPeople = people.filter((p) => !RESULT_KEYS.has(p.stageKey)).slice(0, 5);
  const recentStories = [
    { kind: "opportunity_assigned", summary: "Se asignó responsable", hours: 0.2 },
    {
      kind: "form_submitted",
      summary: "Se recibió diagnóstico",
      hours: 0.5,
    },
    {
      kind: "opportunity_transitioned",
      summary: "La oportunidad pasó a En seguimiento",
      hours: 1.2,
      payload: { fromState: "open", toState: "active" },
    },
    { kind: "note", summary: "Nuevo comentario en la oportunidad", hours: 2 },
    { kind: "note", summary: "Oportunidad ganada", hours: 3 },
  ] as const;
  openPeople.forEach((spec, idx) => {
    const story = recentStories[idx]!;
    pushAct({
      _id: id(`act-recent-${spec.key}`),
      tenantId,
      personaId: id(`persona-${spec.key}`),
      oportunidadId: id(`opp-${spec.key}`),
      kind: story.kind,
      summary:
        story.kind === "form_submitted"
          ? `Se recibió diagnóstico de ${spec.displayName}`
          : story.summary,
      occurredAt: hoursAgo(story.hours),
      payload: "payload" in story ? story.payload : undefined,
    });
  });

  // Evita E11000 si algún id se repite al armar el lote.
  const dedupe = <T extends { _id: unknown }>(rows: T[]): T[] => {
    const seen = new Set<string>();
    return rows.filter((row) => {
      const key = String(row._id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  await db.collection("growth_personas").insertMany(dedupe(personas as Array<{ _id: unknown }>));
  await db
    .collection("growth_oportunidades")
    .insertMany(dedupe(oportunidades as Array<{ _id: unknown }>));
  await db
    .collection("growth_actividades")
    .insertMany(dedupe(actividades as Array<{ _id: unknown }>));

  console.log(
    `seeded tenant=${tenantId} personas=${personas.length} opps=${oportunidades.length} acts=${actividades.length} stages=${openStages.length}`
  );
  console.log("Abre /admin?preset=last_30d en Mentor Cumple y recarga.");
  console.log(
    `Cleanup: CAPTURE_TENANT_ID=${tenantId} npx tsx --env-file=.env scripts/seed-growth-home-sim-004.ts cleanup`
  );
}

async function main() {
  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db(dbName!);
  try {
    if (mode === "cleanup") await cleanup(db);
    else await seed(db);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
