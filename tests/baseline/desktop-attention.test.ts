import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  activateCommercialCase,
  addAttentionArea,
  appendCaseMessage,
  assignAttentionCase,
  attentionBadge,
  attentionOnline,
  canSeeAttentionCase,
  DEFAULT_ATTENTION_AREAS,
  filterAttentionCases,
  formatAttentionWhen,
  groupAttentionOrgs,
  legacyCaseFromThread,
  mergeAttentionAreas,
  noteCommercialRequest,
  openAttentionCase,
  presentAttentionCase,
  pickOwnLiveThread,
  promoteChatToTicket,
  requestClientConfirmation,
  resolveClientConfirmation,
  recordEconomicApproval,
  setAttentionAreaActive,
  type AttentionActor,
  type AttentionCase,
  type AttentionColleague,
} from "../../src/lib/desktop/attention";

const NOW = "2026-11-16T12:00:00.000Z";

function client(partial: Partial<AttentionActor> = {}): AttentionActor {
  return {
    userId: "user-1",
    displayName: "Ana Pérez",
    kind: "client",
    tenantId: "sem",
    allAreas: false,
    areaIds: [],
    orgWide: false,
    economic: false,
    ...partial,
  };
}

function staff(partial: Partial<AttentionActor> = {}): AttentionActor {
  return {
    userId: "owner-1",
    displayName: "Nelzuri",
    kind: "staff",
    tenantId: null,
    allAreas: false,
    areaIds: ["tecnico"],
    orgWide: false,
    economic: false,
    ...partial,
  };
}

function colleague(partial: Partial<AttentionColleague> = {}): AttentionColleague {
  return { userId: "agent-1", displayName: "Luis Soto", allAreas: false, areaIds: ["tecnico"], ...partial };
}

function openTechnical(actor = client()): AttentionCase {
  const opened = openAttentionCase({
    areas: DEFAULT_ATTENTION_AREAS,
    actor,
    tenantId: "sem",
    areaId: "tecnico",
    subject: "No puedo entrar",
    body: "La clave no funciona.",
    contextNote: "Captura del error.",
    id: "case-1",
    messageId: "m1",
    eventId: "e1",
    now: NOW,
  });
  assert.equal(opened.ok, true);
  if (!opened.ok) throw new Error("caso");
  return opened.case;
}

