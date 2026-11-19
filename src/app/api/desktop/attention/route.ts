import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomInt, randomUUID } from "node:crypto";
import { findTenantById, listTenants } from "@/core/tenant";
import { requireAuth } from "@/core/identity";
import {
  hasPlatformOperatorCapability,
  hasPlatformOwnerCapability,
} from "@/core/identity/platform/capability";
import { findMembership } from "@/lib/identity/memberships";
import { findUserByEmail } from "@/lib/identity/users";
import {
  appendCaseMessage,
  askCaseInformation,
  assignAttentionCase,
  attentionBadge,
  attentionOnline,
  canSeeAttentionCase,
  isCasePriority,
  isCaseStatus,
  markCaseRead,
  openAttentionCase,
  presentAttentionCase,
  promoteChatToTicket,
  requestClientConfirmation,
  resolveClientConfirmation,
  recordEconomicApproval,
  reopenAttentionCase,
  setAttentionArea,
  setAttentionPriority,
  setAttentionStatus,
  statusLabel,
  visibleAttentionCases,
  type AttentionActor,
  type AttentionCase,
  type PublicAttentionCase,
} from "@/lib/desktop/attention";
import {
  beginVisitorTicket,
  followVisitorTicket,
  helpLocationFromOrigin,
  linkVisitorCompany,
  openHelpTicket,
  presentHelpLocation,
  verifyVisitorContact,
} from "@/lib/desktop/help-desk";
import { formatHelpOrigin } from "@/lib/desktop/help-origins";
import type { HelpLocation } from "@/lib/desktop/help-origins";
import {
  findAttentionCase,
  findAttentionCaseByCorrelative,
  listAttentionCases,
  listAttentionCasesForTenant,
  listAttentionColleagues,
  readAttentionConfig,
  readHelpLocation,
  saveAttentionCase,
  saveHelpLocation,
  saveReportDispatch,
  takeCorrelative,
} from "@/lib/desktop/attention-store";
import { formatFromHeader, getResendClient, mailboxForSend } from "@/lib/notifications/transport";
import {
  attentionCaseInDesk,
  attentionCasesInScope,
  attentionDeskScope,
  attentionMemberActor,
  attentionOpenTarget,
  chatCaseActor,
  enteredTenantFromCookie,
  resolveChatOpening,
  type AttentionDeskScope,
} from "@/lib/desktop/attention-context";
import { listCompanyPeople } from "@/lib/desktop/platform-directory";
import {
  applyManualIntake,
  clipReportMessage,
  intakeChannelLabel,
  filterIncidents,
  incidentTotals,
  isIntakeChannel,
  reportPeriod,
  reportSince,
  resolveIntakeChannel,
  sendRequiresCompany,
  type ReportDispatchRecord,
} from "@/lib/desktop/platform-desk";
import { buildIncidentReportPdf, reportFileName, reportMailSubject } from "@/lib/desktop/platform-report-pdf";
import { DESK_ENTERED_COOKIE } from "@/lib/desktop/catalog";
import { hasAnySpaceSetting } from "@/lib/desktop/space-settings";
import { readSpaceContract } from "@/lib/desktop/store";
import { getDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const REASONS: Record<string, string> = {
  empty: "Escribe un mensaje.",
  long: "El texto es demasiado largo.",
  subject: "El asunto necesita entre 3 y 120 caracteres.",
  area: "Esa área no está disponible.",
  note: "Los antecedentes son demasiado largos.",
  product: "Esa aplicación no existe.",
  priority: "La prioridad no es válida.",
  closed: "El caso está resuelto.",
  forbidden: "No tienes permiso para esta acción.",
  origin: "Ese origen no está registrado.",
  attachment: "Adjunta una imagen, un PDF o un Word de hasta 4 MB.",
  contact: "Hay que verificar el contacto para seguir este caso.",
  requester: "Indica el usuario o contacto.",
  channel: "Elige el canal de origen.",
  period: "Elige un período.",
  recipient: "Elige un administrador de esa empresa.",
  mail: "No se pudo enviar el correo.",
  company: "Elige una empresa.",
  assignee: "Esa persona no atiende esta área.",
  decided: "La aprobación económica ya quedó registrada.",
  missing: "Este caso no tiene una solicitud comercial.",
  status: "El estado no es válido.",
};

async function resolveActor(
  ctx: Exclude<Awaited<ReturnType<typeof requireAuth>>, NextResponse>
): Promise<AttentionActor | NextResponse> {
  const config = await readAttentionConfig();
  if (hasPlatformOperatorCapability(ctx.user)) {
    const owner = hasPlatformOwnerCapability(ctx.user);
    const grant = config.grants.find((item) => item.userId === ctx.user._id);
    return {
      userId: ctx.user._id,
      displayName: ctx.user.displayName,
      kind: "staff",
      tenantId: ctx.tenantId?.trim() || null,
      allAreas: owner,
      areaIds: owner ? config.areas.map((area) => area.id) : grant?.areaIds ?? [],
      orgWide: false,
      economic: false,
    };
  }

  const tenantId = ctx.tenantId?.trim() ?? "";
  if (!tenantId || !ctx.membership) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }
  const contract = await readSpaceContract(tenantId);
  const orgWide = hasAnySpaceSetting(ctx.permissions, contract.contracted);
  return {
    userId: ctx.user._id,
    displayName: ctx.user.displayName,
    kind: "client",
    tenantId,
    allAreas: false,
    areaIds: [],
    orgWide,
    economic: orgWide,
  };
}

