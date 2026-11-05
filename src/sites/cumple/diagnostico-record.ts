import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { recordGrowthActivity, type GrowthActivityRecorder } from "@/core/growth/activity";
import type { GrowthActivity } from "@/core/growth/types";
import {
  buildDiagnostico,
  MATTER_STATUS_LABEL,
  parseDiagnosticoPayload,
  type DiagnosticoInput,
  type DiagnosticoResult,
} from "@/sites/cumple/diagnostico";
import { CUMPLE_FORM_ID } from "@/sites/cumple/site";

export const CUMPLE_DIAGNOSTICOS_COLLECTION = "cumple_diagnosticos" as const;

/** Marcador de la nota automática. No es una acción comercial personalizada. */
export const CUMPLE_DIAGNOSTICO_NOTE_KIND = "cumple.diagnostico.nota" as const;

export interface CumpleDiagnosticoConsent {
  entregaDiagnostico: true;
  tratamientoDatos: true;
  comunicacionesComerciales: boolean;
}

export interface CumpleDiagnostico {
  _id: string;
  tenantId: string;
  submissionId: string;
  formId: string;
  personaId?: string;
  oportunidadId?: string;
  empresaNombre: string;
  empresaClave: string;
  questionnaireVersion: string;
  capturedAt: string;
  campaign?: string;
  input: DiagnosticoInput;
  result: DiagnosticoResult;
  reportToken: string;
  consentimiento: CumpleDiagnosticoConsent;
  createdAt: string;
  vinculadoEn?: string;
}

export interface CumpleDiagnosticoStore {
  findBySubmission(tenantId: string, submissionId: string): Promise<CumpleDiagnostico | null>;
  findById(tenantId: string, id: string): Promise<CumpleDiagnostico | null>;
  findByReportToken(token: string): Promise<CumpleDiagnostico | null>;
  insert(doc: CumpleDiagnostico): Promise<{ doc: CumpleDiagnostico; existed: boolean }>;
  /**
   * Completa persona y oportunidad solo si todavía no estaban.
   * No cambia el resultado ni un vínculo ya escrito.
   */
  attachVinculo(
    tenantId: string,
    id: string,
    vinculo: { personaId: string; oportunidadId: string; at: string }
  ): Promise<CumpleDiagnostico | null>;
  listByOportunidad(tenantId: string, oportunidadId: string): Promise<CumpleDiagnostico[]>;
  listByEmpresa(tenantId: string, empresaClave: string): Promise<CumpleDiagnostico[]>;
}

