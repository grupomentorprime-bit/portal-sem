import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterDeskCases } from "../../src/lib/desktop/help-origins";
import {
  applyManualIntake,
  clipReportMessage,
  filterIncidents,
  incidentCsv,
  incidentTotals,
  intakeChannelLabel,
  reportSince,
  resolveIntakeChannel,
  sendRequiresCompany,
} from "../../src/lib/desktop/platform-desk";
import { buildIncidentReportPdf, incidentReportLines } from "../../src/lib/desktop/platform-report-pdf";

describe("mesa Plataforma — ingreso manual e informe", () => {
  it("separa al solicitante del operador y no cuenta el ingreso como primera respuesta", () => {
    const opened = applyManualIntake(
      {
        id: "case-1",
        tenantId: "t",
        subject: "Falla al cargar",
        status: "pendiente",
        priority: "normal",
        assigneeUserId: null,
        requesterUserId: "op-1",
        requesterName: "Operador",
        messages: [
          {
            id: "m",
            at: "2026-11-18T12:00:00.000Z",
            authorUserId: "op-1",
            authorName: "Operador",
            role: "staff" as const,
            body: "No carga el documento.",
          },
        ],
        events: [
          {
            id: "e",
            at: "2026-11-18T12:00:00.000Z",
            actorUserId: "op-1",
            actorName: "Operador",
            kind: "creado",
            detail: "Abrió el caso.",
          },
        ],
      },
      {
        contactName: "Luis Pérez",
        channel: "telefono",
        operatorUserId: "op-1",
        operatorName: "Paula Soto",
      }
    );
    assert.equal(opened.ok, true);
    if (!opened.ok) return;
    assert.equal(opened.case.requesterName, "Luis Pérez");
    assert.equal(opened.case.requesterUserId, "");
    assert.equal(opened.case.registeredByName, "Paula Soto");
    assert.equal(opened.case.registeredByUserId, "op-1");
    assert.equal(opened.case.intakeChannel, "telefono");
    assert.equal(opened.case.messages[0]?.role, "system");
    assert.equal(opened.case.waitingOn, "nelzuri");
    assert.equal(opened.case.sharedWithCompany, false);
    assert.match(opened.case.events[0]?.detail ?? "", /Paula Soto/);
    assert.equal(
      filterDeskCases([opened.case], { noFirstReply: true }).length,
      1
    );
  });

  it("rechaza un contacto vacío y el canal Portal en el alta manual", () => {
    const base = { messages: [], events: [] };
    assert.equal(applyManualIntake(base, { contactName: " ", channel: "telefono", operatorUserId: "op", operatorName: "Op" }).ok, false);
    assert.equal(applyManualIntake(base, { contactName: "Ana", channel: "portal", operatorUserId: "op", operatorName: "Op" }).ok, false);
    assert.equal(applyManualIntake(base, { contactName: "Ana", channel: "envivo", operatorUserId: "op", operatorName: "Op" }).ok, false);
  });

  it("vincula el alta telefónica a una cuenta y no la comparte con la empresa", () => {
    const opened = applyManualIntake(
      { messages: [{ role: "staff" as const, authorUserId: "op", authorName: "Op" }], events: [] },
      {
        contactName: "Ana Pérez",
        channel: "telefono",
        operatorUserId: "op",
        operatorName: "Paula",
        requesterUserId: "user-ana",
      }
    );
    assert.equal(opened.ok, true);
    if (!opened.ok) return;
    assert.equal(opened.case.requesterUserId, "user-ana");
    assert.equal(opened.case.requesterName, "Ana Pérez");
    assert.equal(opened.case.sharedWithCompany, false);
    assert.equal(opened.case.intakeChannel, "telefono");
  });

  it("un caso sin canal explícito se lee como Portal y el chat como Chat en vivo", () => {
    assert.equal(resolveIntakeChannel({}), "portal");
    assert.equal(resolveIntakeChannel({ intakeChannel: "whatsapp" }), "whatsapp");
    assert.equal(resolveIntakeChannel({ intakeChannel: "envivo" }), "envivo");
    assert.equal(resolveIntakeChannel({ helpFrom: { originId: "escritorio.chat-en-vivo" } }), "envivo");
    assert.equal(intakeChannelLabel("envivo"), "Chat en vivo");
  });

  it("la búsqueda de bandeja incluye al solicitante", () => {
    const row = {
      id: "1",
      tenantId: "t",
      subject: "Agenda",
      status: "pendiente",
      priority: "normal",
      assigneeUserId: null,
      messages: [],
      code: "AC-00021",
      company: "Notaría Purén",
      requesterName: "Marcela Soto",
    };
    assert.equal(filterDeskCases([row], { query: "marcela" }).length, 1);
    assert.equal(filterDeskCases([row], { query: "notaría" }).length, 1);
    assert.equal(filterDeskCases([row], { query: "ac-00021" }).length, 1);
    assert.equal(filterDeskCases([row], { query: "nadie" }).length, 0);
  });

  it("el informe usa el período, la empresa y el canal, y pide empresa para enviar", () => {
    const now = Date.parse("2026-11-18T15:00:00.000Z");
    const since = reportSince("30", now);
    assert.ok(since);
    const rows = filterIncidents(
      [
        { createdAt: "2026-11-01T00:00:00.000Z", tenantId: "a", status: "resuelto", intakeChannel: "correo" },
        { createdAt: "2026-11-10T00:00:00.000Z", tenantId: "a", status: "pendiente", intakeChannel: "telefono" },
        { createdAt: "2026-08-01T00:00:00.000Z", tenantId: "a", status: "pendiente", intakeChannel: "telefono" },
        { createdAt: "2026-11-12T00:00:00.000Z", tenantId: "b", status: "abierto", intakeChannel: "telefono" },
      ],
      { since: since ?? 0, tenantId: "a", channel: "telefono" }
    );
    assert.equal(rows.length, 1);
    assert.deepEqual(incidentTotals(rows), { received: 1, open: 1, resolved: 0 });
    const waiting = filterIncidents(
      [
        {
          createdAt: "2026-11-10T00:00:00.000Z",
          tenantId: "a",
          status: "confirmacion",
          intakeChannel: "envivo",
          ticketCaseId: "chat-open",
        },
        {
          createdAt: "2026-11-11T00:00:00.000Z",
          tenantId: "a",
          status: "resuelto",
          intakeChannel: "envivo",
          ticketCaseId: "chat-done",
        },
      ],
      { since: since ?? 0, tenantId: "a", channel: "envivo" }
    );
    assert.equal(waiting.length, 2);
    assert.deepEqual(incidentTotals(waiting), { received: 2, open: 1, resolved: 1 });
    assert.equal(sendRequiresCompany(""), true);
    assert.equal(sendRequiresCompany("a"), false);
  });

  it("el informe de Chat en vivo cuenta solo el chat formalizado en la lista, el CSV y el PDF", () => {
    const now = Date.parse("2026-11-19T12:00:00.000Z");
    const since = reportSince("30", now) ?? 0;
    const rows = [
      {
        code: "AC-00019",
        subject: "Chat sin pasar a ticket",
        company: "Mentor Capacitación",
        requesterName: "Ana",
        createdAt: "2026-11-19T04:16:02.623Z",
        tenantId: "mentor",
        status: "pendiente",
        intakeChannel: "envivo" as const,
        originId: "escritorio.chat-en-vivo",
        ticketCaseId: "",
      },
      {
        code: "AC-00006",
        subject: "Chat antiguo sin canal explícito",
        company: "Seminario",
        requesterName: "Luis",
        createdAt: "2026-11-18T23:20:39.651Z",
        tenantId: "mentor",
        status: "pendiente",
        helpFrom: { originId: "escritorio.chat-en-vivo" },
        ticketCaseId: "",
      },
      {
        code: "AC-00018",
        subject: "Chat formalizado",
        company: "Mentor Capacitación",
        requesterName: "Ana",
        createdAt: "2026-11-19T04:15:43.046Z",
        tenantId: "mentor",
        status: "pendiente",
        intakeChannel: "envivo" as const,
        originId: "escritorio.chat-en-vivo",
        ticketCaseId: "case-18",
      },
      {
        code: "AC-00010",
        subject: "Ticket de Portal",
        company: "Mentor Capacitación",
        requesterName: "Luis",
        createdAt: "2026-11-12T00:00:00.000Z",
        tenantId: "mentor",
        status: "abierto",
        intakeChannel: "portal" as const,
        ticketCaseId: "",
      },
    ];
    const live = filterIncidents(rows, { since, tenantId: "mentor", channel: "envivo" });
    assert.deepEqual(
      live.map((row) => row.code),
      ["AC-00018"]
    );
    assert.deepEqual(incidentTotals(live), { received: 1, open: 1, resolved: 0 });
    const csv = incidentCsv(
      live.map((row) => ({
        code: row.code,
        subject: row.subject,
        company: row.company,
        requester: row.requesterName,
        channel: "Chat en vivo",
        status: "Pendiente",
      }))
    );
    assert.match(csv, /AC-00018/);
    assert.doesNotMatch(csv, /AC-00019/);
    assert.doesNotMatch(csv, /AC-00006/);
    const lines = incidentReportLines({
      company: "Mentor Capacitación",
      periodLabel: "Últimos 30 días",
      channelLabel: "Chat en vivo",
      totals: incidentTotals(live),
      rows: live.map((row) => ({
        code: row.code,
        subject: row.subject,
        requester: row.requesterName,
        channel: "Chat en vivo",
        status: "Pendiente",
      })),
      emittedAt: "19-11-2026",
    });
    const text = lines.join("\n");
    assert.match(text, /Recibidas: 1/);
    assert.match(text, /AC-00018/);
    assert.doesNotMatch(text, /AC-00019/);
    const all = filterIncidents(rows, { since, tenantId: "mentor", channel: "" });
    assert.deepEqual(
      all.map((row) => row.code),
      ["AC-00018", "AC-00010"]
    );
  });

  it("el mensaje del envío admite hasta 500 caracteres y el CSV trae las columnas del informe", () => {
    assert.equal(clipReportMessage("  hola  ").ok, true);
    assert.equal(clipReportMessage("x".repeat(501)).ok, false);
    const csv = incidentCsv([
      { code: "AC-1", subject: 'Falla "carga"', company: "Purén", requester: "Ana", channel: "Teléfono", status: "Pendiente" },
    ]);
    assert.match(csv, /Ticket","Asunto","Empresa","Solicitante","Canal","Estado/);
    assert.match(csv, /""carga""/);
  });

  it("el PDF nombra la empresa, el período y los totales", () => {
    const input = {
      company: "Notaría Purén",
      periodLabel: "Últimos 30 días",
      channelLabel: "Teléfono",
      totals: { received: 2, open: 1, resolved: 1 },
      rows: [{ code: "AC-00021", subject: "Falla al cargar", requester: "Luis Pérez", channel: "Teléfono", status: "Pendiente" }],
      emittedAt: "18-11-2026",
    };
    const lines = incidentReportLines(input);
    assert.match(lines.join("\n"), /Notaría Purén/);
    assert.match(lines.join("\n"), /Últimos 30 días/);
    assert.match(lines.join("\n"), /Recibidas: 2/);
    assert.match(lines.join("\n"), /AC-00021/);
    const pdf = buildIncidentReportPdf(input);
    assert.equal(Buffer.from(pdf.subarray(0, 5)).toString("latin1"), "%PDF-");
  });
});
