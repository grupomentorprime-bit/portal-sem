import { MongoClient } from "mongodb";
import { randomUUID } from "crypto";
import { createRequire } from "module";

// Inline the filter helpers by reading cases from DB the same way the API would.
const BASE = process.env.APP_URL || "http://localhost:3000";
const COOKIE = "ah_session";

async function api(sessionId, path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      cookie: `${COOKIE}=${sessionId}`,
    },
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB);

const user = await db.collection("identity_users").findOne({ email: "soporte@mentorprime.cl" });
const now = new Date().toISOString();
const id = `sess_attn_report_${randomUUID()}`;
await db.collection("identity_sessions").insertOne({
  _id: id,
  userId: user._id,
  tenantId: "",
  createdAt: now,
  lastActivity: now,
  expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  userAgent: "cursor-attn-report-check",
});

const get = await api(id, "/api/desktop/attention");
const mentor = (get.body?.cases || []).filter((c) => c.tenantId === "mentor-prime-capacitacion");
const seminario = (get.body?.cases || []).filter((c) => c.tenantId === "seminario-ipn");
const byChannel = (rows, channel) => rows.filter((c) => (c.intakeChannel || "portal") === channel);

const out = {
  mentorCodes: mentor.map((c) => ({
    code: c.code,
    channel: c.channelLabel || c.intakeChannel,
    intake: c.intakeChannel,
    origin: c.originId,
    subject: c.subject,
    status: c.status,
  })),
  seminarioCodes: seminario.map((c) => ({
    code: c.code,
    channel: c.channelLabel || c.intakeChannel,
    origin: c.originId,
    subject: c.subject,
  })),
  mentorPhone: byChannel(mentor, "telefono").map((c) => c.code),
  mentorPortal: byChannel(mentor, "portal").map((c) => c.code),
  hasAC15: mentor.some((c) => c.code === "AC-00015"),
  hasAC16: mentor.some((c) => c.code === "AC-00016"),
  hasAC17: mentor.some((c) => c.code === "AC-00017"),
  hasAC14: mentor.some((c) => c.code === "AC-00014"),
  ac17Channel: mentor.find((c) => c.code === "AC-00017"),
  ac16Channel: mentor.find((c) => c.code === "AC-00016"),
};

// Alex permissions / orgWide proxy: does he have space settings?
const alex = await db.collection("identity_users").findOne({ email: "soporte@seminarioipn.cl" });
const alexMem = await db.collection("identity_memberships").findOne({
  userId: alex._id,
  tenantId: "seminario-ipn",
  status: "active",
});
out.alexMembership = {
  roleIds: alexMem?.roleIds,
  authorizedApps: alexMem?.authorizedApps,
};

const contacto = await db.collection("identity_users").findOne({ email: "contacto@mentorprime.cl" });
const contactoMem = await db.collection("identity_memberships").findOne({
  userId: contacto._id,
  tenantId: "seminario-ipn",
  status: "active",
});
out.contactoMembership = {
  roleIds: contactoMem?.roleIds,
  authorizedApps: contactoMem?.authorizedApps,
};

await db.collection("identity_sessions").deleteOne({ _id: id });
console.log(JSON.stringify(out, null, 2));
await client.close();
