import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import type { GrowthActivityRecorder } from "../../src/core/growth/activity";
import type { GrowthActivity } from "../../src/core/growth/types";
import {
  createMemoryCumpleDiagnosticoStore,
  empresaClave,
  recordCumpleDiagnostico,
  toDiagnosticoComercialView,
} from "../../src/sites/cumple/diagnostico-record";
import { cumpleSite, CUMPLE_FORM_ID } from "../../src/sites/cumple/site";

const require = createRequire(import.meta.url);
require("../../scripts/_stub-server-only.cjs");

function payload(company = "Comercial Andes") {
  return {
    company,
    headcount: "50-99",
    contractors: "no",
    multiSite: "no",
    personalData: "no",
    diagnosticoResumen: "Certificado al 100%",
    answers: {
      "ley-karin": { protocolo: "si", investigacion: "no", registro: "si" },
      sst: { matriz: "si", programa: "si", evidencia: "si" },
      laboral: { jornada: "si", reglamento: "si", registros: "si" },
    },
  };
}

function notes(): { store: GrowthActivityRecorder; items: GrowthActivity[] } {
  const items: GrowthActivity[] = [];
  const store: GrowthActivityRecorder = {
    async recordActivity(activity) {
      const existing = items.find((item) => item.ingestKey && item.ingestKey === activity.ingestKey);
      if (existing) return existing;
      items.push(activity);
      return activity;
    },
    async setActivityEventId() {
      return null;
    },
    async findActivityByIngestKey(_tenantId, ingestKey) {
      return items.find((item) => item.ingestKey === ingestKey) ?? null;
    },
  };
  return { store, items };
}

