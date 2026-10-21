import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applicableMatters,
  buildDiagnostico,
  parseDiagnosticoPayload,
  prepareCumpleDiagnosticoSubmission,
  type CheckAnswer,
  type DiagnosticoInput,
  type MatterId,
} from "../../src/sites/cumple/diagnostico";
import { CUMPLE_FORM_ID } from "../../src/sites/cumple/site";

function answered(input: Omit<DiagnosticoInput, "answers">, overrides: DiagnosticoInput["answers"] = {}): DiagnosticoInput {
  const answers: DiagnosticoInput["answers"] = {};
  for (const matter of applicableMatters(input)) {
    const given: Partial<Record<string, CheckAnswer>> = {};
    for (const check of matter.checks) given[check.id] = "si";
    answers[matter.id] = { ...given, ...overrides[matter.id] };
  }
  return { ...input, answers };
}

const profile: Omit<DiagnosticoInput, "answers"> = {
  headcount: "50-99",
  contractors: "no",
  multiSite: "no",
  personalData: "no",
};

describe("diagnóstico preliminar de Cumple", () => {
  it("aplica Ley Karin, seguridad y salud, y laboral en toda empresa", () => {
    assert.deepEqual(
      applicableMatters(profile).map((matter) => matter.id),
      ["ley-karin", "sst", "laboral"]
    );
  });

  it("a una empresa chica no le pregunta el reglamento interno", () => {
    const laboral = applicableMatters({ ...profile, headcount: "lt10" }).find((matter) => matter.id === "laboral");
    assert.ok(laboral);
    assert.deepEqual(
      laboral.checks.map((check) => check.id),
      ["jornada", "registros"]
    );
  });

  it("suma contratistas, datos e inclusión solo cuando el perfil lo exige", () => {
    const ids = applicableMatters({
      ...profile,
      headcount: "100+",
      contractors: "si",
      personalData: "si",
    }).map((matter) => matter.id);

    assert.deepEqual(ids, ["ley-karin", "sst", "laboral", "datos", "inclusion", "contratistas"]);
  });

  it("nombra la brecha y prioriza lo que falta por sobre lo que no se sabe", () => {
    const wide: Omit<DiagnosticoInput, "answers"> = {
      headcount: "100+",
      contractors: "si",
      multiSite: "si",
      personalData: "si",
    };
    const overrides: Partial<Record<MatterId, Partial<Record<string, CheckAnswer>>>> = {
      sst: { matriz: "no_se" },
      laboral: { jornada: "no" },
      datos: { mapa: "no_se" },
      inclusion: { cuota: "no" },
    };
    const result = buildDiagnostico(answered(wide, overrides));

    assert.deepEqual(
      result.priorities.map((item) => item.label),
      ["Laboral y RR.HH.", "Inclusión laboral", "Seguridad y salud"]
    );
    assert.deepEqual(result.priorities[0]?.findings, ["la jornada no se puede demostrar"]);
    assert.match(result.priorities[0]?.exposure ?? "", /no puede demostrarlos/);
    assert.doesNotMatch(result.resumen, /\$|UF|multa de/i);
    assert.deepEqual(result.priorities[1]?.findings, ["no acredita la cuota del 1%"]);
    assert.equal(result.headline, "3 puntos para mirar primero");
    assert.match(result.resumen, /no hay mapa de los datos que trata|no consta qué datos trata/);
    assert.equal(result.matters.length, 6);
    assert.equal(result.priorities.length, 3);
    assert.equal(result.cumplimientoLegalVerificado, false);
    assert.equal(result.nature, "orientativo");
    assert.equal(result.basis, "declarado");
    assert.match(result.disclaimer, /no es una certificación/i);
    assert.match(result.disclaimer, /porcentaje de cumplimiento legal/i);
    assert.equal(result.matters.find((matter) => matter.id === "ley-karin")?.status, "al_dia");
    assert.equal(result.matters.find((matter) => matter.id === "ley-karin")?.recommendation, null);
    assert.match(result.recommendations.join(" "), /Inclusión laboral/);
    assert.equal(
      result.recommendations.some((line) => /Contratistas/i.test(line)),
      false
    );
  });

  it("deja una frase de llamada cuando no hay brechas declaradas", () => {
    const result = buildDiagnostico(answered(profile));

    assert.equal(result.priorities.length, 0);
    assert.equal(result.matters.length, 3);
    assert.equal(result.headline, "Sin brechas declaradas");
    assert.match(result.callLine, /no hay un contacto automático/i);
    assert.doesNotMatch(result.callLine, /lo contactamos a este whatsapp/i);
    assert.match(result.resumen, /ninguno en las materias aplicables/);
    assert.equal(result.recommendations.length, 0);
  });

  it("arma el resumen con perfil y la brecha concreta para quien llama", () => {
    const result = buildDiagnostico(
      answered(profile, {
        "ley-karin": { investigacion: "no" },
        sst: { matriz: "no_se" },
      })
    );

    assert.match(result.resumen, /Dotación 50 a 99/);
    assert.match(result.resumen, /Contratistas: no/);
    assert.match(result.resumen, /Más de un local: no/);
    assert.match(result.resumen, /Datos de clientes: no/);
    assert.match(result.resumen, /no hay procedimiento de investigación/);
    assert.match(result.resumen, /no consta si la matriz está al día/);
    assert.doesNotMatch(result.resumen, /Laboral/);
    assert.equal(
      result.recommendations.some((line) => /inclusión|contratistas|datos/i.test(line)),
      false
    );
  });

  it("no interpreta una respuesta ausente como cumplimiento", () => {
    const result = buildDiagnostico({
      ...profile,
      answers: {
        "ley-karin": { protocolo: "si", investigacion: "si" },
        sst: { matriz: "si", programa: "si", evidencia: "si" },
        laboral: { jornada: "si", reglamento: "si", registros: "si" },
      },
    });
    const karin = result.matters.find((matter) => matter.id === "ley-karin");
    assert.equal(karin?.status, "incompleto");
    assert.equal(karin?.status === "al_dia", false);
    assert.match(karin?.findings.join(" ") ?? "", /falta la respuesta/);
    assert.equal(result.priorities[0]?.id, "ley-karin");
  });

  it("rechaza materias y chequeos que el perfil no exige", () => {
    const missing = parseDiagnosticoPayload({
      ...profile,
      answers: {},
    });
    assert.equal(missing.ok, false);

    const extra = parseDiagnosticoPayload({
      ...answered(profile),
      answers: {
        ...answered(profile).answers,
        inclusion: { cuota: "si", conteo: "si", responsable: "si" },
      },
    });
    assert.equal(extra.ok, false);

    const reglamento = parseDiagnosticoPayload(
      answered({ ...profile, headcount: "lt10" }, { laboral: { reglamento: "no" } })
    );
    assert.equal(reglamento.ok, false);
  });

  it("descarta el resumen del navegador y deja el calculado en el servidor", () => {
    const input = answered(profile, { sst: { matriz: "no" } });
    const prepared = prepareCumpleDiagnosticoSubmission(CUMPLE_FORM_ID, {
      ...input,
      company: "Comercial Andes",
      diagnosticoResumen: "Cumplimiento legal 100%",
      headline: "Certificado",
    });
    assert.equal(prepared.applies, true);
    if (!prepared.applies || !prepared.ok) return;
    assert.match(String(prepared.data.diagnosticoResumen), /no hay matriz de riesgos vigente/);
    assert.doesNotMatch(String(prepared.data.diagnosticoResumen), /100%/);
    assert.equal("headline" in prepared.data, false);
    assert.equal(prepared.result.cumplimientoLegalVerificado, false);
  });

  it("no prepara otros formularios", () => {
    const prepared = prepareCumpleDiagnosticoSubmission("otro", {});
    assert.deepEqual(prepared, { applies: false });
  });
});
