import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appendCaseMessage,
  askCaseInformation,
  assignAttentionCase,
  canSeeAttentionCase,
  caseCode,
  caseIsUnread,
  DEFAULT_ATTENTION_AREAS,
  markCaseRead,
  reopenAttentionCase,
  setAttentionStatus,
  type AttentionActor,
  type AttentionColleague,
} from "../../src/lib/desktop/attention";
import {
  acceptScreenshot,
  beginVisitorTicket,
  filterDeskCases,
  followVisitorTicket,
  formatCorrelative,
  formatHelpOrigin,
  freezeHelpOrigin,
  helpLocationFromOrigin,
  linkVisitorCompany,
  openHelpTicket,
  presentHelpLocation,
  screenForPath,
  verifyVisitorContact,
  HELP_LOCATION_TTL_MS,
} from "../../src/lib/desktop/help-desk";

const OPENED = "2026-11-18T15:00:00.000Z";
const SENT = "2026-11-18T15:04:00.000Z";
const LATER = "2026-11-18T15:10:00.000Z";

function client(partial: Partial<AttentionActor> = {}): AttentionActor {
  return {
    userId: "user-1",
    displayName: "Ana Pérez",
    kind: "client",
    tenantId: "sem",
    allAreas: false,
    areaIds: [],
    orgWide: true,
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
    allAreas: true,
    areaIds: [],
    orgWide: false,
    economic: false,
    ...partial,
  };
}

function colleague(partial: Partial<AttentionColleague> = {}): AttentionColleague {
  return { userId: "agent-1", displayName: "Luis Soto", allAreas: true, areaIds: [], ...partial };
}

