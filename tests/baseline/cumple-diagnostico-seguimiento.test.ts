import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMemoryGrowthIngestStores } from "../../src/core/growth/ingest-memory";
import { GROWTH_STARTUP_NEXT_ACTION_SUMMARY } from "../../src/core/growth/automations/types";
import type { GrowthOportunidad } from "../../src/core/growth/types";
import { buildDiagnostico } from "../../src/sites/cumple/diagnostico";
import {
  createMemoryCumpleDiagnosticoStore,
  diagnosticoEnEspacio,
  recordCumpleDiagnostico,
  renderInformeTexto,
} from "../../src/sites/cumple/diagnostico-record";
import {
  canReplaceWithDiagnosticoAction,
  CUMPLE_DIAGNOSTICO_NEXT_ACTION_SOURCE,
  planCumpleNextAction,
  syncCumpleDiagnosticoNextAction,
} from "../../src/sites/cumple/diagnostico-seguimiento";
import { CUMPLE_FORM_ID } from "../../src/sites/cumple/site";

function opportunity(nextAction: GrowthOportunidad["nextAction"]): GrowthOportunidad {
  return {
    _id: "op-1",
    tenantId: "cumple",
    personaId: "per-1",
    typeKey: "inquiry",
    subjectType: "form",
    subjectId: CUMPLE_FORM_ID,
    origin: {
      kind: "form",
      sourceCollection: "experience_form_submissions",
      sourceId: "sub-1",
      capturedAt: "2026-10-16T12:00:00.000Z",
    },
    status: "open",
    workflowInstanceId: "wf-1",
    nextAction,
    source: { sourceCollection: "experience_form_submissions", sourceId: "sub-1" },
    openedAt: "2026-10-16T12:00:00.000Z",
    updatedAt: "2026-10-16T12:00:00.000Z",
  };
}

const data = {
  company: "Comercial Andes",
  headcount: "50-99",
  contractors: "no",
  multiSite: "no",
  personalData: "no",
  answers: {
    "ley-karin": { protocolo: "si", investigacion: "no", registro: "si" },
    sst: { matriz: "si", programa: "si", evidencia: "si" },
    laboral: { jornada: "si", reglamento: "si", registros: "si" },
  },
};