async function companiesFor(actor: AttentionActor): Promise<Map<string, string>> {
  const db = await getDatabase();
  const names = new Map<string, string>();
  if (actor.kind === "staff") {
    const tenants = await listTenants(db);
    for (const tenant of tenants) names.set(tenant.tenantId, tenant.name);
    return names;
  }
  if (actor.tenantId) {
    const tenant = await findTenantById(db, actor.tenantId);
    if (tenant) names.set(tenant.tenantId, tenant.name);
  }
  return names;
}

function companyName(item: AttentionCase, names: Map<string, string>): string {
  if (item.visitorEmail && !item.tenantId) return "Web pública";
  return names.get(item.tenantId) || item.tenantId || "Web pública";
}

function presentVisible(
  items: AttentionCase[],
  actor: AttentionActor,
  names: Map<string, string>,
  areaNames: Map<string, string>,
  locations: Map<string, HelpLocation>
): PublicAttentionCase[] {
  const now = Date.now();
  return items.flatMap((item) => {
    const signal = locations.get(`${item.tenantId}:${item.requesterUserId}`) ?? null;
    const view = presentAttentionCase(item, actor, {
      company: companyName(item, names),
      areaName: areaNames.get(item.areaId) || item.areaId,
      location: actor.kind === "staff" ? presentHelpLocation(signal, now) : null,
    });
    return view ? [view] : [];
  });
}

function visitorView(item: AttentionCase) {
  const place = item.helpFrom
    ? [item.helpFrom.siteOrApp, item.helpFrom.module, item.helpFrom.screen, item.helpFrom.action].filter(Boolean).join(" · ")
    : "";
  const nextStepLabel =
    item.status === "resuelto" ? "Resuelto" : item.waitingOn === "cliente" ? "Le toca al cliente" : "Le toca a NELZURI";
  return {
    correlative: item.correlative || "",
    subject: item.subject,
    status: item.status,
    helpFromLabel: item.helpFrom ? "Pidió ayuda desde" : "Origen no registrado",
    helpPlace: place,
    helpAt: item.helpFrom?.at ?? null,
    nextStepLabel,
    messages: item.messages.map((message) => ({
      id: message.id,
      at: message.at,
      role: message.role,
      label: message.authorName,
      body: message.body,
    })),
  };
}

async function resolveDesk(user: {
  platformRoles?: unknown;
  status?: string;
}, sessionTenantId: string | null | undefined): Promise<AttentionDeskScope> {
  const owner = hasPlatformOwnerCapability(user);
  const jar = await cookies();
  const entered = enteredTenantFromCookie(jar.get(DESK_ENTERED_COOKIE)?.value);
  const scope = attentionDeskScope({
    owner,
    sessionTenantId,
    enteredTenantId: entered,
  });
  if (!owner || scope.desk !== "company") return scope;
  const tenant = await findTenantById(await getDatabase(), scope.tenantId);
  if (!tenant) return { desk: "platform", tenantId: null };
  return { desk: "company", tenantId: tenant.tenantId };
}

