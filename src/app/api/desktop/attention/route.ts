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
  recordEconomicApproval,
  reopenAttentionCase,
  setAttentionArea,
  setAttentionPriority,
  setAttentionStatus,
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
  takeCorrelative,
} from "@/lib/desktop/attention-store";
import { formatFromHeader, getResendClient, mailboxForSend } from "@/lib/notifications/transport";
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
  attachment: "La captura tiene que ser una imagen pequeña.",
  contact: "Hay que verificar el contacto para seguir este caso.",
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

async function loadVisible(actor: AttentionActor): Promise<{
  cases: AttentionCase[];
  areaNames: Map<string, string>;
  areas: Array<{ id: string; name: string; description: string; active: boolean }>;
}> {
  const config = await readAttentionConfig();
  const pool =
    actor.kind === "client" && actor.tenantId
      ? await listAttentionCasesForTenant(actor.tenantId)
      : await listAttentionCases();
  const areas = config.areas.filter((area) => {
    if (actor.kind === "client") return area.active;
    return actor.allAreas || actor.areaIds.includes(area.id);
  });
  return {
    cases: visibleAttentionCases(pool, actor),
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

  const loaded = await loadVisible(actor);
  const names = await companiesFor(actor);
  const colleagues = actor.kind === "staff" ? await listAttentionColleagues() : [];
  const locations = new Map<string, HelpLocation>();
  if (actor.kind === "staff") {
    await Promise.all(
      loaded.cases.map(async (item) => {
        const signal = await readHelpLocation(item.tenantId, item.requesterUserId);
        if (signal) locations.set(`${item.tenantId}:${item.requesterUserId}`, signal);
      })
    );
  }
  const badge = attentionBadge(loaded.cases, actor);
  return NextResponse.json({
    ok: true,
    mode: actor.kind === "staff" ? "panel" : "client",
    online: attentionOnline().online,
    areas: loaded.areas,
    cases: presentVisible(loaded.cases, actor, names, loaded.areaNames, locations),
    colleagues,
    companies:
      actor.kind === "staff"
        ? [...names.entries()].map(([tenantId, name]) => ({ tenantId, name })).sort((a, b) => a.name.localeCompare(b.name, "es"))
        : [],
    badge,
  });
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

  const config = await readAttentionConfig();
  const names = await companiesFor(actor);
  const areaNames = new Map(config.areas.map((area) => [area.id, area.name]));

  const finish = async (item: AttentionCase) => {
    await saveAttentionCase(item);
    const signal = actor.kind === "staff" ? await readHelpLocation(item.tenantId, item.requesterUserId) : null;
    const view = presentAttentionCase(item, actor, {
      company: companyName(item, names),
      areaName: areaNames.get(item.areaId) || item.areaId,
      location: actor.kind === "staff" ? presentHelpLocation(signal, Date.now()) : null,
    });
    return NextResponse.json({
      ok: true,
      case: view,
      receipt: item.correlative ? { title: "Solicitud recibida", correlative: item.correlative } : null,
    });
  };

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
    const tenantId =
      actor.kind === "staff"
        ? typeof body?.tenantId === "string"
          ? body.tenantId.trim()
          : ""
        : actor.tenantId || "";
    if (actor.kind === "staff" && !names.has(tenantId)) return fail("forbidden", 403);
    let correlative = "";
    try {
      correlative = await takeCorrelative();
    } catch {
      return fail("missing", 500);
    }
    const asRequester = body?.asRequester === true && Boolean(tenantId);
    const requester: AttentionActor = asRequester
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
          forCompany: !asRequester && actor.kind === "staff",
        })
      : openAttentionCase({
          ...shared,
          contextNote: typeof body?.contextNote === "string" ? body.contextNote : "",
          productId: typeof body?.productId === "string" ? body.productId : "",
        });
    if (!opened.ok) return fail(opened.reason, opened.reason === "forbidden" ? 403 : 400);
    return finish(opened.case);
  }

  const caseId = typeof body?.caseId === "string" ? body.caseId.trim() : "";
  const current = caseId ? await findAttentionCase(caseId) : null;
  if (!current || !canSeeAttentionCase(actor, current)) {
    return NextResponse.json({ ok: false, reason: "missing" }, { status: 404 });
  }

  if (action === "read") {
    return finish(markCaseRead(current, actor, now));
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

  if (action === "message") {
    const result = appendCaseMessage(current, {
      actor,
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
