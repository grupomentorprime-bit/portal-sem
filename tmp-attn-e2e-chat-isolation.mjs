import { MongoClient } from "mongodb";
import { randomUUID } from "crypto";

const BASE = process.env.APP_URL || "http://localhost:3000";
const COOKIE = "ah_session";
const ENTERED = "mp_desk_client";

async function api(cookies, path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      cookie: cookies,
      ...(init.headers || {}),
    },
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

async function makeSession(db, email, tenantId) {
  const user = await db.collection("identity_users").findOne({ email });
  if (!user) throw new Error(`missing ${email}`);
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const id = `sess_attn_audit2_${randomUUID()}`;
  await db.collection("identity_sessions").insertOne({
    _id: id,
    userId: user._id,
    tenantId: tenantId || "",
    createdAt: now,
    lastActivity: now,
    expiresAt: expires,
    userAgent: "cursor-attn-e2e-audit-2",
  });
  return { id, user };
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB);
const stamp = new Date().toISOString();

const owner = await makeSession(db, "soporte@mentorprime.cl", "");
const userSem = await makeSession(db, "contacto@mentorprime.cl", "seminario-ipn");
const userAlex = await makeSession(db, "soporte@seminarioipn.cl", "seminario-ipn");

// Find a non-platform user in another company if any; else use owner with entered cookie as company client
let otherEmail = null;
for (const tid of ["ipn-chile", "fundacion-mueve", "adl", "cumple"]) {
  const mems = await db.collection("identity_memberships").find({ tenantId: tid, status: "active" }).toArray();
  for (const m of mems) {
    const u = await db.collection("identity_users").findOne({ _id: m.userId });
    if (u?.status === "active" && (!u.platformRoles || u.platformRoles.length === 0)) {
      otherEmail = { email: u.email, tenantId: tid, name: u.displayName };
      break;
    }
  }
  if (otherEmail) break;
}

const out = { stamp, otherEmail };

// Owner entering Mentor Capacitación via cookie → should act as company client
const ownerCompanyCookies = `${COOKIE}=${owner.id}; ${ENTERED}=mentor-prime-capacitacion`;
const ownerCompanyGet = await api(ownerCompanyCookies, "/api/desktop/attention");
out.ownerInCompany = {
  status: ownerCompanyGet.status,
  mode: ownerCompanyGet.body?.mode,
  desk: ownerCompanyGet.body?.desk,
  activeCompany: ownerCompanyGet.body?.activeCompany,
  caseCount: ownerCompanyGet.body?.cases?.length,
};

const chat = await api(ownerCompanyCookies, "/api/desktop/attention", {
  method: "POST",
  body: JSON.stringify({
    action: "open",
    areaId: "general",
    tenantId: "mentor-prime-capacitacion",
    subject: `Chat seguimiento ${stamp}`,
    body: `Mensaje inicial de chat como cliente de empresa. ${stamp}`,
    originId: "escritorio.chat-en-vivo",
    capturedAt: stamp,
    priority: "normal",
  }),
});
out.chat = {
  status: chat.status,
  ok: chat.body?.ok,
  error: chat.body?.error,
  correlative: chat.body?.receipt?.correlative || chat.body?.case?.code,
  caseId: chat.body?.case?.id,
  modeHint: ownerCompanyGet.body?.mode,
  intakeChannel: chat.body?.case?.intakeChannel,
  channelLabel: chat.body?.case?.channelLabel,
  originId: chat.body?.case?.originId,
  helpPlace: chat.body?.case?.helpPlace,
  firstRoles: chat.body?.case?.messages?.map((m) => m.role),
  requesterName: chat.body?.case?.requesterName,
};

// Staff reply from platform (no entered cookie)
const ownerPlatCookies = `${COOKIE}=${owner.id}`;
const staffReply = await api(ownerPlatCookies, "/api/desktop/attention", {
  method: "POST",
  body: JSON.stringify({
    action: "message",
    caseId: out.chat.caseId,
    body: "Respuesta de NELZURI al chat. Queda el seguimiento.",
  }),
});
const clientFollow = await api(ownerCompanyCookies, "/api/desktop/attention", {
  method: "POST",
  body: JSON.stringify({
    action: "message",
    caseId: out.chat.caseId,
    body: "Confirmo seguimiento desde el chat.",
  }),
});
out.chat.followUp = {
  staffOk: staffReply.body?.ok,
  staffRoles: staffReply.body?.case?.messages?.map((m) => ({ role: m.role, body: m.body })),
  clientOk: clientFollow.body?.ok,
  clientError: clientFollow.body?.error,
  finalMessages: clientFollow.body?.case?.messages?.map((m) => ({ role: m.role, label: m.label, body: m.body })),
  events: clientFollow.body?.case?.events,
};

// Isolation: seminario user must not see mentor chat/phone
const semGet = await api(`${COOKIE}=${userSem.id}`, "/api/desktop/attention");
out.isolation = {
  semDesk: semGet.body?.desk,
  semMode: semGet.body?.mode,
  seesChat: (semGet.body?.cases || []).some((c) => c.id === out.chat.caseId),
  seesPhoneAC15: (semGet.body?.cases || []).some((c) => c.code === "AC-00015" || c.id === "b071be53-7c59-4952-a22c-9548ed51188f"),
  seesPortalAC14: (semGet.body?.cases || []).some((c) => c.code === "AC-00014"),
  codes: (semGet.body?.cases || []).map((c) => c.code),
};

// Same-company other user (Alex) vs portal AC-00014 (requester was contacto)
const alexGet = await api(`${COOKIE}=${userAlex.id}`, "/api/desktop/attention");
out.sameCompany = {
  alexMode: alexGet.body?.mode,
  alexDesk: alexGet.body?.desk,
  seesPortalAC14: (alexGet.body?.cases || []).some((c) => c.code === "AC-00014"),
  codes: (alexGet.body?.cases || []).map((c) => ({ code: c.code, subject: c.subject })),
};

// Report content for Mentor Capacitación should include phone+chat of mentor, not seminario portal
const directory = await api(ownerPlatCookies, "/api/desktop/attention", {
  method: "POST",
  body: JSON.stringify({ action: "company-directory", tenantId: "mentor-prime-capacitacion" }),
});
const admin = directory.body?.admins?.[0];
const send = await api(ownerPlatCookies, "/api/desktop/attention", {
  method: "POST",
  body: JSON.stringify({
    action: "send-report",
    tenantId: "mentor-prime-capacitacion",
    period: "7",
    channel: "telefono",
    toUserId: admin?.userId,
    ccUserIds: [],
    message: `Informe canal teléfono auditoría ${stamp}`,
  }),
});
out.reportPhoneOnly = {
  ok: send.body?.ok,
  dispatch: send.body?.dispatch,
};

// DB check chat case
if (out.chat.caseId) {
  const doc = await db.collection("attention_cases").findOne({ id: out.chat.caseId });
  out.chat.db = {
    correlative: doc?.correlative,
    intakeChannel: doc?.intakeChannel,
    sharedWithCompany: doc?.sharedWithCompany,
    requesterName: doc?.requesterName,
    messages: doc?.messages?.map((m) => ({ role: m.role, authorName: m.authorName, body: m.body })),
    events: doc?.events,
    helpFrom: doc?.helpFrom,
  };
}

await db.collection("identity_sessions").deleteMany({ _id: { $in: [owner.id, userSem.id, userAlex.id] } });
console.log(JSON.stringify(out, null, 2));
await client.close();