async function loadVisible(actor: AttentionActor, scope: AttentionDeskScope): Promise<{
  cases: AttentionCase[];
  areaNames: Map<string, string>;
  areas: Array<{ id: string; name: string; description: string; active: boolean }>;
}> {
  const config = await readAttentionConfig();
  const pool =
    scope.desk === "company"
      ? await listAttentionCasesForTenant(scope.tenantId)
      : actor.kind === "staff"
        ? await listAttentionCases()
        : [];
  const areas = config.areas.filter((area) => {
    if (actor.kind === "client") return area.active;
    return actor.allAreas || actor.areaIds.includes(area.id);
  });
  return {
    cases: visibleAttentionCases(attentionCasesInScope(pool, scope), actor),
    areaNames: new Map(config.areas.map((area) => [area.id, area.name])),
    areas: areas.map((area) => ({
      id: area.id,
      name: area.name,
      description: area.description,
      active: area.active,
    })),
  };
}

export async function GET() {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;
  const actor = await resolveActor(ctx);
  if (actor instanceof NextResponse) return actor;
  const scope = await resolveDesk(ctx.user, ctx.tenantId);
  const deskActor = attentionMemberActor(actor, scope);

  const loaded = await loadVisible(deskActor, scope);
  const names = await companiesFor(deskActor);
  const colleagues = deskActor.kind === "staff" ? await listAttentionColleagues() : [];
  const locations = new Map<string, HelpLocation>();
  if (deskActor.kind === "staff") {
    await Promise.all(
      loaded.cases.map(async (item) => {
        const signal = await readHelpLocation(item.tenantId, item.requesterUserId);
        if (signal) locations.set(`${item.tenantId}:${item.requesterUserId}`, signal);
      })
    );
  }
  const badge = attentionBadge(loaded.cases, deskActor);
  const activeCompany =
    scope.desk === "company"
      ? { tenantId: scope.tenantId, name: names.get(scope.tenantId) || scope.tenantId }
      : null;
  return NextResponse.json({
    ok: true,
    mode: deskActor.kind === "staff" ? "panel" : "client",
    desk: scope.desk,
    activeCompany,
    online: attentionOnline().online,
    areas: loaded.areas,
    cases: presentVisible(loaded.cases, deskActor, names, loaded.areaNames, locations),
    colleagues,
    companies:
      scope.desk === "platform" && actor.kind === "staff"
        ? [...names.entries()].map(([tenantId, name]) => ({ tenantId, name })).sort((a, b) => a.name.localeCompare(b.name, "es"))
        : [],
    badge,
    viewerUserId: actor.userId,
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char);
}

async function mailIncidentReport(input: {
  to: string;
  cc: string[];
  subject: string;
  message: string;
  company: string;
  periodLabel: string;
  filename: string;
  pdf: Uint8Array;
}): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;
  const note = input.message ? `<p>${escapeHtml(input.message)}</p>` : "";
  const sent = await resend.emails
    .send({
      from: formatFromHeader("NELZURI", mailboxForSend()),
      to: input.to,
      cc: input.cc.length > 0 ? input.cc : undefined,
      subject: input.subject,
      html: `<p>Informe de incidencias de ${escapeHtml(input.company)} · ${escapeHtml(input.periodLabel)}.</p>${note}`,
      attachments: [{ filename: input.filename, content: Buffer.from(input.pdf) }],
    })
    .catch(() => null);
  return Boolean(sent && !sent.error);
}

async function mailVisitorCode(email: string, code: string, correlative: string): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;
  const sent = await resend.emails
    .send({
      from: formatFromHeader("NELZURI", mailboxForSend()),
      to: email,
      subject: `Código para seguir el caso ${correlative}`,
      html: `<p>Tu código para seguir el caso ${correlative} es <strong>${code}</strong>.</p>`,
    })
    .catch(() => null);
  return Boolean(sent && !sent.error);
}