describe("Atención al Cliente", () => {
  it("congela el origen al pedir ayuda y deja la pantalla actual aparte", () => {
    const frozen = freezeHelpOrigin("growth-os.admision.editar-formulario", OPENED);
    assert.equal(frozen.ok, true);
    if (!frozen.ok) return;
    assert.equal(frozen.helpFrom.originId, "growth-os.admision.editar-formulario");
    assert.equal(frozen.helpFrom.screen, "Editar formulario");
    assert.equal(frozen.helpFrom.module, "Admisión");
    assert.equal(frozen.helpFrom.siteOrApp, "NELZURI");
    assert.equal(frozen.helpFrom.at, OPENED);

    const opened = openHelpTicket({
      areas: DEFAULT_ATTENTION_AREAS,
      actor: client(),
      tenantId: "sem",
      areaId: "tecnico",
      subject: "No me deja guardar",
      body: "No me deja guardar",
      originId: "growth-os.admision.editar-formulario",
      capturedAt: OPENED,
      correlative: formatCorrelative(1),
      id: "case-guardar",
      messageId: "m1",
      eventId: "e1",
      now: SENT,
    });
    assert.equal(opened.ok, true);
    if (!opened.ok) return;
    assert.equal(opened.case.helpFrom?.screen, "Editar formulario");
    assert.equal(opened.case.helpFrom?.at, OPENED);
    assert.equal(opened.case.correlative, "AC-00001");
    assert.equal(opened.case.waitingOn, "nelzuri");

    const moved = helpLocationFromOrigin({
      originId: "growth-os.admision.formularios",
      tenantId: "sem",
      userId: "user-1",
      seenAt: SENT,
      body: "No me deja guardar",
      fields: [{ label: "Nombre", value: "secreto" }],
    });
    assert.equal(moved.ok, true);
    if (!moved.ok) return;
    assert.equal(moved.location.screen, "Formularios");
    assert.equal("body" in moved.location, false);
    assert.equal("fields" in moved.location, false);
    assert.equal(opened.case.helpFrom?.screen, "Editar formulario");

    const live = presentHelpLocation(moved.location, Date.parse(SENT));
    assert.equal(live.state, "now");
    assert.equal(live.label, "Ahora en");
    assert.match(live.place, /Formularios/);
    const stale = presentHelpLocation(moved.location, Date.parse(SENT) + HELP_LOCATION_TTL_MS + 1000);
    assert.equal(stale.state, "last");
    assert.equal(stale.label, "Última vez en");
    assert.equal(stale.at, SENT);
    assert.equal(presentHelpLocation(null, Date.parse(SENT)).state, "unavailable");
  });

  it("rechaza un origen que no está registrado", () => {
    const frozen = freezeHelpOrigin("app.inventada.pantalla", OPENED);
    assert.equal(frozen.ok, false);
    const opened = openHelpTicket({
      areas: DEFAULT_ATTENTION_AREAS,
      actor: client(),
      tenantId: "sem",
      areaId: "tecnico",
      subject: "No me deja guardar",
      body: "No me deja guardar",
      originId: "app.inventada.pantalla",
      capturedAt: OPENED,
      correlative: "AC-00002",
      id: "case-x",
      messageId: "m1",
      eventId: "e1",
      now: SENT,
    });
    assert.equal(opened.ok, false);
    if (opened.ok) return;
    assert.equal(opened.reason, "origin");
  });

  it("conserva el código histórico y asigna correlativo solo al alta nueva", () => {
    assert.equal(formatCorrelative(12), "AC-00012");
    assert.equal(caseCode("legacy:sem"), "AT-LEGACYSE");
  });

  it("reconoce la pantalla de Editar formulario y otra pantalla del mismo producto", () => {
    assert.equal(screenForPath("/admin/portal/forms/form-1")?.id, "growth-os.admision.editar-formulario");
    assert.equal(screenForPath("/admin/portal/forms")?.screen, "Formularios");
    assert.equal(screenForPath("/admin/portal/forms/form-1/panel"), null);
  });

  it("el escritorio abre un segundo ticket y otra empresa no lo ve", () => {
    const second = openHelpTicket({
      areas: DEFAULT_ATTENTION_AREAS,
      actor: client(),
      tenantId: "sem",
      areaId: "general",
      subject: "Consulta del escritorio",
      body: "No veo el botón.",
      originId: "escritorio.atencion.nuevo-ticket",
      capturedAt: LATER,
      correlative: "AC-00002",
      whereNote: "En Admisión",
      id: "case-desk",
      messageId: "m1",
      eventId: "e1",
      now: LATER,
    });
    assert.equal(second.ok, true);
    if (!second.ok) return;
    assert.equal(second.case.whereNote, "En Admisión");
    assert.equal(second.case.helpFrom?.screen, "Nuevo ticket");
    assert.equal(canSeeAttentionCase(client({ tenantId: "adl", userId: "otro" }), second.case), false);
    assert.equal(canSeeAttentionCase(client({ tenantId: "sem", userId: "otro" }), second.case), true);
  });

  it("el chat crea con su acceso y al retomar conserva el origen inicial", () => {
    const created = openHelpTicket({
      areas: DEFAULT_ATTENTION_AREAS,
      actor: client(),
      tenantId: "sem",
      areaId: "general",
      subject: "hola",
      body: "hola",
      originId: "escritorio.chat-en-vivo",
      capturedAt: OPENED,
      correlative: "AC-00007",
      id: "case-chat",
      messageId: "m1",
      eventId: "e1",
      now: SENT,
    });
    assert.equal(created.ok, true);
    if (!created.ok || !created.case.helpFrom) return;
    assert.equal(created.case.helpFrom.originId, "escritorio.chat-en-vivo");
    assert.equal(formatHelpOrigin(created.case.helpFrom), "NELZURI · Chat en vivo → Chat en vivo");
    assert.equal(created.case.intakeChannel, "envivo");
    assert.equal(created.case.messages[0]?.role, "client");
    const continued = appendCaseMessage(created.case, {
      actor: client(),
      body: "sigo en el mismo caso",
      id: "m2",
      now: LATER,
    });
    assert.equal(continued.ok, true);
    if (!continued.ok) return;
    assert.equal(continued.case.correlative, "AC-00007");
    assert.equal(continued.case.helpFrom?.originId, "escritorio.chat-en-vivo");
    assert.equal(continued.case.helpFrom?.at, created.case.helpFrom.at);

    const prior = openHelpTicket({
      areas: DEFAULT_ATTENTION_AREAS,
      actor: client(),
      tenantId: "sem",
      areaId: "general",
      subject: "No me deja guardar",
      body: "No me deja guardar",
      originId: "growth-os.admision.editar-formulario",
      capturedAt: OPENED,
      correlative: "AC-00003",
      id: "case-previo",
      messageId: "m1",
      eventId: "e1",
      now: SENT,
    });
    assert.equal(prior.ok, true);
    if (!prior.ok || !prior.case.helpFrom) return;
    const followed = appendCaseMessage(prior.case, {
      actor: client(),
      body: "escribo desde el chat",
      id: "m-chat",
      now: LATER,
    });
    assert.equal(followed.ok, true);
    if (!followed.ok) return;
    assert.equal(followed.case.correlative, "AC-00003");
    assert.equal(followed.case.helpFrom?.originId, "growth-os.admision.editar-formulario");
    assert.equal(followed.case.helpFrom?.screen, "Editar formulario");
    assert.equal(followed.case.helpFrom?.at, OPENED);
  });

  it("la mesa asigna, responde, resuelve y reabre sin perder correlativo ni origen", () => {
    const opened = openHelpTicket({
      areas: DEFAULT_ATTENTION_AREAS,
      actor: client(),
      tenantId: "sem",
      areaId: "tecnico",
      subject: "No me deja guardar",
      body: "No me deja guardar",
      originId: "growth-os.admision.editar-formulario",
      capturedAt: OPENED,
      correlative: "AC-00001",
      id: "case-guardar",
      messageId: "m1",
      eventId: "e1",
      now: SENT,
    });
    assert.equal(opened.ok, true);
    if (!opened.ok) return;
    const owner = staff();
    const assigned = assignAttentionCase(opened.case, {
      actor: owner,
      assignee: colleague(),
      id: "e2",
      now: "2026-11-18T15:11:00.000Z",
    });
    assert.equal(assigned.ok, true);
    if (!assigned.ok) return;
    const asked = askCaseInformation(assigned.case, {
      actor: owner,
      body: "¿Qué mensaje aparece al guardar?",
      id: "m2",
      eventId: "e3",
      now: "2026-11-18T15:12:00.000Z",
    });
    assert.equal(asked.ok, true);
    if (!asked.ok) return;
    assert.equal(asked.case.waitingOn, "cliente");
    const clientReply = appendCaseMessage(asked.case, {
      actor: client(),
      body: "Dice error de red.",
      id: "m3",
      now: "2026-11-18T15:20:00.000Z",
    });
    assert.equal(clientReply.ok, true);
    if (!clientReply.ok) return;
    assert.equal(clientReply.case.waitingOn, "nelzuri");
    assert.equal(clientReply.case.id, "case-guardar");
    const resolved = setAttentionStatus(clientReply.case, {
      actor: owner,
      status: "resuelto",
      id: "e4",
      now: "2026-11-18T15:30:00.000Z",
    });
    assert.equal(resolved.ok, true);
    if (!resolved.ok) return;
    const reopened = reopenAttentionCase(resolved.case, {
      actor: owner,
      id: "e5",
      now: "2026-11-18T16:00:00.000Z",
    });
    assert.equal(reopened.ok, true);
    if (!reopened.ok) return;
    assert.equal(reopened.case.correlative, "AC-00001");
    assert.equal(reopened.case.helpFrom?.screen, "Editar formulario");
    assert.equal(reopened.case.helpFrom?.at, OPENED);
    assert.equal(reopened.case.status, "pendiente");
    assert.equal(reopened.case.waitingOn, "nelzuri");
    assert.equal(reopened.case.events.at(-1)?.actorName, "Nelzuri");
  });

  it("la lectura es por usuario y la bandeja separa sin asignar y sin primera respuesta", () => {
    const opened = openHelpTicket({
      areas: DEFAULT_ATTENTION_AREAS,
      actor: client(),
      tenantId: "sem",
      areaId: "tecnico",
      subject: "No me deja guardar",
      body: "No me deja guardar",
      originId: "growth-os.admision.editar-formulario",
      capturedAt: OPENED,
      correlative: "AC-00008",
      id: "case-8",
      messageId: "m1",
      eventId: "e1",
      now: SENT,
    });
    assert.equal(opened.ok, true);
    if (!opened.ok) return;
    const luis = staff({ userId: "agent-1", displayName: "Luis Soto" });
    const rita = staff({ userId: "agent-2", displayName: "Rita Núñez" });
    const read = markCaseRead(opened.case, luis, LATER);
    assert.equal(caseIsUnread(read, luis), false);
    assert.equal(caseIsUnread(read, rita), true);
    const rows = filterDeskCases([opened.case], {
      query: "ac-00008",
      tenantId: "sem",
      originId: "growth-os.admision.editar-formulario",
      status: "pendiente",
      priority: "normal",
      unassigned: true,
      noFirstReply: true,
    });
    assert.equal(rows.length, 1);
    assert.equal(filterDeskCases([opened.case], { assigneeUserId: "agent-1" }).length, 0);
  });

  it("el adjunto acepta imagen, PDF o Word y rechaza otro tipo o un archivo de más de 4 MB", () => {
    const ok = acceptScreenshot({ name: "error.png", mediaType: "image/png", dataUrl: "data:image/png;base64,aaaa" });
    assert.equal(ok.ok, true);
    const pdf = acceptScreenshot({ name: "orden.pdf", mediaType: "application/pdf", dataUrl: "data:application/pdf;base64,aaaa" });
    assert.equal(pdf.ok, true);
    const word = acceptScreenshot({
      name: "informe.docx",
      mediaType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      dataUrl: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,aaaa",
    });
    assert.equal(word.ok, true);
    const bad = acceptScreenshot({ name: "notas.txt", mediaType: "text/plain", dataUrl: "data:text/plain;base64,aaaa" });
    assert.equal(bad.ok, false);
    const heavy = acceptScreenshot({
      name: "grande.png",
      mediaType: "image/png",
      dataUrl: `data:image/png;base64,${"A".repeat(5_333_336)}`,
    });
    assert.equal(heavy.ok, false);
  });

  it("un visitante de la web sigue el ticket solo después de verificar el contacto", () => {
    const started = beginVisitorTicket({
      name: "Rosa Díaz",
      email: "rosa@example.com",
      body: "No encuentro el programa.",
      originId: "web.publica.pedir-ayuda",
      capturedAt: OPENED,
      correlative: "AC-00009",
      id: "case-web",
      messageId: "m1",
      eventId: "e1",
      now: OPENED,
      code: "482193",
    });
    assert.equal(started.ok, true);
    if (!started.ok) return;
    assert.equal(started.case.contactCodeHash === "482193", false);
    const blocked = followVisitorTicket(started.case, {
      body: "Sigo sin verlo.",
      id: "m2",
      now: SENT,
    });
    assert.equal(blocked.ok, false);
    const verified = verifyVisitorContact(started.case, {
      email: "rosa@example.com",
      code: "482193",
      now: SENT,
    });
    assert.equal(verified.ok, true);
    if (!verified.ok) return;
    const followed = followVisitorTicket(verified.case, {
      body: "Sigo sin verlo.",
      id: "m2",
      now: LATER,
    });
    assert.equal(followed.ok, true);
    if (!followed.ok) return;
    assert.equal(followed.case.correlative, "AC-00009");
    assert.equal(followed.case.helpFrom?.channel, "web");
    const linked = linkVisitorCompany(followed.case, {
      tenantId: "sem",
      relationshipVerified: false,
      actorUserId: "owner-1",
      eventId: "e2",
      now: LATER,
    });
    assert.equal(linked.ok, false);
    const allowed = linkVisitorCompany(followed.case, {
      tenantId: "sem",
      relationshipVerified: true,
      actorUserId: "owner-1",
      eventId: "e3",
      now: LATER,
    });
    assert.equal(allowed.ok, true);
    if (!allowed.ok) return;
    assert.equal(canSeeAttentionCase(client({ tenantId: "adl", userId: "otro" }), allowed.case), false);
    assert.equal(canSeeAttentionCase(client(), allowed.case), true);
  });

  it("la acción concreta queda en el origen cuando el acceso la declara", () => {
    const frozen = freezeHelpOrigin("growth-os.admision.editar-formulario.publicar", OPENED);
    assert.equal(frozen.ok, true);
    if (!frozen.ok) return;
    assert.equal(frozen.helpFrom.action, "Publicar formulario");
    assert.equal(frozen.helpFrom.screen, "Editar formulario");
    assert.equal(
      formatHelpOrigin(frozen.helpFrom),
      "Aplicación · NELZURI → Admisión → Editar formulario → Publicar formulario"
    );
    assert.equal(
      frozen.helpFrom.originId,
      "growth-os.admision.editar-formulario.publicar"
    );
  });

  it("el origen del escritorio se muestra como NELZURI y conserva su id", () => {
    const frozen = freezeHelpOrigin("escritorio.atencion.nuevo-ticket", OPENED);
    assert.equal(frozen.ok, true);
    if (!frozen.ok) return;
    assert.equal(frozen.helpFrom.originId, "escritorio.atencion.nuevo-ticket");
    assert.equal(frozen.helpFrom.siteOrApp, "NELZURI");
    assert.match(formatHelpOrigin(frozen.helpFrom), /NELZURI/);
    assert.doesNotMatch(formatHelpOrigin(frozen.helpFrom), /Growth OS|Escritorio Empresarial/);
  });

  it("confirma la solicitud y separa recepción, asignación y primera respuesta", () => {
    const opened = openHelpTicket({
      areas: DEFAULT_ATTENTION_AREAS,
      actor: client(),
      tenantId: "sem",
      areaId: "tecnico",
      subject: "No me deja guardar",
      body: "No me deja guardar",
      originId: "growth-os.admision.editar-formulario.guardar",
      capturedAt: OPENED,
      correlative: "AC-00011",
      id: "case-recibo",
      messageId: "m1",
      eventId: "e1",
      now: SENT,
    });
    assert.equal(opened.ok, true);
    if (!opened.ok) return;
    assert.equal(opened.case.events[0]?.kind, "recepcion");
    assert.equal(opened.case.helpFrom?.action, "Guardar");
    assert.equal(opened.case.helpFrom?.at, OPENED);
    const receipt = opened.case.messages.at(-1);
    assert.equal(receipt?.role, "system");
    assert.match(receipt?.body ?? "", /Solicitud recibida/);
    assert.match(receipt?.body ?? "", /AC-00011/);
    assert.equal(filterDeskCases([opened.case], { unassigned: true, noFirstReply: true }).length, 1);

    const assigned = assignAttentionCase(opened.case, {
      actor: staff(),
      assignee: colleague(),
      id: "e2",
      now: "2026-11-18T15:11:00.000Z",
    });
    assert.equal(assigned.ok, true);
    if (!assigned.ok) return;
    assert.equal(assigned.case.events.some((entry) => entry.kind === "asignado"), true);
    assert.equal(assigned.case.messages.some((message) => message.role === "staff"), false);
    assert.equal(filterDeskCases([assigned.case], { noFirstReply: true }).length, 1);
    assert.equal(assigned.case.helpFrom?.screen, "Editar formulario");

    const replied = appendCaseMessage(assigned.case, {
      actor: staff(),
      body: "Ya lo estoy mirando.",
      id: "m9",
      now: LATER,
    });
    assert.equal(replied.ok, true);
    if (!replied.ok) return;
    assert.equal(replied.case.events.some((entry) => entry.kind === "primera_respuesta"), true);
    assert.equal(filterDeskCases([replied.case], { noFirstReply: true }).length, 0);
  });
});