export function empresaClave(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function createMemoryCumpleDiagnosticoStore(): CumpleDiagnosticoStore & {
  all(): CumpleDiagnostico[];
} {
  const docs: CumpleDiagnostico[] = [];
  return {
    all: () => docs.map((doc) => structuredClone(doc)),
    async findBySubmission(tenantId, submissionId) {
      return (
        docs.find((doc) => doc.tenantId === tenantId && doc.submissionId === submissionId) ??
        null
      );
    },
    async findById(tenantId, id) {
      return docs.find((doc) => doc.tenantId === tenantId && doc._id === id) ?? null;
    },
    async findByReportToken(token) {
      return docs.find((doc) => doc.reportToken === token) ?? null;
    },
    async insert(doc) {
      const existing = docs.find(
        (item) => item.tenantId === doc.tenantId && item.submissionId === doc.submissionId
      );
      if (existing) return { doc: existing, existed: true };
      docs.push(structuredClone(doc));
      return { doc, existed: false };
    },
    async attachVinculo(tenantId, id, vinculo) {
      const doc = docs.find((item) => item.tenantId === tenantId && item._id === id);
      if (!doc) return null;
      if (!doc.personaId && !doc.oportunidadId) {
        doc.personaId = vinculo.personaId;
        doc.oportunidadId = vinculo.oportunidadId;
        doc.vinculadoEn = vinculo.at;
      }
      return doc;
    },
    async listByOportunidad(tenantId, oportunidadId) {
      return docs
        .filter((doc) => doc.tenantId === tenantId && doc.oportunidadId === oportunidadId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },
    async listByEmpresa(tenantId, clave) {
      return docs
        .filter((doc) => doc.tenantId === tenantId && doc.empresaClave === clave)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },
  };
}

export interface RecordCumpleDiagnosticoInput {
  tenantId: string;
  submissionId: string;
  formId: string;
  data: Record<string, unknown>;
  capturedAt: string;
  campaign?: string;
  personaId?: string;
  oportunidadId?: string;
  now?: string;
  createReportToken?: () => string;
}

export type RecordCumpleDiagnosticoResult =
  | { ok: true; outcome: "created" | "idempotent"; record: CumpleDiagnostico }
  | { ok: false; reason: "not_diagnostico" }
  | { ok: false; reason: "invalid"; errors: Record<string, string> };

function notePayload(record: CumpleDiagnostico): Record<string, unknown> {
  return {
    diagnosticoId: record._id,
    empresaNombre: record.empresaNombre,
    questionnaireVersion: record.questionnaireVersion,
    materias: record.result.matters.map((matter) => ({
      id: matter.id,
      status: matter.status,
    })),
    prioridades: record.result.priorities.map((item) => item.id),
  };
}

async function noteDiagnostico(
  actividades: GrowthActivityRecorder,
  record: CumpleDiagnostico
): Promise<GrowthActivity | null> {
  if (!record.personaId || !record.oportunidadId) return null;
  const recorded = await recordGrowthActivity(actividades, {
    tenantId: record.tenantId,
    personaId: record.personaId,
    oportunidadId: record.oportunidadId,
    kind: "note",
    summary: `Diagnóstico orientativo de ${record.empresaNombre}: ${record.result.headline}`,
    sourceCollection: CUMPLE_DIAGNOSTICOS_COLLECTION,
    sourceId: record._id,
    buildIngestFromSource: true,
    payload: notePayload(record),
    occurredAt: record.vinculadoEn ?? record.createdAt,
  });
  return recorded.ok ? recorded.activity : null;
}

export async function recordCumpleDiagnostico(
  store: CumpleDiagnosticoStore,
  input: RecordCumpleDiagnosticoInput,
  actividades?: GrowthActivityRecorder
): Promise<RecordCumpleDiagnosticoResult> {
  if (input.formId !== CUMPLE_FORM_ID) return { ok: false, reason: "not_diagnostico" };

  const empresaNombre = String(input.data.company ?? "").trim();
  if (!empresaNombre) {
    return { ok: false, reason: "invalid", errors: { company: "Indique el nombre de la empresa." } };
  }

  const parsed = parseDiagnosticoPayload(input.data);
  if (!parsed.ok) return { ok: false, reason: "invalid", errors: parsed.errors };

  const result = buildDiagnostico(parsed.input);
  const now = input.now ?? new Date().toISOString();
  const personaId = input.personaId?.trim() || undefined;
  const oportunidadId = input.oportunidadId?.trim() || undefined;

  const existing = await store.findBySubmission(input.tenantId, input.submissionId);
  if (existing) {
    const hadVinculo = Boolean(existing.personaId);
    const linked =
      personaId && oportunidadId
        ? await store.attachVinculo(input.tenantId, existing._id, {
            personaId,
            oportunidadId,
            at: now,
          })
        : existing;
    const record = linked ?? existing;
    const justLinked = !hadVinculo && Boolean(record.personaId);
    if (justLinked && actividades) await noteDiagnostico(actividades, record);
    return { ok: true, outcome: "idempotent", record };
  }

  const record: CumpleDiagnostico = {
    _id: new ObjectId().toString(),
    tenantId: input.tenantId.trim(),
    submissionId: input.submissionId.trim(),
    formId: input.formId,
    ...(personaId ? { personaId } : {}),
    ...(oportunidadId ? { oportunidadId } : {}),
    empresaNombre,
    empresaClave: empresaClave(empresaNombre),
    questionnaireVersion: result.questionnaireVersion,
    capturedAt: input.capturedAt,
    ...(input.campaign?.trim() ? { campaign: input.campaign.trim() } : {}),
    input: parsed.input,
    result,
    reportToken: (input.createReportToken ?? (() => randomBytes(32).toString("base64url")))(),
    consentimiento: {
      entregaDiagnostico: true,
      tratamientoDatos: true,
      comunicacionesComerciales: input.data.comunicacionesComerciales === true,
    },
    createdAt: now,
    ...(personaId && oportunidadId ? { vinculadoEn: now } : {}),
  };

  const inserted = await store.insert(record);
  if (inserted.existed) {
    const hadVinculo = Boolean(inserted.doc.personaId);
    const linked =
      personaId && oportunidadId
        ? await store.attachVinculo(input.tenantId, inserted.doc._id, {
            personaId,
            oportunidadId,
            at: now,
          })
        : inserted.doc;
    const saved = linked ?? inserted.doc;
    if (!hadVinculo && saved.personaId && actividades) {
      await noteDiagnostico(actividades, saved);
    }
    return { ok: true, outcome: "idempotent", record: saved };
  }

  if (actividades) await noteDiagnostico(actividades, inserted.doc);
  return { ok: true, outcome: "created", record: inserted.doc };
}

export interface DiagnosticoComercialView {
  id: string;
  empresaNombre: string;
  headline: string;
  disclaimer: string;
  reportPath: string;
  capturedAt: string;
  anteriores: number;
  matters: Array<{
    id: string;
    label: string;
    statusLabel: string;
    findings: string[];
  }>;
  priorities: Array<{ id: string; label: string }>;
}

export function diagnosticoEnEspacio<T extends { tenantId: string }>(
  record: T | null,
  tenantId: string | null | undefined
): T | null {
  if (!record || !tenantId || record.tenantId !== tenantId) return null;
  return record;
}

export function renderInformeTexto(record: CumpleDiagnostico): string {
  const lines = [
    "Diagnóstico orientativo",
    record.empresaNombre,
    "",
    record.result.disclaimer,
    "Cumplimiento legal verificado: no.",
    "",
    record.result.headline,
    "",
    "Materias aplicables",
  ];
  for (const matter of record.result.matters) {
    lines.push(`${matter.label}: ${MATTER_STATUS_LABEL[matter.status]}`);
    for (const finding of matter.findings) lines.push(`- ${finding}`);
    if (matter.recommendation) lines.push(matter.recommendation);
  }
  lines.push("", "Prioridades para el visitante");
  if (record.result.priorities.length === 0) {
    lines.push("Ninguna brecha declarada.");
  } else {
    record.result.priorities.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.label}`);
    });
  }
  return lines.join("\n");
}

/** La ficha muestra el último diagnóstico y conserva cuántos anteriores hay. */
export function toDiagnosticoComercialView(
  records: CumpleDiagnostico[]
): DiagnosticoComercialView | null {
  const latest = records[0];
  if (!latest) return null;
  return {
    id: latest._id,
    empresaNombre: latest.empresaNombre,
    headline: latest.result.headline,
    disclaimer: latest.result.disclaimer,
    reportPath: `/informe/${latest.reportToken}`,
    capturedAt: latest.createdAt,
    anteriores: Math.max(0, records.length - 1),
    matters: latest.result.matters.map((matter) => ({
      id: matter.id,
      label: matter.label,
      statusLabel: MATTER_STATUS_LABEL[matter.status],
      findings: matter.findings,
    })),
    priorities: latest.result.priorities.map((item) => ({
      id: item.id,
      label: item.label,
    })),
  };
}
