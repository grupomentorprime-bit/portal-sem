import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMemoryCumpleDiagnosticoStore, recordCumpleDiagnostico } from "../../src/sites/cumple/diagnostico-record";
import { CUMPLE_FORM_ID } from "../../src/sites/cumple/site";
import { toPersonaAssessmentView } from "../../src/sites/cumple/growth-assessment";
import {
  buildPersonaWorkspace,
  groupActivitiesByDate,
  nextActionExecution,
  humanizeActivitySummary,
  opportunityTypeDisplayLabel,
  partitionPersonaNotes,
  preferredOperableOpportunityId,
  resolvePersonaSection,
  visiblePersonaSections,
  visibleTimelineActivities,
} from "../../src/lib/growth/persona-workspace";
import type { GrowthActivityView } from "../../src/lib/growth/persona-view";

function payload() {
  return {
    company: "Comercial Andes",
    headcount: "50-99",
    contractors: "no",
    multiSite: "no",
    personalData: "no",
    comunicacionesComerciales: true,
    answers: {
      "ley-karin": { protocolo: "si", investigacion: "no", registro: "si" },
      sst: { matriz: "si", programa: "si", evidencia: "si" },
      laboral: { jornada: "si", reglamento: "si", registros: "si" },
    },
  };
}

describe("ficha comercial de Persona", () => {
  it("sin evaluaciones solo cuenta oportunidades abiertas", () => {
    const workspace = buildPersonaWorkspace(
      [
        { status: "open", originLabel: "Formulario", openedAt: "2026-10-02T00:00:00.000Z" },
        { status: "won", originLabel: "WhatsApp", openedAt: "2026-10-03T00:00:00.000Z" },
      ],
      []
    );
    assert.deepEqual(
      workspace.signals.map((signal) => signal.id),
      ["opportunities"]
    );
    assert.equal(workspace.signals[0]?.value, "1");
    assert.equal(workspace.signals[0]?.hint, "Formulario");
    assert.equal(visiblePersonaSections(false).some((item) => item.id === "diagnosticos"), false);
    assert.equal(resolvePersonaSection("diagnosticos", false), "resumen");
  });

  it("con diagnóstico usa resultado, brecha y consentimiento reales", async () => {
    const stored = await recordCumpleDiagnostico(createMemoryCumpleDiagnosticoStore(), {
      tenantId: "espacio",
      submissionId: "sub-1",
      formId: CUMPLE_FORM_ID,
      data: payload(),
      capturedAt: "2026-10-16T12:00:00.000Z",
      personaId: "p1",
      oportunidadId: "o1",
      now: "2026-10-16T12:00:00.000Z",
    });
    assert.equal(stored.ok, true);
    if (!stored.ok) return;
    const assessment = toPersonaAssessmentView(stored.record);
    const workspace = buildPersonaWorkspace(
      [{ status: "active", originLabel: "Formulario", openedAt: "2026-10-16T12:00:00.000Z" }],
      [assessment]
    );
    const byId = Object.fromEntries(workspace.signals.map((signal) => [signal.id, signal]));
    assert.equal(byId.assessments?.value, "1");
    assert.equal(byId.gap?.value, "Ley Karin");
    assert.match(byId.gap?.hint ?? "", /investigación/);
    assert.equal(byId.consent?.value, "Autorizado");
    assert.equal(assessment.organizationName, "Comercial Andes");
    assert.equal(
      assessment.highlights.find((item) => item.id === "ley-karin")?.tone,
      "gap"
    );
    assert.equal(assessment.headline, stored.record.result.headline);
    assert.match(assessment.reportPath ?? "", /^\/informe\//);
    assert.equal(visiblePersonaSections(true).some((item) => item.id === "diagnosticos"), true);
  });

  it("la actividad no repite el mismo hecho ni el diagnóstico ya mostrado", () => {
    const activities: GrowthActivityView[] = [
      {
        id: "a1",
        summary: "Diagnóstico orientativo de Comercial Andes: 1 punto para mirar primero",
        kind: "note",
        kindLabel: "Nota",
        occurredAt: "2026-10-16T12:00:00.000Z",
        sourceCollection: "cumple_diagnosticos",
        sourceId: "d1",
      },
      {
        id: "a2",
        summary: "Diagnóstico orientativo de Comercial Andes: 1 punto para mirar primero",
        kind: "note",
        kindLabel: "Nota",
        occurredAt: "2026-10-16T12:00:01.000Z",
        sourceCollection: "cumple_diagnosticos",
        sourceId: "d1",
      },
      {
        id: "a3",
        summary: "Formulario enviado",
        kind: "form_submitted",
        kindLabel: "Formulario enviado",
        occurredAt: "2026-10-16T11:00:00.000Z",
      },
    ];
    const visible = visibleTimelineActivities(activities, { omitSourceIds: ["d1"] });
    assert.deepEqual(visible.map((item) => item.id), ["a3"]);
    const full = visibleTimelineActivities(activities);
    assert.deepEqual(full.map((item) => item.id), ["a1", "a3"]);
  });

  it("las etiquetas del Espacio reemplazan la clave técnica de la oportunidad", () => {
    assert.equal(
      opportunityTypeDisplayLabel("inquiry", {
        inquiry: "Consulta de cumplimiento",
      }),
      "Consulta de cumplimiento"
    );
    assert.equal(opportunityTypeDisplayLabel("inquiry"), "Consulta");
    assert.equal(opportunityTypeDisplayLabel("visita_tecnica"), "Visita Tecnica");
    assert.doesNotMatch(opportunityTypeDisplayLabel("inquiry"), /inquiry/);
    assert.equal(
      humanizeActivitySummary("Oportunidad abierta (inquiry)", {
        inquiry: "Consulta de cumplimiento",
      }),
      "Oportunidad abierta (Consulta de cumplimiento)"
    );
  });

  it("separa notas escritas por una persona de eventos automáticos", () => {
    const activities: GrowthActivityView[] = [
      {
        id: "n1",
        summary: "Llamó y pidió propuesta",
        kind: "note",
        kindLabel: "Nota",
        occurredAt: "2026-10-16T15:00:00.000Z",
      },
      {
        id: "n2",
        summary: "Diagnóstico orientativo registrado",
        kind: "note",
        kindLabel: "Nota",
        occurredAt: "2026-10-16T12:00:00.000Z",
        sourceCollection: "cumple_diagnosticos",
        sourceId: "d1",
      },
      {
        id: "c1",
        summary: "Contacto por WhatsApp",
        kind: "contact",
        kindLabel: "Contacto",
        occurredAt: "2026-10-16T14:00:00.000Z",
      },
    ];
    const notes = partitionPersonaNotes(activities);
    assert.deepEqual(notes.human.map((item) => item.id), ["n1"]);
    assert.deepEqual(notes.automatic.map((item) => item.id), ["n2"]);
  });

  it("agrupa la actividad por día y elige la oportunidad operable", () => {
    const activities: GrowthActivityView[] = [
      {
        id: "a1",
        summary: "Nota",
        kind: "note",
        kindLabel: "Nota",
        occurredAt: "2026-10-16T18:00:00.000Z",
      },
      {
        id: "a2",
        summary: "Formulario",
        kind: "form_submitted",
        kindLabel: "Formulario enviado",
        occurredAt: "2026-10-16T11:00:00.000Z",
      },
      {
        id: "a3",
        summary: "Ayer",
        kind: "contact",
        kindLabel: "Contacto",
        occurredAt: "2026-10-15T11:00:00.000Z",
      },
    ];
    const groups = groupActivitiesByDate(activities, (iso) => iso.slice(0, 10));
    assert.deepEqual(
      groups.map((group) => [group.key, group.items.map((item) => item.id)]),
      [
        ["2026-10-16", ["a1", "a2"]],
        ["2026-10-15", ["a3"]],
      ]
    );
    assert.equal(
      preferredOperableOpportunityId(
        [
          { id: "closed", status: "won" },
          { id: "open", status: "active" },
        ],
        "closed"
      ),
      "open"
    );
    assert.equal(
      nextActionExecution({
        kind: "review",
        reportPath: "/informe/abc",
      })?.type,
      "report"
    );
    assert.equal(
      nextActionExecution({
        kind: "contact",
        conversationId: "c1",
      })?.href,
      "/admin/mensajes?c=c1"
    );
    assert.equal(nextActionExecution({ kind: "wait" }), null);
  });
});