describe("Atención por casos", () => {
  it("no declara ejecutivos en línea y el filtro en vivo queda vacío", () => {
    assert.deepEqual(attentionOnline(), { online: false });
    const item = openTechnical();
    assert.equal(filterAttentionCases([item], { view: "vivo" }).length, 0);
    assert.equal(item.status, "pendiente");
    assert.equal(item.assigneeUserId, null);
  });

  it("abre un caso en el área elegida y no lo mezcla con otro motivo", () => {
    const first = openTechnical();
    const second = openAttentionCase({
      areas: DEFAULT_ATTENTION_AREAS,
      actor: client(),
      tenantId: "sem",
      areaId: "operativo",
      subject: "Cómo exportar",
      body: "No encuentro el botón.",
      id: "case-2",
      messageId: "m2",
      eventId: "e2",
      now: "2026-11-16T13:00:00.000Z",
    });
    assert.equal(second.ok, true);
    if (!second.ok) return;
    assert.notEqual(first.id, second.case.id);
    assert.equal(first.areaId, "tecnico");
    assert.equal(second.case.areaId, "operativo");
    assert.equal(first.messages.length, 1);
    assert.equal(first.contextNote, "Captura del error.");
    assert.equal(filterAttentionCases([first, second.case], { view: "pendientes" }).length, 2);
  });

  it("un cliente de otra empresa no ve el caso y un ejecutivo sin el área tampoco", () => {
    const item = openTechnical();
    assert.equal(canSeeAttentionCase(client({ tenantId: "adl", userId: "otro" }), item), false);
    assert.equal(canSeeAttentionCase(staff({ areaIds: ["operativo"] }), item), false);
    assert.equal(canSeeAttentionCase(staff({ areaIds: ["tecnico"] }), item), true);
    assert.equal(canSeeAttentionCase(staff({ allAreas: true, areaIds: [] }), item), true);
    assert.equal(canSeeAttentionCase(client({ userId: "otro" }), item), false);
    assert.equal(canSeeAttentionCase(client({ userId: "otro", orgWide: true }), item), true);
    const hidden = presentAttentionCase(item, client({ tenantId: "adl" }), {
      company: "ADL",
      areaName: "Soporte técnico",
    });
    assert.equal(hidden, null);
  });

  it("el participante ve el caso y no las condiciones comerciales", () => {
    const requested = noteCommercialRequest(null, {
      tenantId: "sem",
      appId: "rrhh",
      authorUserId: "user-1",
      authorName: "Ana Pérez",
      id: "com-1",
      messageId: "m1",
      eventId: "e1",
      now: NOW,
    });
    const approved = recordEconomicApproval(requested.case, {
      actor: client({ economic: true, userId: "finanzas", displayName: "Marta Díaz" }),
      decision: "aprobada",
      conditions: "Plan anual, 12 UF.",
      messageId: "m2",
      eventId: "e2",
      now: "2026-11-16T12:30:00.000Z",
    });
    assert.equal(approved.ok, true);
    if (!approved.ok) return;
    const shared: AttentionCase = {
      ...approved.case,
      participantUserIds: ["invitado"],
    };
    const guest = presentAttentionCase(shared, client({ userId: "invitado" }), {
      company: "Seminario",
      areaName: "Comercial",
    });
    assert.ok(guest);
    assert.equal(guest?.commercial?.conditions, null);
    assert.equal(guest?.commercial?.approval, null);
    const requester = presentAttentionCase(shared, client(), {
      company: "Seminario",
      areaName: "Comercial",
    });
    assert.equal(requester?.commercial?.approval, "aprobada");
    assert.equal(requester?.commercial?.conditions, null);
    const finance = presentAttentionCase(
      shared,
      client({ economic: true, orgWide: true, userId: "finanzas" }),
      {
        company: "Seminario",
        areaName: "Comercial",
      }
    );
    assert.equal(finance?.commercial?.conditions, "Plan anual, 12 UF.");
  });

  it("pedir una aplicación abre un caso comercial y un mensaje no aprueba ni activa", () => {
    const rrhh = noteCommercialRequest(null, {
      tenantId: "sem",
      appId: "rrhh",
      authorUserId: "user-1",
      authorName: "Ana Pérez",
      id: "com-rrhh",
      messageId: "m1",
      eventId: "e1",
      now: NOW,
    });
    const again = noteCommercialRequest(rrhh.case, {
      tenantId: "sem",
      appId: "rrhh",
      authorUserId: "user-1",
      authorName: "Ana Pérez",
      id: "com-rrhh-2",
      messageId: "m2",
      eventId: "e2",
      now: "2026-11-16T12:05:00.000Z",
    });
    const cumple = noteCommercialRequest(null, {
      tenantId: "sem",
      appId: "cumple",
      authorUserId: "user-1",
      authorName: "Ana Pérez",
      id: "com-cumple",
      messageId: "m3",
      eventId: "e3",
      now: "2026-11-16T12:06:00.000Z",
    });
    assert.equal(again.already, true);
    assert.equal(again.case.messages.length, 1);
    assert.equal(rrhh.case.commercial?.approval, "sin_revision");
    assert.equal(rrhh.case.commercial?.activation, "pendiente");
    assert.notEqual(rrhh.case.id, cumple.case.id);

    const chatted = appendCaseMessage(rrhh.case, {
      actor: client(),
      body: "¿Me lo activan?",
      id: "m4",
      now: "2026-11-16T12:10:00.000Z",
    });
    assert.equal(chatted.ok, true);
    if (!chatted.ok) return;
    assert.equal(chatted.case.commercial?.approval, "sin_revision");
    assert.equal(chatted.case.commercial?.activation, "pendiente");
  });

  it("la aprobación económica no activa y la activación en Clientes no aprueba", () => {
    const requested = noteCommercialRequest(null, {
      tenantId: "sem",
      appId: "rrhh",
      authorUserId: "user-1",
      authorName: "Ana Pérez",
      id: "com-1",
      messageId: "m1",
      eventId: "e1",
      now: NOW,
    });
    const byStaff = recordEconomicApproval(requested.case, {
      actor: staff({ allAreas: true }),
      decision: "aprobada",
      messageId: "m-x",
      eventId: "e-x",
      now: NOW,
    });
    const byMember = recordEconomicApproval(requested.case, {
      actor: client(),
      decision: "aprobada",
      messageId: "m-y",
      eventId: "e-y",
      now: NOW,
    });
    assert.equal(byStaff.ok, false);
    assert.equal(byMember.ok, false);

    const approved = recordEconomicApproval(requested.case, {
      actor: client({ economic: true }),
      decision: "aprobada",
      conditions: "Acepta el plan publicado.",
      messageId: "m2",
      eventId: "e2",
      now: "2026-11-16T12:20:00.000Z",
    });
    assert.equal(approved.ok, true);
    if (!approved.ok) return;
    assert.equal(approved.case.commercial?.approval, "aprobada");
    assert.equal(approved.case.commercial?.activation, "pendiente");
    assert.equal(approved.case.commercial?.economicResponsibleUserId, "user-1");

    const activated = activateCommercialCase(requested.case, {
      appId: "rrhh",
      actorUserId: "owner-1",
      actorName: "Nelzuri",
      messageId: "m3",
      eventId: "e3",
      now: "2026-11-16T12:40:00.000Z",
    });
    assert.ok(activated);
    assert.equal(activated?.commercial?.activation, "activada");
    assert.equal(activated?.commercial?.approval, "sin_revision");
    assert.equal(activated?.messages.at(-1)?.body, "Quedó activada en Clientes.");
    assert.equal(activateCommercialCase(requested.case, {
      appId: "cumple",
      actorUserId: "owner-1",
      actorName: "Nelzuri",
      messageId: "m4",
      eventId: "e4",
      now: NOW,
    }), null);
  });

  it("asigna, transfiere y separa bandeja, sin asignar, mías y resueltos", () => {
    const item = openTechnical();
    const agent = colleague();
    const other = colleague({ userId: "agent-2", displayName: "Rita Núñez", areaIds: ["tecnico"] });
    const outsider = colleague({ userId: "agent-3", displayName: "Otra", areaIds: ["facturacion"] });
    const actor = staff({ userId: "owner-1", allAreas: true, areaIds: [] });
    const denied = assignAttentionCase(item, { actor: client(), assignee: agent, id: "e2", now: NOW });
    const wrong = assignAttentionCase(item, { actor, assignee: outsider, id: "e3", now: NOW });
    assert.equal(denied.ok, false);
    assert.equal(wrong.ok, false);

    const assigned = assignAttentionCase(item, { actor, assignee: agent, id: "e4", now: "2026-11-16T12:15:00.000Z" });
    assert.equal(assigned.ok, true);
    if (!assigned.ok) return;
    assert.equal(assigned.case.status, "abierto");
    assert.equal(assigned.case.events.at(-1)?.kind, "asignado");

    const moved = assignAttentionCase(assigned.case, {
      actor,
      assignee: other,
      id: "e5",
      now: "2026-11-16T12:16:00.000Z",
    });
    assert.equal(moved.ok, true);
    if (!moved.ok) return;
    assert.equal(moved.case.events.at(-1)?.kind, "transferido");
    assert.equal(moved.case.assigneeName, "Rita Núñez");

    const unread = attentionBadge([item], staff({ areaIds: ["tecnico"] }));
    assert.equal(unread.count, 1);
    assert.equal(unread.unreadCount, 1);
    const mine = filterAttentionCases([moved.case], { view: "mias", actorUserId: "agent-2" });
    assert.equal(mine.length, 1);
    assert.equal(filterAttentionCases([moved.case], { view: "sin_asignar" }).length, 0);
    assert.equal(filterAttentionCases([item, moved.case], { view: "general", areaId: "operativo" }).length, 0);
    assert.equal(
      filterAttentionCases([item], { view: "general", tenantId: "adl", priority: "normal", status: "pendiente" }).length,
      0
    );
  });

  it("conserva la conversación anterior como un solo caso y deja fuera un hilo vacío", () => {
    const imported = legacyCaseFromThread(
      {
        tenantId: "sem",
        messages: [
          { id: "a", at: NOW, authorUserId: "user-1", role: "client", body: "Pidió RR.HH." },
          { id: "b", at: "2026-11-16T12:05:00.000Z", authorUserId: "owner-1", role: "owner", body: "Lo vemos." },
        ],
      },
      "legacy:sem"
    );
    assert.ok(imported);
    assert.equal(imported?.subject, "Conversación anterior");
    assert.equal(imported?.messages.length, 2);
    assert.equal(imported?.messages[1]?.role, "staff");
    assert.equal(legacyCaseFromThread({ tenantId: "sem", messages: [] }, "legacy:sem"), null);

    const fresh = openTechnical();
    assert.notEqual(imported?.id, fresh.id);
    assert.equal(imported?.messages.some((message) => message.body === fresh.messages[0]?.body), false);
  });

  it("agrupa la bandeja por organización sin duplicar la empresa", () => {
    const actor = staff({ allAreas: true, areaIds: [] });
    const technical = openTechnical();
    const commercial = noteCommercialRequest(null, {
      tenantId: "sem",
      appId: "rrhh",
      authorUserId: "user-1",
      authorName: "Ana Pérez",
      id: "case-2",
      messageId: "m2",
      eventId: "e2",
      now: "2026-11-16T13:00:00.000Z",
    });
    const other = openAttentionCase({
      areas: DEFAULT_ATTENTION_AREAS,
      actor: client({ tenantId: "adl", userId: "user-2", displayName: "Ada" }),
      tenantId: "adl",
      areaId: "facturacion",
      subject: "Factura",
      body: "Necesito la boleta.",
      id: "case-3",
      messageId: "m3",
      eventId: "e3",
      now: "2026-11-16T14:00:00.000Z",
    });
    assert.equal(other.ok, true);
    if (!other.ok) return;

    const presented = [
      presentAttentionCase(technical, actor, { company: "Seminario", areaName: "Soporte técnico" }),
      presentAttentionCase(commercial.case, actor, { company: "Seminario", areaName: "Comercial" }),
      presentAttentionCase(other.case, actor, { company: "ADL", areaName: "Facturación" }),
    ].filter((row): row is NonNullable<typeof row> => Boolean(row));
    assert.equal(presented.length, 3);

    const rows = groupAttentionOrgs(presented);
    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.tenantId, "adl");
    assert.equal(rows[1]?.tenantId, "sem");
    assert.equal(rows[1]?.cases.length, 2);
    assert.equal(rows[1]?.openCount, 2);
    assert.equal(rows[1]?.preview.includes("Comercial"), true);

    const pendingOnly = groupAttentionOrgs(filterAttentionCases(presented, { view: "pendientes" }));
    assert.equal(
      pendingOnly.every((row) => row.cases.every((item) => item.status === "pendiente")),
      true
    );
    assert.equal(formatAttentionWhen("2026-11-15T13:00:00.000Z", Date.parse("2026-11-16T18:00:00.000Z")), "Ayer");
  });

  it("las áreas de plataforma aceptan una nueva y no apagan Comercial ni la última", () => {
    assert.equal(mergeAttentionAreas(null).length, DEFAULT_ATTENTION_AREAS.length);
    const added = addAttentionArea(DEFAULT_ATTENTION_AREAS, "Mesa de ayuda");
    assert.equal(added.ok, true);
    if (!added.ok) return;
    assert.equal(added.areas.at(-1)?.name, "Mesa de ayuda");
    assert.equal(addAttentionArea(added.areas, "mesa de ayuda").ok, false);
    assert.equal(setAttentionAreaActive(added.areas, "comercial", false).ok, false);

    let areas = added.areas;
    for (const area of areas) {
      if (!area.active || area.id === "comercial") continue;
      const next = setAttentionAreaActive(areas, area.id, false);
      if (!next.ok) break;
      areas = next.areas;
    }
    const active = areas.filter((area) => area.active);
    assert.equal(active.length >= 1, true);
    assert.equal(active.some((area) => area.id === "comercial"), true);
  });

  it("el chat conserva el hilo de quien escribe y no sigue un ticket de otro canal", () => {
    const portal = {
      status: "abierto",
      updatedAt: "2026-11-16T12:30:00.000Z",
      intakeChannel: "portal" as const,
      requesterUserId: "ana",
    };
    const own = {
      status: "abierto",
      updatedAt: "2026-11-16T12:10:00.000Z",
      intakeChannel: "envivo" as const,
      originId: "escritorio.chat-en-vivo",
      requesterUserId: "ana",
    };
    const other = {
      status: "abierto",
      updatedAt: "2026-11-16T12:40:00.000Z",
      intakeChannel: "envivo" as const,
      requesterUserId: "otro",
    };
    assert.equal(pickOwnLiveThread([portal, other, own], "ana"), own);
    assert.equal(pickOwnLiveThread([portal], "ana"), null);
  });

  it("pasar a ticket reutiliza el caso y repetirlo abre el mismo", () => {
    const opened = openAttentionCase({
      areas: DEFAULT_ATTENTION_AREAS,
      actor: client(),
      tenantId: "sem",
      areaId: "general",
      subject: "Seguimiento por chat",
      body: "Hola, necesito ayuda.",
      correlative: "AC-00020",
      intakeChannel: "envivo",
      id: "case-chat",
      messageId: "m1",
      eventId: "e1",
      now: NOW,
    });
    assert.equal(opened.ok, true);
    if (!opened.ok) return;
    const followed = appendCaseMessage(opened.case, {
      actor: staff({ allAreas: true, displayName: "Operador" }),
      body: "Te leemos.",
      id: "m2",
      now: "2026-11-16T12:05:00.000Z",
    });
    assert.equal(followed.ok, true);
    if (!followed.ok) return;
    const first = promoteChatToTicket(followed.case, {
      actor: staff({ allAreas: true, displayName: "Operador" }),
      id: "promo-1",
      now: "2026-11-16T12:06:00.000Z",
    });
    assert.equal(first.ok, true);
    if (!first.ok) return;
    assert.equal(first.case.id, "case-chat");
    assert.equal(first.case.correlative, "AC-00020");
    assert.equal(first.case.ticketCaseId, "case-chat");
    assert.equal(first.case.messages.length, 3);
    assert.equal(first.case.messages[0]?.role, "client");
    assert.equal(first.case.messages[1]?.role, "system");
    assert.equal(first.case.messages[2]?.role, "staff");
    assert.equal(first.case.events.at(-1)?.detail, "Pasó a ticket.");
    assert.equal(first.case.events.at(-1)?.actorUserId, "owner-1");
    const again = promoteChatToTicket(first.case, {
      actor: staff({ allAreas: true, displayName: "Operador" }),
      id: "promo-2",
      now: "2026-11-16T12:07:00.000Z",
    });
    assert.equal(again.ok, true);
    if (!again.ok) return;
    assert.equal(again.case.id, first.case.id);
    assert.equal(again.case.correlative, first.case.correlative);
    assert.equal(again.case.ticketCaseId, first.case.ticketCaseId);
    assert.equal(again.case.messages.length, first.case.messages.length);
    assert.equal(again.case.events.length, first.case.events.length);
  });

  it("la confirmación cierra o devuelve el mismo correlativo y deja fuera al compañero", () => {
    const opened = openAttentionCase({
      areas: DEFAULT_ATTENTION_AREAS,
      actor: client({ userId: "ana", displayName: "Ana Pérez" }),
      tenantId: "sem",
      areaId: "general",
      subject: "La llamada no quedó",
      body: "No puedo entrar.",
      correlative: "AC-00021",
      id: "case-phone",
      messageId: "m1",
      eventId: "e1",
      now: NOW,
    });
    assert.equal(opened.ok, true);
    if (!opened.ok) return;
    const phone: AttentionCase = {
      ...opened.case,
      intakeChannel: "telefono",
      sharedWithCompany: false,
      requesterUserId: "ana",
      requesterName: "Ana Pérez",
    };
    const requester = client({ userId: "ana", displayName: "Ana Pérez" });
    const admin = client({ userId: "admin", displayName: "Admin", orgWide: true });
    const colleague = client({ userId: "colega", displayName: "Colega" });
    assert.equal(canSeeAttentionCase(requester, phone), true);
    assert.equal(canSeeAttentionCase(admin, phone), true);
    assert.equal(canSeeAttentionCase(colleague, phone), false);
    assert.equal(canSeeAttentionCase(staff({ allAreas: true }), phone), true);

    const asked = requestClientConfirmation(phone, {
      actor: staff({ allAreas: true, displayName: "Operador" }),
      id: "ask-1",
      now: "2026-11-16T12:10:00.000Z",
    });
    assert.equal(asked.ok, true);
    if (!asked.ok) return;
    assert.equal(asked.case.status, "confirmacion");
    assert.equal(asked.case.correlative, "AC-00021");
    assert.equal(asked.case.events.at(-1)?.detail, "Quedó pendiente de confirmación.");
    assert.equal(asked.case.events.at(-1)?.actorUserId, "owner-1");
    assert.equal(asked.case.events.at(-1)?.at, "2026-11-16T12:10:00.000Z");

    const denied = resolveClientConfirmation(asked.case, {
      actor: colleague,
      decision: "resuelto",
      id: "nope",
      now: "2026-11-16T12:11:00.000Z",
    });
    assert.equal(denied.ok, false);

    const still = resolveClientConfirmation(asked.case, {
      actor: requester,
      decision: "sigue",
      reason: "Sigue sin entrar",
      id: "still-1",
      now: "2026-11-16T12:12:00.000Z",
    });
    assert.equal(still.ok, true);
    if (!still.ok) return;
    assert.equal(still.case.id, "case-phone");
    assert.equal(still.case.correlative, "AC-00021");
    assert.equal(still.case.status, "abierto");
    assert.match(still.case.events.at(-1)?.detail ?? "", /En atención/);
    assert.match(still.case.events.at(-1)?.detail ?? "", /Sigue sin entrar/);
    assert.equal(still.case.events.at(-1)?.actorUserId, "ana");

    const askedAgain = requestClientConfirmation(still.case, {
      actor: staff({ allAreas: true, displayName: "Operador" }),
      id: "ask-2",
      now: "2026-11-16T12:20:00.000Z",
    });
    assert.equal(askedAgain.ok, true);
    if (!askedAgain.ok) return;
    const empty = resolveClientConfirmation(askedAgain.case, {
      actor: requester,
      decision: "sigue",
      reason: "   ",
      id: "empty",
      now: "2026-11-16T12:21:00.000Z",
    });
    assert.equal(empty.ok, false);
    const done = resolveClientConfirmation(askedAgain.case, {
      actor: requester,
      decision: "resuelto",
      id: "done",
      now: "2026-11-16T12:22:00.000Z",
    });
    assert.equal(done.ok, true);
    if (!done.ok) return;
    assert.equal(done.case.status, "resuelto");
    assert.equal(done.case.correlative, "AC-00021");
    assert.equal(done.case.resolvedAt, "2026-11-16T12:22:00.000Z");
    assert.equal(done.case.events.at(-1)?.detail, "Quedó resuelto.");
    assert.equal(done.case.events.at(-1)?.actorUserId, "ana");
  });
});