describe("seguimiento del diagnóstico", () => {
  it("reemplaza la acción genérica y conserva la personalizada", async () => {
    const { oportunidades } = createMemoryGrowthIngestStores();
    await oportunidades.insert(
      opportunity({
        summary: GROWTH_STARTUP_NEXT_ACTION_SUMMARY,
        kind: "contact",
        setAt: "2026-10-16T12:00:00.000Z",
      })
    );
    const diagnosticos = createMemoryCumpleDiagnosticoStore();
    const saved = await recordCumpleDiagnostico(diagnosticos, {
      tenantId: "cumple",
      submissionId: "sub-1",
      formId: CUMPLE_FORM_ID,
      data,
      capturedAt: "2026-10-16T12:00:00.000Z",
      personaId: "per-1",
      oportunidadId: "op-1",
      now: "2026-10-16T12:01:00.000Z",
      createReportToken: () => "token-1",
    });
    assert.equal(saved.ok, true);
    if (!saved.ok) return;

    const updated = await syncCumpleDiagnosticoNextAction(oportunidades, saved.record);
    assert.equal(updated, "updated");
    const after = await oportunidades.findById("cumple", "op-1");
    assert.equal(after?.nextAction?.sourceKey, CUMPLE_DIAGNOSTICO_NEXT_ACTION_SOURCE);
    assert.match(after?.nextAction?.summary ?? "", /Ley Karin/);
    assert.doesNotMatch(after?.nextAction?.summary ?? "", /certific|%/i);
    assert.equal(after?.nextAction?.kind, "contact");

    const again = await syncCumpleDiagnosticoNextAction(oportunidades, saved.record);
    assert.equal(again, "kept");

    await oportunidades.replace({
      ...after!,
      nextAction: {
        summary: "Llamar el martes a la gerencia",
        kind: "contact",
        setAt: "2026-10-16T15:00:00.000Z",
        sourceKey: "operator",
      },
    });
    const kept = await syncCumpleDiagnosticoNextAction(oportunidades, saved.record);
    assert.equal(kept, "kept");
    const personal = await oportunidades.findById("cumple", "op-1");
    assert.equal(personal?.nextAction?.summary, "Llamar el martes a la gerencia");
  });

  it("no trata como genérica una acción distinta del arranque", () => {
    assert.equal(canReplaceWithDiagnosticoAction(null), true);
    assert.equal(
      canReplaceWithDiagnosticoAction({
        summary: "Enviar propuesta de inclusion",
        kind: "contact",
        setAt: "2026-10-16T12:00:00.000Z",
      }),
      false
    );
    const clear = buildDiagnostico({
      headcount: "lt10",
      contractors: "no",
      multiSite: "no",
      personalData: "no",
      answers: {
        "ley-karin": { protocolo: "si", investigacion: "si", registro: "si" },
        sst: { matriz: "si", programa: "si", evidencia: "si" },
        laboral: { jornada: "si", registros: "si" },
      },
    });
    const plan = planCumpleNextAction(clear);
    assert.equal(plan.kind, "review");
    assert.doesNotMatch(plan.summary, /WhatsApp|certific/i);
    assert.equal(
      clear.recommendations.some((line) => /reglamento|inclusión|contratistas|datos/i.test(line)),
      false
    );
  });

  it("el consentimiento comercial solo se guarda si viene explícito", async () => {
    const store = createMemoryCumpleDiagnosticoStore();
    const base = {
      tenantId: "cumple",
      formId: CUMPLE_FORM_ID,
      capturedAt: "2026-10-16T12:00:00.000Z",
      personaId: "per-1",
      oportunidadId: "op-1",
    };
    const implied = await recordCumpleDiagnostico(store, {
      ...base,
      submissionId: "sub-a",
      data: { ...data, comunicacionesComerciales: "si" },
      createReportToken: () => "a",
    });
    const granted = await recordCumpleDiagnostico(store, {
      ...base,
      submissionId: "sub-b",
      data: { ...data, comunicacionesComerciales: true },
      createReportToken: () => "b",
    });
    assert.equal(implied.ok, true);
    assert.equal(granted.ok, true);
    if (!implied.ok || !granted.ok) return;
    assert.equal(implied.record.consentimiento.comunicacionesComerciales, false);
    assert.equal(granted.record.consentimiento.entregaDiagnostico, true);
    assert.equal(granted.record.consentimiento.tratamientoDatos, true);
    assert.equal(granted.record.consentimiento.comunicacionesComerciales, true);
  });

  it("el informe conserva todas las materias y no se lee desde otro Espacio", async () => {
    const store = createMemoryCumpleDiagnosticoStore();
    const saved = await recordCumpleDiagnostico(store, {
      tenantId: "cumple",
      submissionId: "sub-informe",
      formId: CUMPLE_FORM_ID,
      data,
      capturedAt: "2026-10-16T12:00:00.000Z",
      personaId: "per-1",
      oportunidadId: "op-1",
      createReportToken: () => "token-informe",
    });
    assert.equal(saved.ok, true);
    if (!saved.ok) return;
    const texto = renderInformeTexto(saved.record);
    assert.match(texto, /Diagnóstico orientativo/);
    assert.match(texto, /Ley Karin/);
    assert.match(texto, /Seguridad y salud/);
    assert.match(texto, /Laboral y RR.HH./);
    assert.match(texto, /Cumplimiento legal verificado: no/);
    assert.doesNotMatch(texto, /%/);
    assert.equal(diagnosticoEnEspacio(saved.record, "otro"), null);
    assert.equal(diagnosticoEnEspacio(saved.record, "cumple")?._id, saved.record._id);
    assert.equal(diagnosticoEnEspacio(null, "cumple"), null);
  });
});
