import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { findTenantById, listTenants } from "@/core/tenant";
import { requireAuth } from "@/core/identity";
import {
  hasPlatformOperatorCapability,
  hasPlatformOwnerCapability,
} from "@/core/identity/platform/capability";
import {
  appendCaseMessage,
  assignAttentionCase,
  attentionOnline,
  canSeeAttentionCase,
  isCasePriority,
  isCaseStatus,
  markCaseRead,
  openAttentionCase,
  presentAttentionCase,
  recordEconomicApproval,
  setAttentionPriority,
  setAttentionStatus,
  visibleAttentionCases,
  type AttentionActor,
  type AttentionCase,
  type PublicAttentionCase,
} from "@/lib/desktop/attention";
import {
  findAttentionCase,
  listAttentionCases,
  listAttentionCasesForTenant,
  listAttentionColleagues,
  readAttentionConfig,
  saveAttentionCase,
} from "@/lib/desktop/attention-store";
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

function presentVisible(
  items: AttentionCase[],
  actor: AttentionActor,
  names: Map<string, string>,
  areaNames: Map<string, string>
): PublicAttentionCase[] {
  return items.flatMap((item) => {
    const view = presentAttentionCase(item, actor, {
      company: names.get(item.tenantId) || item.tenantId,
      areaName: areaNames.get(item.areaId) || item.areaId,
    });
    return view ? [view] : [];
  });
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
  return NextResponse.json({
    ok: true,
    mode: actor.kind === "staff" ? "panel" : "client",
    online: attentionOnline().online,
    areas: loaded.areas,
    cases: presentVisible(loaded.cases, actor, names, loaded.areaNames),
    colleagues,
  });
}

export async function POST(request: Request) {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;
  const actor = await resolveActor(ctx);
  if (actor instanceof NextResponse) return actor;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = typeof body?.action === "string" ? body.action : "";
  const now = new Date().toISOString();
  const config = await readAttentionConfig();
  const names = await companiesFor(actor);
  const areaNames = new Map(config.areas.map((area) => [area.id, area.name]));

  const finish = async (item: AttentionCase) => {
    await saveAttentionCase(item);
    const view = presentAttentionCase(item, actor, {
      company: names.get(item.tenantId) || item.tenantId,
      areaName: areaNames.get(item.areaId) || item.areaId,
    });
    return NextResponse.json({ ok: true, case: view });
  };

  const fail = (reason: string, status = 400) =>
    NextResponse.json({ ok: false, reason, error: REASONS[reason] || "No se pudo guardar." }, { status });

  if (action === "open") {
    const opened = openAttentionCase({
      areas: config.areas,
      actor,
      tenantId: actor.tenantId || "",
      areaId: typeof body?.areaId === "string" ? body.areaId : "",
      subject: typeof body?.subject === "string" ? body.subject : "",
      body: typeof body?.body === "string" ? body.body : "",
      contextNote: typeof body?.contextNote === "string" ? body.contextNote : "",
      priority: typeof body?.priority === "string" ? body.priority : "normal",
      productId: typeof body?.productId === "string" ? body.productId : "",
      id: randomUUID(),
      messageId: randomUUID(),
      eventId: randomUUID(),
      now,
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
