import { MongoClient } from "mongodb";
import { randomUUID } from "crypto";
import { writeFileSync } from "fs";

const BASE = process.env.APP_URL || "http://localhost:3000";
const COOKIE = "ah_session";
const ENTERED = "mp_desk_client";
const MENTOR = "mentor-prime-capacitacion";
const SEM = "seminario-ipn";

function cookies(sessionId, tenantId) {
  const parts = [`${COOKIE}=${sessionId}`];
  if (tenantId) parts.push(`${ENTERED}=${encodeURIComponent(tenantId)}`);
  return parts.join("; ");
}

async function api(sessionId, path, init = {}, tenantId = "") {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      cookie: cookies(sessionId, tenantId),
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
  return { status: res.status, body };
}

async function makeSession(db, email, tenantId) {
  const user = await db.collection("identity_users").findOne({ email });
  if (!user) throw new Error(`missing user ${email}`);
  const now = new Date().toISOString();
  const id = `sess_attn_fix_${randomUUID()}`;
  await db.collection("identity_sessions").insertOne({
    _id: id,
    userId: user._id,
    tenantId: tenantId || "",
    createdAt: now,
    lastActivity: now,
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    userAgent: "cursor-attn-fix-e2e",
  });
  return { id, userId: user._id, email, name: user.displayName };
}

function briefCase(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    tenantId: row.tenantId,
    status: row.status,
    intakeChannel: row.intakeChannel,
    channelLabel: row.channelLabel,
    requesterName: row.requesterName,
    ticketCaseId: row.ticketCaseId,
    helpPlace: row.helpPlace,
    originId: row.originId,
    messages: (row.messages || []).map((message) => ({
      role: message.role,
      label: message.label,
      body: message.body,
    })),
    events: (row.events || []).map((event) => ({
      at: event.at,
      kind: event.kind,
      actorName: event.actorName,
      detail: event.detail,
    })),
  };
}

function sees(list, id) {
  return (list || []).some((item) => item.id === id);
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB);
const stamp = new Date().toISOString();
const sessions = [];
const out = { stamp, companies: { mentor: MENTOR, seminario: SEM } };