async function visitorPost(
  action: string,
  body: Record<string, unknown> | null,
  now: string,
  fail: (reason: string, status?: number) => NextResponse
) {
  const config = await readAttentionConfig();
  if (action === "visitor-open") {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    let correlative = "";
    try {
      correlative = await takeCorrelative();
    } catch {
      return fail("missing", 500);
    }
    const requestedOrigin = typeof body?.originId === "string" ? body.originId.trim() : "";
    const capturedAt = typeof body?.capturedAt === "string" && body.capturedAt.trim() ? body.capturedAt : now;
    const opened = beginVisitorTicket({
      name: typeof body?.name === "string" ? body.name : "",
      email: typeof body?.email === "string" ? body.email : "",
      body: typeof body?.body === "string" ? body.body : "",
      originId: requestedOrigin || "web.publica.pedir-ayuda",
      capturedAt,
      correlative,
      areas: config.areas,
      id: randomUUID(),
      messageId: randomUUID(),
      eventId: randomUUID(),
      now,
      code,
    });
    if (!opened.ok) return fail(opened.reason, 400);
    await saveAttentionCase(opened.case);
    const mailSent = await mailVisitorCode(
      opened.case.visitorEmail || "",
      code,
      opened.case.correlative || correlative
    );
    return NextResponse.json({
      ok: true,
      correlative: opened.case.correlative,
      mailSent,
      receipt: { title: "Solicitud recibida", correlative: opened.case.correlative || correlative },
      helpFromLabel: "Origen",
      helpPlace: opened.case.helpFrom ? formatHelpOrigin(opened.case.helpFrom) : "",
    });
  }

  const correlative = typeof body?.correlative === "string" ? body.correlative : "";
  const current = await findAttentionCaseByCorrelative(correlative);
  if (!current?.visitorEmail) return fail("missing", 404);
  const email = typeof body?.email === "string" ? body.email : "";
  const code = typeof body?.code === "string" ? body.code : "";
  const verified = verifyVisitorContact(current, { email, code, now });
  if (!verified.ok) return fail("contact", 403);
  if (action === "visitor-verify") {
    await saveAttentionCase(verified.case);
    return NextResponse.json({ ok: true, case: visitorView(verified.case) });
  }
  if (action === "visitor-message") {
    const followed = followVisitorTicket(verified.case, {
      body: typeof body?.body === "string" ? body.body : "",
      id: randomUUID(),
      now,
    });
    if (!followed.ok) return fail(followed.reason, 400);
    await saveAttentionCase(followed.case);
    return NextResponse.json({ ok: true, case: visitorView(followed.case) });
  }
  return fail("missing");
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = typeof body?.action === "string" ? body.action : "";
  const now = new Date().toISOString();
  const fail = (reason: string, status = 400) =>
    NextResponse.json({ ok: false, reason, error: REASONS[reason] || "No se pudo guardar." }, { status });

  if (action === "visitor-open" || action === "visitor-verify" || action === "visitor-message") {
    return visitorPost(action, body, now, fail);
  }

  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;
  const actor = await resolveActor(ctx);
  if (actor instanceof NextResponse) return actor;
  const scope = await resolveDesk(ctx.user, ctx.tenantId);
  const deskActor = attentionMemberActor(actor, scope);

  const config = await readAttentionConfig();
  const names = await companiesFor(actor.kind === "staff" ? actor : deskActor);
  const areaNames = new Map(config.areas.map((area) => [area.id, area.name]));

  const finish = async (item: AttentionCase) => {
    await saveAttentionCase(item);
    const signal = deskActor.kind === "staff" ? await readHelpLocation(item.tenantId, item.requesterUserId) : null;
    const view = presentAttentionCase(item, deskActor, {
      company: companyName(item, names),
      areaName: areaNames.get(item.areaId) || item.areaId,
      location: deskActor.kind === "staff" ? presentHelpLocation(signal, Date.now()) : null,
    });
    return NextResponse.json({
      ok: true,
      case: view,
      receipt: item.correlative ? { title: "Solicitud recibida", correlative: item.correlative } : null,
    });
  };

  if (action === "company-directory" || action === "send-report") {
    if (actor.kind !== "staff" || scope.desk !== "platform") return fail("forbidden", 403);
    const tenantId = typeof body?.tenantId === "string" ? body.tenantId.trim() : "";
    if (sendRequiresCompany(tenantId) || !names.has(tenantId)) return fail("company");
    const people = await listCompanyPeople(tenantId);
    if (action === "company-directory") {
      return NextResponse.json({
        ok: true,
        admins: people.filter((person) => person.admin),
        authorized: people,
      });
    }
    const periodId = typeof body?.period === "string" ? body.period : "";
    const period = reportPeriod(periodId);
    const since = reportSince(periodId, Date.now());
    if (!period || since == null) return fail("period");
    const channel = typeof body?.channel === "string" ? body.channel.trim() : "";
    if (channel && !isIntakeChannel(channel)) return fail("channel");
    const clipped = clipReportMessage(typeof body?.message === "string" ? body.message : "");
    if (!clipped.ok) return fail(clipped.reason);
    const toUserId = typeof body?.toUserId === "string" ? body.toUserId.trim() : "";
    const ccIds = Array.isArray(body?.ccUserIds)
      ? [...new Set(body.ccUserIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0))]
      : [];
    const to = people.find((person) => person.userId === toUserId && person.admin);
    if (!to) return fail("recipient");
    const cc = ccIds.filter((id) => id !== to.userId).flatMap((id) => {
      const person = people.find((item) => item.userId === id);
      return person ? [person] : [];
    });
    if (cc.length !== ccIds.filter((id) => id !== to.userId).length) return fail("recipient");
    const loaded = await loadVisible(deskActor, scope);
    const company = names.get(tenantId) || tenantId;
    const incidents = filterIncidents(loaded.cases, { since, tenantId, channel }).map((item) => ({
      code: item.correlative?.trim() || item.id,
      subject: item.subject,
      requester: item.requesterName,
      channel: intakeChannelLabel(resolveIntakeChannel(item)),
      status: statusLabel(item.status),
    }));
    const totals = incidentTotals(filterIncidents(loaded.cases, { since, tenantId, channel }));
    const pdf = buildIncidentReportPdf({
      company,
      periodLabel: period.label,
      channelLabel: channel ? intakeChannelLabel(channel) : "Todos los canales",
      totals,
      rows: incidents,
      emittedAt: new Date().toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" }),
    });
    const mailed = await mailIncidentReport({
      to: to.email,
      cc: cc.map((person) => person.email),
      subject: reportMailSubject(company, period.label),
      message: clipped.message,
      company,
      periodLabel: period.label,
      filename: reportFileName(company),
      pdf,
    });
    const dispatch: ReportDispatchRecord = {
      id: randomUUID(),
      at: now,
      actorUserId: actor.userId,
      actorName: actor.displayName,
      tenantId,
      company,
      periodLabel: period.label,
      channelLabel: channel ? intakeChannelLabel(channel) : "Todos los canales",
      to: [{ userId: to.userId, name: to.name, email: to.email }],
      cc: cc.map((person) => ({ userId: person.userId, name: person.name, email: person.email })),
      message: clipped.message,
      result: mailed ? "enviado" : "fallido",
      detail: mailed ? "Correo aceptado." : "El correo no salió.",
    };
    await saveReportDispatch(dispatch);
    return NextResponse.json({ ok: true, dispatch });
  }

  if (action === "locate") {
    if (actor.kind !== "client" || !actor.tenantId) return fail("forbidden", 403);
    const located = helpLocationFromOrigin({
      originId: typeof body?.originId === "string" ? body.originId : "",
      tenantId: actor.tenantId,
      userId: actor.userId,
      seenAt: now,
    });
    if (!located.ok) return fail(located.reason);
    await saveHelpLocation(located.location);
    return NextResponse.json({ ok: true, location: presentHelpLocation(located.location, Date.now()) });
  }

  if (action === "open") {
    const originId = typeof body?.originId === "string" ? body.originId.trim() : "";
    const requestedTenant = typeof body?.tenantId === "string" ? body.tenantId : "";
    const chatOpen = originId === "escritorio.chat-en-vivo";
    const chatTarget = chatOpen ? resolveChatOpening({ scope, chosenTenantId: requestedTenant }) : null;
    if (chatOpen && chatTarget && !chatTarget.ok) return fail(chatTarget.reason, 400);
    const target = chatTarget?.ok
      ? { ok: true as const, tenantId: chatTarget.tenantId, asMember: true }
      : attentionOpenTarget(scope, requestedTenant);
    if (!target.ok) return fail(target.reason, 400);
    const asMember = target.asMember || (scope.desk === "platform" && body?.asRequester === true);
    if (actor.kind === "staff" && !names.has(target.tenantId)) return fail("forbidden", 403);
    if (actor.kind === "client" && actor.tenantId !== target.tenantId) return fail("forbidden", 403);
    const tenantId = target.tenantId;
    let correlative = "";
    try {
      correlative = await takeCorrelative();
    } catch {
      return fail("missing", 500);
    }
    const requester: AttentionActor = chatOpen
      ? chatCaseActor(actor, tenantId)
      : asMember && actor.kind === "staff"
        ? { ...actor, kind: "client", tenantId, allAreas: false, areaIds: [], orgWide: false, economic: false }
        : actor;
    const shared = {
      areas: config.areas,
      actor: requester,
      tenantId,
      areaId: typeof body?.areaId === "string" ? body.areaId : "",
      subject: typeof body?.subject === "string" ? body.subject : "",
      body: typeof body?.body === "string" ? body.body : "",
      priority: typeof body?.priority === "string" ? body.priority : "normal",
      id: randomUUID(),
      messageId: randomUUID(),
      eventId: randomUUID(),
      now,
      correlative,
    };
    const opened = originId
      ? openHelpTicket({
          ...shared,
          originId,
          capturedAt: typeof body?.capturedAt === "string" && body.capturedAt.trim() ? body.capturedAt : now,
          whereNote: typeof body?.whereNote === "string" ? body.whereNote : "",
          attachment: body?.attachment,
          forCompany: !chatOpen && actor.kind === "staff" && !asMember,
        })
      : openAttentionCase({
          ...shared,
          contextNote: typeof body?.contextNote === "string" ? body.contextNote : "",
          productId: typeof body?.productId === "string" ? body.productId : "",
          forCompany: !chatOpen && actor.kind === "staff" && !asMember,
        });
    if (!opened.ok) return fail(opened.reason, opened.reason === "forbidden" ? 403 : 400);
    const contactName = typeof body?.contactName === "string" ? body.contactName : "";
    const intakeRaw = typeof body?.intakeChannel === "string" ? body.intakeChannel : "";
    const linkedUserId = typeof body?.requesterUserId === "string" ? body.requesterUserId.trim() : "";
    if (!chatOpen && actor.kind === "staff" && !asMember && (contactName.trim() || intakeRaw.trim() || linkedUserId)) {
      let linkedName = contactName;
      if (linkedUserId) {
        const people = await listCompanyPeople(tenantId);
        const person = people.find((item) => item.userId === linkedUserId);
        if (!person) return fail("requester");
        linkedName = person.name;
      }
      const manual = applyManualIntake(opened.case, {
        contactName: linkedName,
        channel: intakeRaw,
        operatorUserId: actor.userId,
        operatorName: actor.displayName,
        requesterUserId: linkedUserId,
      });
      if (!manual.ok) return fail(manual.reason === "contact" ? "requester" : manual.reason);
      return finish(manual.case);
    }
    return finish(opened.case);
  }

  const supportAction =
    action === "request-info" ||
    action === "reopen" ||
    action === "link-company" ||
    action === "area" ||
    action === "assign" ||
    action === "status" ||
    action === "priority";
  if (scope.desk === "company" && supportAction) return fail("forbidden", 403);

  const caseId = typeof body?.caseId === "string" ? body.caseId.trim() : "";
  const current = caseId ? await findAttentionCase(caseId) : null;
  if (!current || !canSeeAttentionCase(deskActor, current) || !attentionCaseInDesk(scope, current.tenantId)) {
    return NextResponse.json({ ok: false, reason: "missing" }, { status: 404 });
  }

  if (action === "read") {
    return finish(markCaseRead(current, deskActor, now));
  }

  if (action === "request-info") {
    const result = askCaseInformation(current, {
      actor,
      body: typeof body?.body === "string" ? body.body : "",
      id: randomUUID(),
      eventId: randomUUID(),
      now,
    });
    if (!result.ok) return fail(result.reason, result.reason === "forbidden" ? 403 : 400);
    return finish(result.case);
  }

  if (action === "reopen") {
    const result = reopenAttentionCase(current, { actor, id: randomUUID(), now });
    if (!result.ok) return fail(result.reason, result.reason === "forbidden" ? 403 : 400);
    return finish(result.case);
  }

  if (action === "link-company") {
    if (actor.kind !== "staff" || !current.visitorEmail) return fail("forbidden", 403);
    const tenantId = typeof body?.tenantId === "string" ? body.tenantId.trim() : "";
    if (!names.has(tenantId)) return fail("forbidden", 403);
    const user = await findUserByEmail(current.visitorEmail);
    const membership = user ? await findMembership(user._id, tenantId) : null;
    const linked = linkVisitorCompany(current, {
      tenantId,
      relationshipVerified: Boolean(membership),
      actorUserId: actor.userId,
      eventId: randomUUID(),
      now,
    });
    if (!linked.ok) return fail(linked.reason, 403);
    return finish(linked.case);
  }

  if (action === "promote") {
    const result = promoteChatToTicket(current, { actor, id: randomUUID(), now });
    if (!result.ok) return fail(result.reason, result.reason === "forbidden" ? 403 : 400);
    return finish(result.case);
  }

  if (action === "confirm-ask") {
    const result = requestClientConfirmation(current, { actor, id: randomUUID(), now });
    if (!result.ok) return fail(result.reason, result.reason === "forbidden" ? 403 : 400);
    return finish(result.case);
  }

  if (action === "confirm") {
    const decision = body?.decision === "resuelto" || body?.decision === "sigue" ? body.decision : "";
    if (!decision) return fail("status");
    const result = resolveClientConfirmation(current, {
      actor: deskActor,
      decision,
      reason: typeof body?.reason === "string" ? body.reason : "",
      id: randomUUID(),
      now,
    });
    if (!result.ok) return fail(result.reason, result.reason === "forbidden" ? 403 : 400);
    return finish(result.case);
  }

  if (action === "message") {
    const asClient = body?.asClient === true && actor.userId === current.requesterUserId;
    const writer = asClient ? chatCaseActor(actor, current.tenantId) : deskActor;
    const result = appendCaseMessage(current, {
      actor: writer,
      body: typeof body?.body === "string" ? body.body : "",
      id: randomUUID(),
      now,
    });
    if (!result.ok) return fail(result.reason, result.reason === "forbidden" ? 403 : 400);
    return finish(result.case);
  }

  if (action === "area") {
    const areaId = typeof body?.areaId === "string" ? body.areaId : "";
    const result = setAttentionArea(current, {
      actor,
      areaId,
      areas: config.areas,
      id: randomUUID(),
      now,
    });
    if (!result.ok) return fail(result.reason, result.reason === "forbidden" ? 403 : 400);
    return finish(result.case);
  }

  if (action === "assign") {
    const raw = body?.assigneeUserId;
    const assigneeId = typeof raw === "string" ? raw.trim() : "";
    const colleagues = await listAttentionColleagues();
    const assignee = assigneeId ? colleagues.find((person) => person.userId === assigneeId) ?? null : null;
    if (assigneeId && !assignee) return fail("assignee");
    const result = assignAttentionCase(current, {
      actor,
      assignee,
      id: randomUUID(),
      now,
    });
    if (!result.ok) return fail(result.reason, result.reason === "forbidden" ? 403 : 400);
    return finish(result.case);
  }

  if (action === "status") {
    const status = typeof body?.status === "string" ? body.status : "";
    if (!isCaseStatus(status)) return fail("status");
    if (status === "resuelto" || status === "confirmacion") {
      const asked = requestClientConfirmation(current, { actor, id: randomUUID(), now });
      if (!asked.ok) return fail(asked.reason, asked.reason === "forbidden" ? 403 : 400);
      return finish(asked.case);
    }
    const result = setAttentionStatus(current, { actor, status, id: randomUUID(), now });
    if (!result.ok) return fail(result.reason, 403);
    return finish(result.case);
  }

  if (action === "priority") {
    const priority = typeof body?.priority === "string" ? body.priority : "";
    if (!isCasePriority(priority)) return fail("priority");
    const result = setAttentionPriority(current, { actor, priority, id: randomUUID(), now });
    if (!result.ok) return fail(result.reason, 403);
    return finish(result.case);
  }

  if (action === "approve") {
    const decision = body?.decision === "aprobada" || body?.decision === "rechazada" ? body.decision : "";
    if (!decision) return fail("missing");
    const result = recordEconomicApproval(current, {
      actor,
      decision,
      conditions: typeof body?.conditions === "string" ? body.conditions : "",
      messageId: randomUUID(),
      eventId: randomUUID(),
      now,
    });
    if (!result.ok) return fail(result.reason, result.reason === "forbidden" ? 403 : 400);
    return finish(result.case);
  }

  return fail("missing");
}
