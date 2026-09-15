/**
 * OT-GROWTH-SMOKE-CLEANUP-001 — inventario / backup / borrado controlado
 * de residuos confirmados de smoke/tests en Mongo.
 *
 * Uso:
 *   npx tsx --env-file=.env scripts/ot-growth-smoke-cleanup-001.ts inventory [outfile]
 *   npx tsx --env-file=.env scripts/ot-growth-smoke-cleanup-001.ts delete
 *
 * inventory escribe por defecto inventory-before.json; pasar un outfile
 * (p.ej. inventory-after.json) para no sobrescribir el inventario previo.
 */
import { mkdirSync, writeFileSync, readFileSync } from "fs";
import { resolve } from "path";
import { MongoClient, ObjectId, type Db, type Document } from "mongodb";

function idVariants(raw: unknown): unknown[] {
  const out: unknown[] = [raw];
  const s = String(raw);
  if (s && s !== String(raw)) out.push(s);
  else if (typeof raw !== "string") out.push(s);
  if (/^[a-f0-9]{24}$/i.test(s)) {
    try {
      out.push(new ObjectId(s));
    } catch {
      /* ignore */
    }
  }
  return out;
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
if (!uri || !dbName) {
  console.error("Faltan MONGODB_URI / MONGODB_DB");
  process.exit(1);
}

const FORM_ID = "adl-smoke-info-request";
const CAPTURE_TAGS = [
  "capture-messaging-005",
  "capture-messaging-004a",
  "capture-messaging-004",
  "capture-channels-ux-001",
] as const;

const OUT_DIR = resolve("docs/AI/auditorias/OT-GROWTH-SMOKE-CLEANUP-001");
mkdirSync(OUT_DIR, { recursive: true });

type Candidate = {
  collection: string;
  filter: Document;
  tenant: string | null;
  _id: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  evidence: string;
  confirmedTest: boolean;
  preview: Document;
};

function tenantOf(doc: Document): string | null {
  const t = doc.tenantId ?? doc.tenant;
  return t == null ? null : String(t);
}

function preview(doc: Document, extra: string[] = []): Document {
  const keys = [
    "_id",
    "tenant",
    "tenantId",
    "createdAt",
    "updatedAt",
    "name",
    "email",
    "emailNormalized",
    "formId",
    "captureTag",
    "origin",
    "status",
    "typeKey",
    "summary",
    "phoneNumberId",
    "displayPhoneNumber",
    "personaId",
    "oportunidadId",
    "conversacionId",
    "programId",
    "firstName",
    "lastName",
    "destination",
    "active",
    "visible",
    "userId",
    "expiresAt",
    "type",
    "occurredAt",
    "startedAt",
    "runAt",
    ...extra,
  ];
  const out: Document = {};
  for (const k of keys) {
    if (doc[k] !== undefined) out[k] = doc[k];
  }
  if (doc.data !== undefined) {
    out.data = {
      email: (doc.data as Document)?.email,
      fullName: (doc.data as Document)?.fullName,
      message: (doc.data as Document)?.message,
    };
  }
  return out;
}

function toCandidate(
  collection: string,
  doc: Document,
  evidence: string,
  confirmedTest: boolean
): Candidate {
  return {
    collection,
    filter: { _id: doc._id },
    tenant: tenantOf(doc),
    _id: doc._id,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    evidence,
    confirmedTest,
    preview: preview(doc),
  };
}

async function collectCandidates(db: Db): Promise<{
  candidates: Candidate[];
  baselines: Document;
}> {
  const candidates: Candidate[] = [];

  // —— 1. experience_forms (caso conocido) ——
  const forms = await db
    .collection("experience_forms")
    .find({
      $or: [{ _id: FORM_ID }, { name: /smoke/i }, { _id: /smoke/i }],
    })
    .toArray();
  for (const d of forms) {
    const exact = String(d._id) === FORM_ID;
    const nameSmoke = /smoke captaci[oó]n/i.test(String(d.name || ""));
    candidates.push(
      toCandidate(
        "experience_forms",
        d,
        exact
          ? "FORM_ID exacto adl-smoke-info-request (scripts/smoke-growth-capture-001.ts)"
          : nameSmoke
            ? "name contiene 'smoke captación'"
            : "name/_id contiene 'smoke' — revisar",
        exact || nameSmoke
      )
    );
  }

  // —— 2. submissions del form smoke ——
  const submissions = await db
    .collection("experience_form_submissions")
    .find({
      $or: [
        { formId: FORM_ID },
        { "data.message": /Smoke CAPTURE/i },
        { "data.email": /^smoke\./i },
      ],
    })
    .toArray();
  for (const d of submissions) {
    const byForm = d.formId === FORM_ID;
    const byEmail = /^smoke\./i.test(String((d.data as Document)?.email || ""));
    const byMsg = /Smoke CAPTURE/i.test(String((d.data as Document)?.message || ""));
    candidates.push(
      toCandidate(
        "experience_form_submissions",
        d,
        byForm
          ? "formId=adl-smoke-info-request"
          : byEmail
            ? "data.email smoke.*"
            : "data.message Smoke CAPTURE",
        byForm || byEmail || byMsg
      )
    );
  }

  // —— 3. personas smoke / capture ——
  const personas = await db
    .collection("growth_personas")
    .find({
      $or: [
        { emailNormalized: /^smoke\./ },
        { email: /^smoke\./i },
        { displayName: /^Smoke /i },
        { fullName: /^Smoke /i },
        { "origin.sourceId": { $in: [...CAPTURE_TAGS] } },
        { "origin.sourceId": FORM_ID },
        { "origin.sourceId": /smoke/i },
      ],
    })
    .toArray();
  for (const d of personas) {
    const email = String(d.emailNormalized || d.email || "");
    const sourceId = String((d.origin as Document | undefined)?.sourceId || "");
    const byEmail = /^smoke\./i.test(email);
    const byCapture = (CAPTURE_TAGS as readonly string[]).includes(sourceId);
    const byFormOrigin = sourceId === FORM_ID || /smoke/i.test(sourceId);
    const byExampleName =
      /@example\.com$/i.test(email) &&
      /^Smoke /i.test(String(d.displayName || d.fullName || ""));
    candidates.push(
      toCandidate(
        "growth_personas",
        d,
        byEmail
          ? "emailNormalized smoke.* (CAPTURE-SMOKE-001)"
          : byCapture
            ? `origin.sourceId=${sourceId}`
            : byFormOrigin
              ? `origin.sourceId=${sourceId}`
              : byExampleName
                ? "example.com + nombre Smoke"
                : "marcador smoke — revisar",
        byEmail || byCapture || byFormOrigin || byExampleName
      )
    );
  }
  const personaIds = personas.map((p) => String(p._id));

  // —— 4. oportunidades / actividades ligadas ——
  const oppOr: Document[] = [
    { "origin.sourceId": { $in: [...CAPTURE_TAGS, FORM_ID] } },
    { _id: { $regex: "capture-messaging" } },
  ];
  if (personaIds.length) oppOr.push({ personaId: { $in: personaIds } });
  const opps = await db.collection("growth_oportunidades").find({ $or: oppOr }).toArray();
  for (const d of opps) {
    const linked = personaIds.includes(String(d.personaId));
    const sourceId = String((d.origin as Document | undefined)?.sourceId || "");
    const byId = String(d._id).includes("capture-messaging");
    candidates.push(
      toCandidate(
        "growth_oportunidades",
        d,
        linked
          ? "personaId → persona smoke confirmada"
          : byId
            ? "_id contiene capture-messaging"
            : `origin.sourceId=${sourceId}`,
        linked ||
          byId ||
          (CAPTURE_TAGS as readonly string[]).includes(sourceId) ||
          sourceId === FORM_ID
      )
    );
  }
  const oppIds = opps.map((o) => String(o._id));

  const actOr: Document[] = [
    { "origin.sourceId": { $in: [...CAPTURE_TAGS, FORM_ID] } },
    { summary: /Smoke CAPTURE/i },
  ];
  if (personaIds.length) actOr.push({ personaId: { $in: personaIds } });
  const acts = await db.collection("growth_actividades").find({ $or: actOr }).toArray();
  for (const d of acts) {
    const linked = personaIds.includes(String(d.personaId));
    const bySummary = /Smoke CAPTURE/i.test(String(d.summary || ""));
    candidates.push(
      toCandidate(
        "growth_actividades",
        d,
        linked ? "personaId → persona smoke confirmada" : "summary/origin smoke",
        linked || bySummary
      )
    );
  }

  // —— 5. conversaciones / mensajes capture ——
  const convOr: Document[] = [
    { _id: { $regex: "capture-messaging" } },
    { captureTag: { $in: [...CAPTURE_TAGS] } },
  ];
  if (personaIds.length) convOr.push({ personaId: { $in: personaIds } });
  const convs = await db.collection("growth_conversaciones").find({ $or: convOr }).toArray();
  for (const d of convs) {
    const byId = String(d._id).includes("capture-messaging");
    const linked = personaIds.includes(String(d.personaId));
    const byTag = (CAPTURE_TAGS as readonly string[]).includes(String(d.captureTag || ""));
    candidates.push(
      toCandidate(
        "growth_conversaciones",
        d,
        byId ? "_id capture-messaging" : linked ? "persona smoke" : `captureTag=${d.captureTag}`,
        byId || linked || byTag
      )
    );
  }
  const convIds = convs.map((c) => String(c._id));

  const msgOr: Document[] = [
    { _id: { $regex: "capture-messaging" } },
    { captureTag: { $in: [...CAPTURE_TAGS] } },
  ];
  if (convIds.length) msgOr.push({ conversacionId: { $in: convIds } });
  const msgs = await db.collection("growth_mensajes").find({ $or: msgOr }).toArray();
  for (const d of msgs) {
    const byId = String(d._id).includes("capture-messaging");
    const linked = convIds.includes(String(d.conversacionId || ""));
    candidates.push(
      toCandidate(
        "growth_mensajes",
        d,
        byId ? "_id capture-messaging" : "conversacionId → conv capture",
        byId || linked
      )
    );
  }

  // —— 6. whatsapp connections con captureTag ——
  const wa = await db
    .collection("growth_whatsapp_connections")
    .find({
      $or: [
        { captureTag: { $in: [...CAPTURE_TAGS] } },
        { phoneNumberId: { $regex: "^capture-pn-" } },
      ],
    })
    .toArray();
  for (const d of wa) {
    const byTag = (CAPTURE_TAGS as readonly string[]).includes(String(d.captureTag || ""));
    const byPn = String(d.phoneNumberId || "").startsWith("capture-pn-");
    candidates.push(
      toCandidate(
        "growth_whatsapp_connections",
        d,
        byTag
          ? `captureTag=${d.captureTag}`
          : `phoneNumberId=${d.phoneNumberId} (patrón capture-pn-)`,
        byTag || byPn
      )
    );
  }

  // —— 7. sessions de captura ——
  const sessions = await db
    .collection("identity_sessions")
    .find({
      _id: {
        $regex: "^sess-(capture-smoke|capture-messaging|capture-channels)",
      },
    })
    .toArray();
  for (const d of sessions) {
    candidates.push(
      toCandidate(
        "identity_sessions",
        d,
        `session id ${d._id} (script capture/smoke)`,
        true
      )
    );
  }

  // —— 8. portal_interesados smoke admit ——
  const interesados = await db
    .collection("portal_interesados")
    .find({
      $or: [
        { email: /^smoke\./i },
        { message: /Smoke CAPTURE/i },
        { programId: "smoke-program-capture-001" },
      ],
    })
    .toArray();
  for (const d of interesados) {
    const byProgram = d.programId === "smoke-program-capture-001";
    const byEmail = /^smoke\./i.test(String(d.email || ""));
    const byMsg = /Smoke CAPTURE/i.test(String(d.message || ""));
    candidates.push(
      toCandidate(
        "portal_interesados",
        d,
        byProgram
          ? "programId=smoke-program-capture-001"
          : byEmail
            ? "email smoke.*"
            : "message Smoke CAPTURE",
        byProgram || byEmail || byMsg
      )
    );
  }

  // —— 9. core_events / scheduled ——
  const coreOr: Document[] = [
    { "payload.formId": FORM_ID },
    { "payload.sourceId": FORM_ID },
    { "payload.email": /^smoke\./i },
  ];
  if (personaIds.length) coreOr.push({ "payload.personaId": { $in: personaIds } });
  const coreEvents = await db
    .collection("core_events")
    .find({ $or: coreOr })
    .limit(500)
    .toArray();
  for (const d of coreEvents) {
    const payload = (d.payload as Document) || {};
    candidates.push(
      toCandidate(
        "core_events",
        d,
        payload.formId === FORM_ID
          ? "payload.formId=adl-smoke-info-request"
          : /^smoke\./i.test(String(payload.email || ""))
            ? "payload.email smoke.*"
            : "payload.personaId → persona smoke",
        true
      )
    );
  }

  const schedOr: Document[] = [
    { "payload.formId": FORM_ID },
    { "payload.sourceId": FORM_ID },
    { "payload.email": /^smoke\./i },
  ];
  if (personaIds.length) schedOr.push({ "payload.personaId": { $in: personaIds } });
  if (oppIds.length) schedOr.push({ "payload.oportunidadId": { $in: oppIds } });
  const sched = await db
    .collection("core_scheduled_events")
    .find({ $or: schedOr })
    .limit(500)
    .toArray();
  for (const d of sched) {
    candidates.push(
      toCandidate(
        "core_scheduled_events",
        d,
        "payload referencia form/persona/oportunidad smoke",
        true
      )
    );
  }

  // —— 10. automation runs ——
  const runOr: Document[] = [];
  if (personaIds.length) runOr.push({ personaId: { $in: personaIds } });
  if (oppIds.length) runOr.push({ oportunidadId: { $in: oppIds } });
  const runs = runOr.length
    ? await db.collection("growth_automation_runs").find({ $or: runOr }).toArray()
    : [];
  for (const d of runs) {
    candidates.push(
      toCandidate(
        "growth_automation_runs",
        d,
        "ligado a persona/oportunidad smoke",
        true
      )
    );
  }

  const baselines = {
    experience_forms_adl: await db
      .collection("experience_forms")
      .countDocuments({ tenant: "adl" }),
    experience_forms_sem: await db
      .collection("experience_forms")
      .countDocuments({ tenant: "seminario-ipn" }),
    growth_whatsapp_connections_adl: await db
      .collection("growth_whatsapp_connections")
      .countDocuments({ tenantId: "adl" }),
    growth_whatsapp_connections_sem: await db
      .collection("growth_whatsapp_connections")
      .countDocuments({ tenantId: "seminario-ipn" }),
    growth_personas_adl: await db
      .collection("growth_personas")
      .countDocuments({ tenantId: "adl" }),
    growth_personas_sem: await db
      .collection("growth_personas")
      .countDocuments({ tenantId: "seminario-ipn" }),
  };

  return { candidates, baselines };
}

function summarize(candidates: Candidate[]) {
  const byCollection: Record<
    string,
    { total: number; confirmed: number; review: number; tenants: string[] }
  > = {};
  for (const c of candidates) {
    const slot = (byCollection[c.collection] ??= {
      total: 0,
      confirmed: 0,
      review: 0,
      tenants: [],
    });
    slot.total += 1;
    if (c.confirmedTest) slot.confirmed += 1;
    else slot.review += 1;
    if (c.tenant && !slot.tenants.includes(c.tenant)) slot.tenants.push(c.tenant);
  }
  return byCollection;
}

async function inventory() {
  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db(dbName);
  const { candidates, baselines } = await collectCandidates(db);
  const summary = summarize(candidates);
  const report = {
    ot: "OT-GROWTH-SMOKE-CLEANUP-001",
    mode: "inventory",
    scannedAt: new Date().toISOString(),
    dbName,
    summary,
    baselines,
    toDelete: candidates.filter((c) => c.confirmedTest),
    needsReview: candidates.filter((c) => !c.confirmedTest),
    all: candidates,
  };
  const outName = process.argv[3] || "inventory-before.json";
  writeFileSync(
    resolve(OUT_DIR, outName),
    JSON.stringify(report, null, 2),
    "utf8"
  );
  console.log(JSON.stringify({ summary, baselines, needsReview: report.needsReview.length, outName }, null, 2));
  await client.close();
}

async function deleteConfirmed() {
  const invPath = resolve(OUT_DIR, "inventory-before.json");
  const inv = JSON.parse(readFileSync(invPath, "utf8")) as {
    toDelete: Candidate[];
    baselines: Document;
  };
  const toDelete = inv.toDelete.filter((c) => c.confirmedTest);
  if (!toDelete.length) {
    console.error("Nada confirmado para borrar. Ejecuta inventory primero.");
    process.exit(1);
  }

  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db(dbName);

  // Full-document backup of each record (acepta _id string u ObjectId)
  const backups: Document[] = [];
  const resolvedDeletes: Array<Candidate & { resolvedId: unknown }> = [];
  for (const item of toDelete) {
    let doc: Document | null = null;
    let resolvedId: unknown = item._id;
    for (const id of idVariants(item._id)) {
      doc = await db.collection(item.collection).findOne({ _id: id as never });
      if (doc) {
        resolvedId = doc._id;
        break;
      }
    }
    if (doc) {
      backups.push({
        collection: item.collection,
        evidence: item.evidence,
        tenant: item.tenant,
        document: doc,
      });
      resolvedDeletes.push({ ...item, resolvedId });
    }
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = resolve(OUT_DIR, `backup-before-delete-${stamp}.json`);
  writeFileSync(
    backupPath,
    JSON.stringify(
      {
        ot: "OT-GROWTH-SMOKE-CLEANUP-001",
        createdAt: new Date().toISOString(),
        count: backups.length,
        records: backups,
      },
      null,
      2
    ),
    "utf8"
  );
  console.log(`backup written: ${backupPath} (${backups.length} docs)`);

  // Delete only confirmed, by resolved _id
  const deleted: { collection: string; _id: unknown; deletedCount: number; tenant: string | null }[] =
    [];
  const byCol = new Map<string, unknown[]>();
  for (const item of resolvedDeletes) {
    const list = byCol.get(item.collection) ?? [];
    list.push(item.resolvedId);
    byCol.set(item.collection, list);
  }

  // Prefer child collections first to reduce orphans during process
  const order = [
    "growth_mensajes",
    "growth_actividades",
    "growth_automation_runs",
    "core_scheduled_events",
    "core_events",
    "growth_conversaciones",
    "growth_oportunidades",
    "experience_form_submissions",
    "portal_interesados",
    "growth_personas",
    "experience_forms",
    "growth_whatsapp_connections",
    "identity_sessions",
  ];
  const cols = [
    ...order.filter((c) => byCol.has(c)),
    ...[...byCol.keys()].filter((c) => !order.includes(c)),
  ];

  for (const collection of cols) {
    const ids = byCol.get(collection)!;
    const result = await db.collection(collection).deleteMany({ _id: { $in: ids as never[] } });
    for (const id of ids) {
      const meta = resolvedDeletes.find(
        (c) => c.collection === collection && String(c.resolvedId) === String(id)
      );
      deleted.push({
        collection,
        _id: id,
        deletedCount: 1,
        tenant: meta?.tenant ?? null,
      });
    }
    console.log(`deleted ${result.deletedCount} from ${collection}`);
  }

  // Post verification
  const remainingForm = await db.collection("experience_forms").findOne({ _id: FORM_ID as never });
  const remainingSubs = await db
    .collection("experience_form_submissions")
    .countDocuments({ formId: FORM_ID });
  const remainingWa = await db.collection("growth_whatsapp_connections").countDocuments({
    captureTag: { $in: [...CAPTURE_TAGS] },
  });
  const orphanActs = await db.collection("growth_actividades").countDocuments({
    personaId: { $in: toDelete.filter((c) => c.collection === "growth_personas").map((c) => String(c._id)) },
  });
  const orphanOpps = await db.collection("growth_oportunidades").countDocuments({
    personaId: { $in: toDelete.filter((c) => c.collection === "growth_personas").map((c) => String(c._id)) },
  });

  const baselinesAfter = {
    experience_forms_adl: await db
      .collection("experience_forms")
      .countDocuments({ tenant: "adl" }),
    experience_forms_sem: await db
      .collection("experience_forms")
      .countDocuments({ tenant: "seminario-ipn" }),
    growth_whatsapp_connections_adl: await db
      .collection("growth_whatsapp_connections")
      .countDocuments({ tenantId: "adl" }),
    growth_whatsapp_connections_sem: await db
      .collection("growth_whatsapp_connections")
      .countDocuments({ tenantId: "seminario-ipn" }),
    growth_personas_adl: await db
      .collection("growth_personas")
      .countDocuments({ tenantId: "adl" }),
    growth_personas_sem: await db
      .collection("growth_personas")
      .countDocuments({ tenantId: "seminario-ipn" }),
  };

  const deletionReport = {
    ot: "OT-GROWTH-SMOKE-CLEANUP-001",
    deletedAt: new Date().toISOString(),
    backupPath,
    deletedCount: deleted.length,
    deletedByCollection: Object.fromEntries(
      [...byCol.entries()].map(([k, ids]) => [k, ids.length])
    ),
    deleted,
    verification: {
      remainingForm: remainingForm ? preview(remainingForm) : null,
      remainingSubsForSmokeForm: remainingSubs,
      remainingCaptureWaConnections: remainingWa,
      orphanActividadesForDeletedPersonas: orphanActs,
      orphanOportunidadesForDeletedPersonas: orphanOpps,
    },
    baselinesBefore: inv.baselines,
    baselinesAfter,
  };
  writeFileSync(
    resolve(OUT_DIR, "deletion-report.json"),
    JSON.stringify(deletionReport, null, 2),
    "utf8"
  );
  console.log(JSON.stringify({
    deletedByCollection: deletionReport.deletedByCollection,
    verification: deletionReport.verification,
    baselinesBefore: inv.baselines,
    baselinesAfter,
  }, null, 2));

  await client.close();
}

const mode = process.argv[2] || "inventory";
if (mode === "inventory") {
  inventory().catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else if (mode === "delete") {
  deleteConfirmed().catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else {
  console.error("Uso: inventory | delete");
  process.exit(1);
}