try {
  const owner = await makeSession(db, "soporte@mentorprime.cl", "");
  const semRequester = await makeSession(db, "contacto@mentorprime.cl", SEM);
  const semAdmin = await makeSession(db, "soporte@seminarioipn.cl", SEM);
  sessions.push(owner, semRequester, semAdmin);

  const directory = await api(owner.id, "/api/desktop/attention", {
    method: "POST",
    body: JSON.stringify({ action: "company-directory", tenantId: SEM }),
  });
  const people = directory.body?.authorized || [];
  out.directory = {
    status: directory.status,
    people: people.map((person) => ({ name: person.name, email: person.email, admin: person.admin, userId: person.userId })),
  };
  const requester = people.find((person) => person.email === "contacto@mentorprime.cl");
  const admin = people.find((person) => person.admin && person.email !== requester?.email);
  const colleaguePerson = people.find((person) => !person.admin && person.userId !== requester?.userId);
  out.roles = {
    requester: requester ? { name: requester.name, email: requester.email, admin: requester.admin } : null,
    admin: admin ? { name: admin.name, email: admin.email, admin: admin.admin } : null,
    colleague: colleaguePerson
      ? { name: colleaguePerson.name, email: colleaguePerson.email, admin: colleaguePerson.admin }
      : null,
  };

  let colleague = null;
  if (colleaguePerson) {
    colleague = await makeSession(db, colleaguePerson.email, SEM);
    sessions.push(colleague);
  }

  const before = await api(owner.id, "/api/desktop/attention");
  const beforeCount = (before.body?.cases || []).length;

  const blocked = await api(owner.id, "/api/desktop/attention", {
    method: "POST",
    body: JSON.stringify({
      action: "open",
      areaId: "general",
      tenantId: "",
      subject: `Chat sin empresa ${stamp}`,
      body: `No debe crearse. ${stamp}`,
      originId: "escritorio.chat-en-vivo",
      capturedAt: stamp,
    }),
  });
  const afterBlock = await api(owner.id, "/api/desktop/attention");
  out.chatWithoutCompany = {
    status: blocked.status,
    error: blocked.body?.error,
    reason: blocked.body?.reason,
    created: Boolean(blocked.body?.case?.id),
    caseCountBefore: beforeCount,
    caseCountAfter: (afterBlock.body?.cases || []).length,
  };

  const chat = await api(
    owner.id,
    "/api/desktop/attention",
    {
      method: "POST",
      body: JSON.stringify({
        action: "open",
        areaId: "general",
        tenantId: "",
        subject: `Chat con empresa activa ${stamp}`,
        body: `Hola desde el chat, con la empresa activa. ${stamp}`,
        originId: "escritorio.chat-en-vivo",
        capturedAt: stamp,
      }),
    },
    MENTOR
  );
  out.chat = { opened: briefCase(chat.body?.case), status: chat.status, error: chat.body?.error };

  if (chat.body?.case?.id) {
    const staffReply = await api(owner.id, "/api/desktop/attention", {
      method: "POST",
      body: JSON.stringify({
        action: "message",
        caseId: chat.body.case.id,
        body: "Te leemos desde la mesa de plataforma.",
      }),
    });
    const clientReply = await api(
      owner.id,
      "/api/desktop/attention",
      {
        method: "POST",
        body: JSON.stringify({
          action: "message",
          caseId: chat.body.case.id,
          body: "Sigo en el chat como cliente de la empresa.",
          asClient: true,
        }),
      },
      MENTOR
    );
    out.chat.afterMessages = briefCase(clientReply.body?.case);
    out.chat.staffStatus = staffReply.status;
    out.chat.staffRole = staffReply.body?.case?.messages?.at(-1)?.role;
    out.chat.clientFollowStatus = clientReply.status;

    await db.collection("attention_presence").updateOne(
      { _id: semRequester.userId },
      {
        $set: {
          kind: "client",
          tenantId: SEM,
          company: "Seminario Eclesiástico Mayor",
          displayName: semRequester.name,
          seenAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );
    const whileOnline = await api(owner.id, "/api/desktop/presence");
    await db.collection("attention_presence").deleteOne({ _id: semRequester.userId });
    const afterDrop = await api(owner.id, "/api/desktop/presence");
    const resumed = await api(owner.id, "/api/desktop/attention", {
      method: "POST",
      body: JSON.stringify({
        action: "message",
        caseId: chat.body.case.id,
        body: "Retomo el mismo chat después de la desconexión.",
      }),
    });
    out.chat.resume = {
      onlineBefore: (whileOnline.body?.online || []).some((org) => org.tenantId === SEM),
      onlineAfter: (afterDrop.body?.online || []).some((org) => org.tenantId === SEM),
      status: resumed.status,
      id: resumed.body?.case?.id,
      code: resumed.body?.case?.code,
      sameCase: resumed.body?.case?.id === chat.body.case.id,
      sameCode: resumed.body?.case?.code === chat.body.case.code,
      lastRole: resumed.body?.case?.messages?.at(-1)?.role,
      channelLabel: resumed.body?.case?.channelLabel,
    };

    const promoted = await api(owner.id, "/api/desktop/attention", {
      method: "POST",
      body: JSON.stringify({ action: "promote", caseId: chat.body.case.id }),
    });
    const fresh = await makeSession(db, "soporte@mentorprime.cl", "");
    sessions.push(fresh);
    const again = await api(fresh.id, "/api/desktop/attention", {
      method: "POST",
      body: JSON.stringify({ action: "promote", caseId: chat.body.case.id }),
    });
    out.chat.promote = {
      first: {
        status: promoted.status,
        id: promoted.body?.case?.id,
        code: promoted.body?.case?.code,
        ticketCaseId: promoted.body?.case?.ticketCaseId,
        messages: promoted.body?.case?.messages?.length,
        events: promoted.body?.case?.events?.map((event) => event.detail),
      },
      afterNewSession: {
        status: again.status,
        id: again.body?.case?.id,
        code: again.body?.case?.code,
        ticketCaseId: again.body?.case?.ticketCaseId,
        messages: again.body?.case?.messages?.length,
        events: again.body?.case?.events?.map((event) => event.detail),
        sameCase: again.body?.case?.id === promoted.body?.case?.id,
        sameHistory: again.body?.case?.messages?.length === promoted.body?.case?.messages?.length,
      },
    };
  }

  const chosenOpen = await api(owner.id, "/api/desktop/attention", {
    method: "POST",
    body: JSON.stringify({
      action: "open",
      areaId: "general",
      tenantId: MENTOR,
      subject: `Chat tras elegir empresa ${stamp}`,
      body: `Elegí Mentor antes de iniciar. ${stamp}`,
      originId: "escritorio.chat-en-vivo",
      capturedAt: stamp,
    }),
  });
  out.chatChosenCompany = {
    status: chosenOpen.status,
    code: chosenOpen.body?.case?.code,
    channelLabel: chosenOpen.body?.case?.channelLabel,
    firstRole: chosenOpen.body?.case?.messages?.[0]?.role,
    requesterName: chosenOpen.body?.case?.requesterName,
    error: chosenOpen.body?.error,
  };

  const clientOpen = await api(semRequester.id, "/api/desktop/attention", {
    method: "POST",
    body: JSON.stringify({
      action: "open",
      areaId: "general",
      subject: `Chat del solicitante ${stamp}`,
      body: `Escribe el cliente de Seminario. ${stamp}`,
      originId: "escritorio.chat-en-vivo",
      capturedAt: stamp,
    }),
  });
  const clientId = clientOpen.body?.case?.id || "";
  const operatorReply = clientId
    ? await api(owner.id, "/api/desktop/attention", {
        method: "POST",
        body: JSON.stringify({
          action: "message",
          caseId: clientId,
          body: "Responde el operador de plataforma.",
        }),
      })
    : null;
  const clientAgain = clientId
    ? await api(semRequester.id, "/api/desktop/attention", {
        method: "POST",
        body: JSON.stringify({
          action: "message",
          caseId: clientId,
          body: "El cliente sigue en el mismo hilo.",
          asClient: true,
        }),
      })
    : null;
  if (clientId) {
    await db.collection("attention_presence").deleteOne({ _id: semRequester.userId });
  }
  const operatorResume = clientId
    ? await api(owner.id, "/api/desktop/attention", {
        method: "POST",
        body: JSON.stringify({
          action: "message",
          caseId: clientId,
          body: "El operador retoma tras la desconexión.",
        }),
      })
    : null;
  const portalTicket = await api(semRequester.id, "/api/desktop/attention", {
    method: "POST",
    body: JSON.stringify({
      action: "open",
      areaId: "general",
      subject: `Ticket de portal ${stamp}`,
      body: `Este no es el chat. ${stamp}`,
      originId: "escritorio.atencion.nuevo-ticket",
      capturedAt: stamp,
    }),
  });
  const ownThread = await api(semRequester.id, "/api/desktop/attention");
  const visibleChats = (ownThread.body?.cases || []).filter(
    (item) => item.intakeChannel === "envivo" || item.originId === "escritorio.chat-en-vivo"
  );
  out.clientThread = {
    code: clientOpen.body?.case?.code,
    id: clientId,
    channelLabel: clientOpen.body?.case?.channelLabel,
    openedRole: clientOpen.body?.case?.messages?.[0]?.role,
    operatorRole: operatorReply?.body?.case?.messages?.at(-1)?.role,
    clientRole: clientAgain?.body?.case?.messages?.at(-1)?.role,
    resumeSameId: operatorResume?.body?.case?.id === clientId,
    resumeSameCode: operatorResume?.body?.case?.code === clientOpen.body?.case?.code,
    resumeRole: operatorResume?.body?.case?.messages?.at(-1)?.role,
    roles: (operatorResume?.body?.case?.messages || []).map((message) => message.role),
    portalCode: portalTicket.body?.case?.code,
    portalChannel: portalTicket.body?.case?.channelLabel,
    liveThreadCodes: visibleChats.map((item) => ({ code: item.code, channel: item.channelLabel })),
  };

  const phone = await api(owner.id, "/api/desktop/attention", {
    method: "POST",
    body: JSON.stringify({
      action: "open",
      areaId: "general",
      tenantId: SEM,
      subject: `Llamada vinculada ${stamp}`,
      body: `Alta telefónica de prueba ${stamp}.`,
      contactName: requester?.name || "Contacto",
      requesterUserId: requester?.userId || "",
      intakeChannel: "telefono",
      priority: "normal",
    }),
  });
  out.phone = {
    status: phone.status,
    error: phone.body?.error,
    opened: briefCase(phone.body?.case),
    sharedWithCompany: null,
  };

  if (phone.body?.case?.id) {
    const caseId = phone.body.case.id;
    const stored = await db.collection("attention_cases").findOne(
      { id: caseId },
      { projection: { sharedWithCompany: 1, requesterUserId: 1, requesterName: 1, intakeChannel: 1 } }
    );
    out.phone.sharedWithCompany = stored?.sharedWithCompany === true;
    out.phone.linkedUser = stored?.requesterUserId === requester?.userId;

    const asRequester = await api(semRequester.id, "/api/desktop/attention");
    const asAdmin = await api(semAdmin.id, "/api/desktop/attention");
    const asColleague = colleague ? await api(colleague.id, "/api/desktop/attention") : null;
    const asMentor = await api(owner.id, "/api/desktop/attention", {}, MENTOR);
    out.phone.visibility = {
      requesterSees: sees(asRequester.body?.cases, caseId),
      requesterDesk: asRequester.body?.desk,
      adminSees: sees(asAdmin.body?.cases, caseId),
      adminDesk: asAdmin.body?.desk,
      adminName: semAdmin.name,
      colleagueSees: asColleague ? sees(asColleague.body?.cases, caseId) : null,
      colleagueEmail: colleague?.email || null,
      otherCompanySees: sees(asMentor.body?.cases, caseId),
    };

    const asked = await api(owner.id, "/api/desktop/attention", {
      method: "POST",
      body: JSON.stringify({ action: "confirm-ask", caseId }),
    });
    const waitingList = await api(owner.id, "/api/desktop/attention");
    const waitingRows = (waitingList.body?.cases || []).filter(
      (item) => item.tenantId === SEM && item.intakeChannel === "telefono"
    );
    out.phone.waiting = {
      status: asked.body?.case?.status,
      code: asked.body?.case?.code,
      event: asked.body?.case?.events?.at(-1),
      resolvedTotalIncludesIt: waitingRows.some((item) => item.id === caseId && item.status === "resuelto"),
      statusInList: waitingRows.find((item) => item.id === caseId)?.status || null,
    };

    const still = await api(semRequester.id, "/api/desktop/attention", {
      method: "POST",
      body: JSON.stringify({
        action: "confirm",
        caseId,
        decision: "sigue",
        reason: "Sigo sin poder entrar después de la llamada.",
      }),
    });
    out.phone.still = briefCase(still.body?.case);

    const askedAgain = await api(owner.id, "/api/desktop/attention", {
      method: "POST",
      body: JSON.stringify({ action: "confirm-ask", caseId }),
    });
    const resolved = await api(semRequester.id, "/api/desktop/attention", {
      method: "POST",
      body: JSON.stringify({ action: "confirm", caseId, decision: "resuelto" }),
    });
    out.phone.resolved = {
      askedStatus: askedAgain.body?.case?.status,
      final: briefCase(resolved.body?.case),
    };
  }

  const reportChat = await api(owner.id, "/api/desktop/attention", {
    method: "POST",
    body: JSON.stringify({
      action: "send-report",
      tenantId: MENTOR,
      period: "7",
      channel: "envivo",
      toUserId: (await companyAdminId(owner.id, MENTOR)),
      ccUserIds: [],
      message: `Informe chat ${stamp}`,
    }),
  });
  const reportPhone = await api(owner.id, "/api/desktop/attention", {
    method: "POST",
    body: JSON.stringify({
      action: "send-report",
      tenantId: SEM,
      period: "7",
      channel: "telefono",
      toUserId: admin?.userId || "",
      ccUserIds: [],
      message: `Informe teléfono ${stamp}`,
    }),
  });

  const ownerList = await api(owner.id, "/api/desktop/attention");
  const recent = (ownerList.body?.cases || []).filter((item) => {
    const created = Date.parse(item.createdAt || "");
    return Number.isFinite(created) && Date.now() - created < 2 * 60 * 60 * 1000;
  });
  function reportRows(tenantId, channel) {
    return recent
      .filter((item) => item.tenantId === tenantId && (!channel || item.intakeChannel === channel))
      .map((item) => ({
        code: item.code,
        channelLabel: item.channelLabel,
        status: item.status,
        requesterName: item.requesterName,
        subject: item.subject,
      }));
  }

  out.report = {
    chat: {
      status: reportChat.status,
      ok: reportChat.body?.ok,
      error: reportChat.body?.error,
      dispatch: reportChat.body?.dispatch
        ? {
            result: reportChat.body.dispatch.result,
            detail: reportChat.body.dispatch.detail,
            channelLabel: reportChat.body.dispatch.channelLabel,
            company: reportChat.body.dispatch.company,
            to: reportChat.body.dispatch.to,
          }
        : null,
      rows: reportRows(MENTOR, "envivo").filter((row) => String(row.subject || "").includes(stamp)),
    },
    phone: {
      status: reportPhone.status,
      ok: reportPhone.body?.ok,
      error: reportPhone.body?.error,
      dispatch: reportPhone.body?.dispatch
        ? {
            result: reportPhone.body.dispatch.result,
            detail: reportPhone.body.dispatch.detail,
            channelLabel: reportPhone.body.dispatch.channelLabel,
            company: reportPhone.body.dispatch.company,
            to: reportPhone.body.dispatch.to,
          }
        : null,
      rows: reportRows(SEM, "telefono").slice(0, 8),
    },
  };

  out.mailbox = await readMailbox(stamp);
} finally {
  if (sessions.length) {
    await db.collection("identity_sessions").deleteMany({ _id: { $in: sessions.map((item) => item.id) } });
  }
  await client.close();
}

writeFileSync("tmp-attn-fix-e2e-out.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));

async function companyAdminId(sessionId, tenantId) {
  const directory = await api(sessionId, "/api/desktop/attention", {
    method: "POST",
    body: JSON.stringify({ action: "company-directory", tenantId }),
  });
  return directory.body?.admins?.[0]?.userId || "";
}

async function readMailbox(stamp) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return { tried: false, reason: "sin clave de envío" };
  const list = await fetch("https://api.resend.com/emails?limit=20", {
    headers: { Authorization: `Bearer ${key}` },
  });
  const payload = await list.json().catch(() => null);
  if (!list.ok) {
    return { tried: true, listStatus: list.status, openedAttachment: false, reason: payload?.message || "el listado no respondió" };
  }
  const rows = payload?.data || [];
  const match = rows.find((item) => String(item.subject || "").includes("Informe de incidencias") && String(item.created_at || "") >= stamp.slice(0, 13));
  if (!match?.id) {
    return {
      tried: true,
      listStatus: list.status,
      openedAttachment: false,
      subjects: rows.slice(0, 5).map((item) => item.subject),
      reason: "el listado no trajo el envío de esta pasada",
    };
  }
  const detail = await fetch(`https://api.resend.com/emails/${match.id}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const email = await detail.json().catch(() => null);
  const attachments = email?.attachments || email?.data?.attachments || [];
  const html = String(email?.html || "");
  const companies = ["Seminario", "Mentor"];
  const named = companies.filter((name) => html.includes(name) || String(email?.subject || match.subject || "").includes(name));
  return {
    tried: true,
    listStatus: list.status,
    emailStatus: detail.status,
    lastEvent: email?.last_event || match.last_event || null,
    subject: email?.subject || match.subject,
    to: email?.to || match.to,
    htmlNamesCompany: named,
    attachmentNames: attachments.map((item) => item.filename || item.name).filter(Boolean),
    openedAttachment: attachments.some((item) => item.content || item.download_url),
    reason: attachments.length
      ? "el proveedor lista el adjunto, pero la respuesta no trae el archivo para abrirlo"
      : "la ficha del envío no incluye el archivo adjunto",
  };
}