describe("registro del diagnóstico CUMPLE", () => {
  it("guarda el resultado del servidor, el vínculo y no copia el cuestionario a la nota", async () => {
    const store = createMemoryCumpleDiagnosticoStore();
    const actividad = notes();
    const saved = await recordCumpleDiagnostico(
      store,
      {
        tenantId: "cumple",
        submissionId: "sub-1",
        formId: CUMPLE_FORM_ID,
        data: payload(),
        capturedAt: "2026-10-16T12:00:00.000Z",
        campaign: "camp-1",
        personaId: "per-1",
        oportunidadId: "op-1",
        now: "2026-10-16T12:00:01.000Z",
        createReportToken: () => "token-seguro",
      },
      actividad.store
    );

    assert.equal(saved.ok, true);
    if (!saved.ok) return;
    assert.equal(saved.outcome, "created");
    assert.equal(empresaClave("Comercial Ándes"), "comercial andes");
    assert.equal(saved.record.empresaClave, "comercial andes");
    assert.equal(saved.record.personaId, "per-1");
    assert.equal(saved.record.oportunidadId, "op-1");
    assert.equal(saved.record.campaign, "camp-1");
    assert.equal(saved.record.reportToken, "token-seguro");
    assert.equal(saved.record.consentimiento.comunicacionesComerciales, false);
    assert.equal(saved.record.consentimiento.entregaDiagnostico, true);
    assert.equal(saved.record.result.cumplimientoLegalVerificado, false);
    assert.match(saved.record.result.resumen, /no hay procedimiento de investigación/);
    assert.doesNotMatch(saved.record.result.resumen, /100%/);
    assert.equal(saved.record.result.matters.length, 3);
    assert.equal(saved.record.result.priorities.length, 1);
    assert.equal(actividad.items.length, 1);
    assert.equal(JSON.stringify(actividad.items[0]?.payload).includes("answers"), false);
    assert.equal(actividad.items[0]?.payload?.diagnosticoId, saved.record._id);
  });

  it("un reintento no duplica y una evaluación nueva conserva la anterior", async () => {
    const store = createMemoryCumpleDiagnosticoStore();
    const actividad = notes();
    const first = await recordCumpleDiagnostico(
      store,
      {
        tenantId: "cumple",
        submissionId: "sub-1",
        formId: CUMPLE_FORM_ID,
        data: payload(),
        capturedAt: "2026-10-16T12:00:00.000Z",
        personaId: "per-1",
        oportunidadId: "op-1",
        now: "2026-10-16T12:00:00.000Z",
        createReportToken: () => "token-1",
      },
      actividad.store
    );
    const retry = await recordCumpleDiagnostico(
      store,
      {
        tenantId: "cumple",
        submissionId: "sub-1",
        formId: CUMPLE_FORM_ID,
        data: payload("Otra empresa"),
        capturedAt: "2026-10-16T13:00:00.000Z",
        personaId: "per-9",
        oportunidadId: "op-9",
        now: "2026-10-16T13:00:00.000Z",
        createReportToken: () => "token-2",
      },
      actividad.store
    );
    const second = await recordCumpleDiagnostico(store, {
      tenantId: "cumple",
      submissionId: "sub-2",
      formId: CUMPLE_FORM_ID,
      data: payload(),
      capturedAt: "2026-10-16T14:00:00.000Z",
      personaId: "per-1",
      oportunidadId: "op-1",
      now: "2026-10-16T14:00:00.000Z",
      createReportToken: () => "token-3",
    });

    assert.equal(first.ok && retry.ok && second.ok, true);
    if (!first.ok || !retry.ok || !second.ok) return;
    assert.equal(retry.outcome, "idempotent");
    assert.equal(retry.record._id, first.record._id);
    assert.equal(retry.record.empresaNombre, "Comercial Andes");
    assert.equal(retry.record.personaId, "per-1");
    assert.equal(retry.record.reportToken, "token-1");
    assert.equal(actividad.items.length, 1);
    assert.notEqual(second.record._id, first.record._id);
    const history = await store.listByEmpresa("cumple", "comercial andes");
    assert.equal(history.length, 2);
    const otherSpace = await store.findById("otro", first.record._id);
    assert.equal(otherSpace, null);
    const byToken = await store.findByReportToken("token-1");
    assert.equal(byToken?.tenantId, "cumple");

    const view = toDiagnosticoComercialView(
      await store.listByOportunidad("cumple", "op-1")
    );
    assert.equal(view?.id, second.record._id);
    assert.equal(view?.anteriores, 1);
    assert.equal(view?.reportPath, "/informe/token-3");
    assert.equal(view?.matters.length, 3);
    assert.ok((view?.priorities.length ?? 0) <= 3);
  });

  it("completa el vínculo en un reintento sin reescribir el resultado", async () => {
    const store = createMemoryCumpleDiagnosticoStore();
    const actividad = notes();
    const created = await recordCumpleDiagnostico(store, {
      tenantId: "cumple",
      submissionId: "sub-1",
      formId: CUMPLE_FORM_ID,
      data: payload(),
      capturedAt: "2026-10-16T12:00:00.000Z",
      now: "2026-10-16T12:00:00.000Z",
      createReportToken: () => "token-1",
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    const headline = created.record.result.headline;
    const linked = await recordCumpleDiagnostico(
      store,
      {
        tenantId: "cumple",
        submissionId: "sub-1",
        formId: CUMPLE_FORM_ID,
        data: payload(),
        capturedAt: "2026-10-16T12:00:00.000Z",
        personaId: "per-1",
        oportunidadId: "op-1",
        now: "2026-10-16T12:05:00.000Z",
        createReportToken: () => "token-x",
      },
      actividad.store
    );
    assert.equal(linked.ok, true);
    if (!linked.ok) return;
    assert.equal(linked.record.personaId, "per-1");
    assert.equal(linked.record.result.headline, headline);
    assert.equal(linked.record.vinculadoEn, "2026-10-16T12:05:00.000Z");
    assert.equal(actividad.items.length, 1);
    const again = await recordCumpleDiagnostico(
      store,
      {
        tenantId: "cumple",
        submissionId: "sub-1",
        formId: CUMPLE_FORM_ID,
        data: payload(),
        capturedAt: "2026-10-16T12:00:00.000Z",
        personaId: "per-1",
        oportunidadId: "op-1",
        now: "2026-10-16T12:06:00.000Z",
      },
      actividad.store
    );
    assert.equal(again.ok && again.outcome === "idempotent", true);
    assert.equal(actividad.items.length, 1);
  });

  it("no guarda un diagnóstico inválido ni otro formulario", async () => {
    const store = createMemoryCumpleDiagnosticoStore();
    const invalid = await recordCumpleDiagnostico(store, {
      tenantId: "cumple",
      submissionId: "sub-1",
      formId: CUMPLE_FORM_ID,
      data: { company: "Andes", headcount: "50-99", contractors: "no", multiSite: "no", personalData: "no", answers: {} },
      capturedAt: "2026-10-16T12:00:00.000Z",
    });
    assert.equal(invalid.ok, false);
    const other = await recordCumpleDiagnostico(store, {
      tenantId: "cumple",
      submissionId: "sub-2",
      formId: "contacto",
      data: payload(),
      capturedAt: "2026-10-16T12:00:00.000Z",
    });
    assert.equal(other.ok, false);
    assert.equal(store.all().length, 0);
  });

  it("el envío rechaza respuestas ausentes antes de persistir", async () => {
    const { submitExperienceForm } = await import("../../src/core/experience/forms/engine");
    const form = { ...cumpleSite.forms[0], tenant: "cumple" };
    let saved = 0;
    const result = await submitExperienceForm({
      form,
      data: {
        fullName: "Ana",
        email: "ana@empresa.cl",
        phone: "+56912345678",
        company: "Andes",
        diagnosticoResumen: "Todo en regla",
      },
      store: {
        async save() {
          saved += 1;
          return { id: "x" };
        },
      },
    });
    assert.equal(result.ok, false);
    assert.equal(saved, 0);
    assert.match(result.errors?.answers ?? result.errors?.headcount ?? "", /respuesta|dotación|aplica/i);
  });
});
