import { MongoClient, ObjectId } from "mongodb";
import { randomUUID } from "crypto";

const BASE = process.env.APP_URL || "http://localhost:3000";
const COOKIE = "ah_session";

function jar(sessionId) {
  return `${COOKIE}=${sessionId}`;
}

async function api(sessionId, path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      cookie: jar(sessionId),
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text.slice(0, 400) };
  }
  return { status: res.status, body, headers: res.headers };
}

async function makeSession(db, email, tenantId) {
  const user = await db.collection("identity_users").findOne({ email });
  if (!user) throw new Error(`missing user ${email}`);
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const id = `sess_attn_audit_${randomUUID()}`;
  await db.collection("identity_sessions").insertOne({
    _id: id,
    userId: user._id,
    tenantId: tenantId || "",
    createdAt: now,
    lastActivity: now,
    expiresAt: expires,
    userAgent: "cursor-attn-e2e-audit",
  });
  return { id, user };
}

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB);
  const stamp = new Date().toISOString();
  const out = { stamp, steps: [] };

  const owner = await makeSession(db, "soporte@mentorprime.cl", "");
  const companyA = "mentor-prime-capacitacion";
  const companyB = "seminario-ipn";
  const userA = await makeSession(db, "owner@mentorprime.cl", companyA);
  const userB = await makeSession(db, "contacto@mentorprime.cl", companyB);

  // Clear entered-client cookie effect by not setting mp_desk_client for platform owner calls.
  const getOwner = await api(owner.id, "/api/desktop/attention");
  out.steps.push({
    name: "owner GET platform desk",
    status: getOwner.status,
    mode: getOwner.body?.mode,
    desk: getOwner.body?.desk,
    cases: getOwner.body?.cases?.length,
    companies: getOwner.body?.companies?.length,
  });

  // 1) Portal ticket from company B user
  const portal = await api(userB.id, "/api/desktop/attention", {
    method: "POST",
    body: JSON.stringify({
      action: "open",
      areaId: "tecnico",
      tenantId: companyB,
      subject: `Auditoría portal ${stamp}`,
      body: `Ticket de portal de prueba ${stamp}. Empresa Seminario.`,
      originId: "escritorio.atencion.nuevo-ticket",
      capturedAt: stamp,
      whereNote: "Escritorio · Mis tickets",
      priority: "normal",
    }),
  });
  out.portal = {
    status: portal.status,
    ok: portal.body?.ok,
    error: portal.body?.error,
    correlative: portal.body?.receipt?.correlative || portal.body?.case?.code,
    caseId: portal.body?.case?.id,
    tenantId: portal.body?.case?.tenantId,
    intakeChannel: portal.body?.case?.intakeChannel,
    channelLabel: portal.body?.case?.channelLabel,
    helpPlace: portal.body?.case?.helpPlace,
    events: portal.body?.case?.events,
    messages: portal.body?.case?.messages?.map((m) => ({ role: m.role, body: m.body })),
  };

  // Cross-company: user A should not see company B portal case
  const getA = await api(userA.id, "/api/desktop/attention");
  const aSeesPortal = (getA.body?.cases || []).some((c) => c.id === out.portal.caseId);
  out.portal.visibility = {
    companyASees: aSeesPortal,
    companyADesk: getA.body?.desk,
    companyAMode: getA.body?.mode,
    companyACount: getA.body?.cases?.length,
  };

  // Owner on platform should see it
  const getOwner2 = await api(owner.id, "/api/desktop/attention");
  const ownerSeesPortal = (getOwner2.body?.cases || []).some((c) => c.id === out.portal.caseId);
  out.portal.visibility.ownerSees = ownerSeesPortal;

  // 2) Phone/manual ticket from owner on platform for company A
  const phone = await api(owner.id, "/api/desktop/attention", {
    method: "POST",
    body: JSON.stringify({
      action: "open",
      areaId: "operativo",
      tenantId: companyA,
      subject: `Auditoría teléfono ${stamp}`,
      body: `Llamada de prueba registrada por operador. ${stamp}`,
      originId: "escritorio.atencion.nuevo-ticket",
      capturedAt: stamp,
      contactName: "Cliente telefónico de prueba",
      intakeChannel: "telefono",
      priority: "alta",
    }),
  });
  out.phone = {
    status: phone.status,
    ok: phone.body?.ok,
    error: phone.body?.error,
    correlative: phone.body?.receipt?.correlative || phone.body?.case?.code,
    caseId: phone.body?.case?.id,
    tenantId: phone.body?.case?.tenantId,
    intakeChannel: phone.body?.case?.intakeChannel,
    channelLabel: phone.body?.case?.channelLabel,
    requesterName: phone.body?.case?.requesterName,
    events: phone.body?.case?.events,
    messages: phone.body?.case?.messages?.map((m) => ({ role: m.role, body: m.body })),
  };

  // Company B must not see phone ticket of A
  const getB = await api(userB.id, "/api/desktop/attention");
  out.phone.visibility = {
    companyBSees: (getB.body?.cases || []).some((c) => c.id === out.phone.caseId),
    companyASees: (getA.body?.cases || []).some((c) => c.id === out.phone.caseId),
  };
  const getA2 = await api(userA.id, "/api/desktop/attention");
  out.phone.visibility.companyASeesAfter = (getA2.body?.cases || []).some((c) => c.id === out.phone.caseId);

  // 3) Chat ticket from company A (owner as company member)
  // Set entered cookie via direct session tenant already companyA for userA
  const chat = await api(userA.id, "/api/desktop/attention", {
    method: "POST",
    body: JSON.stringify({
      action: "open",
      areaId: "general",
      tenantId: companyA,
      subject: `Auditoría chat ${stamp}`,
      body: `Hola, necesito seguimiento por chat. ${stamp}`,
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
    tenantId: chat.body?.case?.tenantId,
    intakeChannel: chat.body?.case?.intakeChannel,
    channelLabel: chat.body?.case?.channelLabel,
    helpPlace: chat.body?.case?.helpPlace,
    originId: chat.body?.case?.originId,
    events: chat.body?.case?.events,
    messages: chat.body?.case?.messages?.map((m) => ({ role: m.role, body: m.body })),
  };

  // Owner replies + assign + request-info on portal ticket
  const colleagues = getOwner2.body?.colleagues || [];
  const assignee = colleagues[0]?.userId || owner.user._id;
  if (out.portal.caseId) {
    const assign = await api(owner.id, "/api/desktop/attention", {
      method: "POST",
      body: JSON.stringify({ action: "assign", caseId: out.portal.caseId, assigneeUserId: assignee }),
    });
    const reply = await api(owner.id, "/api/desktop/attention", {
      method: "POST",
      body: JSON.stringify({
        action: "message",
        caseId: out.portal.caseId,
        body: "Recibimos tu ticket de portal. Seguimos en este mismo correlativo.",
      }),
    });
    out.portal.followUp = {
      assignOk: assign.body?.ok,
      assignError: assign.body?.error,
      assignee: assign.body?.case?.assigneeName,
      replyOk: reply.body?.ok,
      events: reply.body?.case?.events,
      messages: reply.body?.case?.messages?.map((m) => ({ role: m.role, body: m.body })),
      nextStep: reply.body?.case?.nextStepLabel,
    };
  }

  // Chat follow-up: owner reply then client continue
  if (out.chat.caseId) {
    const chatReply = await api(owner.id, "/api/desktop/attention", {
      method: "POST",
      body: JSON.stringify({
        action: "message",
        caseId: out.chat.caseId,
        body: "Te leemos. Déjanos el detalle para el seguimiento.",
      }),
    });
    const chatCont = await api(userA.id, "/api/desktop/attention", {
      method: "POST",
      body: JSON.stringify({
        action: "message",
        caseId: out.chat.caseId,
        body: "Sigo aquí. Necesito que quede registrado el seguimiento.",
      }),
    });
    out.chat.followUp = {
      staffOk: chatReply.body?.ok,
      clientOk: chatCont.body?.ok,
      events: chatCont.body?.case?.events,
      messages: chatCont.body?.case?.messages?.map((m) => ({ role: m.role, body: m.body })),
      helpPlace: chatCont.body?.case?.helpPlace,
      originId: chatCont.body?.case?.originId,
    };
  }

  // Phone: owner reply and mark pendiente/abierto flow
  if (out.phone.caseId) {
    const phoneReply = await api(owner.id, "/api/desktop/attention", {
      method: "POST",
      body: JSON.stringify({
        action: "message",
        caseId: out.phone.caseId,
        body: "Registramos la llamada. Queda el seguimiento en este ticket.",
      }),
    });
    out.phone.followUp = {
      replyOk: phoneReply.body?.ok,
      events: phoneReply.body?.case?.events,
      messages: phoneReply.body?.case?.messages?.map((m) => ({ role: m.role, body: m.body })),
      intakeChannel: phoneReply.body?.case?.intakeChannel,
      channelLabel: phoneReply.body?.case?.channelLabel,
      requesterName: phoneReply.body?.case?.requesterName,
    };
  }

  // Client confirmation: company B sees portal reply
  const getB2 = await api(userB.id, "/api/desktop/attention");
  const portalForB = (getB2.body?.cases || []).find((c) => c.id === out.portal.caseId);
  out.portal.clientConfirmation = {
    visible: Boolean(portalForB),
    unread: portalForB?.unread,
    lastMessage: portalForB?.messages?.at(-1),
    status: portalForB?.status,
    nextStep: portalForB?.nextStepLabel,
  };

  // Report directory + send PDF for company A
  const directory = await api(owner.id, "/api/desktop/attention", {
    method: "POST",
    body: JSON.stringify({ action: "company-directory", tenantId: companyA }),
  });
  out.report = {
    directoryStatus: directory.status,
    directoryOk: directory.body?.ok,
    admins: directory.body?.admins?.map((p) => ({ name: p.name, email: p.email, userId: p.userId })),
    authorized: directory.body?.authorized?.map((p) => ({ name: p.name, email: p.email, admin: p.admin })),
  };
  const admin = directory.body?.admins?.[0] || directory.body?.authorized?.find((p) => p.admin);
  const cc = (directory.body?.authorized || []).filter((p) => p.userId !== admin?.userId).slice(0, 1);
  if (admin) {
    const send = await api(owner.id, "/api/desktop/attention", {
      method: "POST",
      body: JSON.stringify({
        action: "send-report",
        tenantId: companyA,
        period: "7",
        channel: "",
        toUserId: admin.userId,
        ccUserIds: cc.map((p) => p.userId),
        message: `Informe de auditoría Atención ${stamp}. Destinatarios de prueba.`,
      }),
    });
    out.report.send = {
      status: send.status,
      ok: send.body?.ok,
      error: send.body?.error,
      dispatch: send.body?.dispatch,
    };
  } else {
    out.report.send = { error: "no-admin-in-directory" };
  }

  // Cross check: company B cannot send report
  const sendForbidden = await api(userB.id, "/api/desktop/attention", {
    method: "POST",
    body: JSON.stringify({
      action: "send-report",
      tenantId: companyB,
      period: "7",
      toUserId: userB.user._id,
      ccUserIds: [],
      message: "no debería",
    }),
  });
  out.report.companyUserForbidden = {
    status: sendForbidden.status,
    ok: sendForbidden.body?.ok,
    error: sendForbidden.body?.error,
    reason: sendForbidden.body?.reason,
  };

  // Persist DB snapshots for history evidence
  for (const key of ["portal", "phone", "chat"]) {
    const id = out[key]?.caseId;
    if (!id) continue;
    const doc = await db.collection("attention_cases").findOne({ id });
    out[key].db = {
      correlative: doc?.correlative,
      intakeChannel: doc?.intakeChannel,
      requesterName: doc?.requesterName,
      sharedWithCompany: doc?.sharedWithCompany,
      events: doc?.events,
      messages: doc?.messages?.map((m) => ({ role: m.role, body: m.body, authorName: m.authorName })),
      helpFrom: doc?.helpFrom,
    };
  }
  const dispatches = await db
    .collection("attention_report_dispatches")
    .find({})
    .sort({ at: -1 })
    .limit(3)
    .toArray();
  out.report.recentDispatches = dispatches.map((d) => ({
    at: d.at,
    company: d.company,
    result: d.result,
    detail: d.detail,
    to: d.to,
    cc: d.cc,
    periodLabel: d.periodLabel,
    channelLabel: d.channelLabel,
  }));

  // Cleanup sessions created for audit
  await db.collection("identity_sessions").deleteMany({
    _id: { $in: [owner.id, userA.id, userB.id] },
  });

  console.log(JSON.stringify(out, null, 2));
  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
