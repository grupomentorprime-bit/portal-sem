/**
 * Adaptador de Mentor CUMPLE hacia el puerto neutro de Growth.
 * Solo se registra en el Espacio CUMPLE.
 */

import type { Db } from "mongodb";
import {
  registerGrowthAssessmentPort,
  type GrowthAssessmentView,
  type GrowthFormCaptureInput,
  type GrowthFormCapturePlan,
  type GrowthRecordedAssessment,
  type GrowthSpaceAssessmentPort,
} from "@/core/growth/assessment";
import {
  MATTER_STATUS_LABEL,
  buildDiagnostico,
  parseDiagnosticoPayload,
} from "@/sites/cumple/diagnostico";
import {
  recordCumpleDiagnostico,
  type CumpleDiagnostico,
  type CumpleDiagnosticoStore,
} from "@/sites/cumple/diagnostico-record";
import { planCumpleNextAction, syncCumpleDiagnosticoNextAction } from "@/sites/cumple/diagnostico-seguimiento";
import { CUMPLE_FORM_ID, CUMPLE_TENANT_ID } from "@/sites/cumple/site";

const TONE = {
  al_dia: "clear",
  dudoso: "doubt",
  no_esta: "gap",
  incompleto: "missing",
} as const;

export function toPersonaAssessmentView(record: CumpleDiagnostico): GrowthRecordedAssessment {
  return {
    id: record._id,
    title: "Diagnóstico orientativo",
    capturedAt: record.createdAt,
    headline: record.result.headline,
    disclaimer: record.result.disclaimer,
    reportPath: `/informe/${record.reportToken}`,
    oportunidadId: record.oportunidadId,
    highlights: record.result.matters.map((matter) => ({
      id: matter.id,
      label: matter.label,
      statusLabel: MATTER_STATUS_LABEL[matter.status],
      detail: matter.findings.length > 0 ? matter.findings.join(". ") : undefined,
      tone: TONE[matter.status],
    })),
    priorities: record.result.priorities.map((item) => ({
      id: item.id,
      label: item.label,
    })),
    organizationName: record.empresaNombre,
    commercialAuthorized: record.consentimiento.comunicacionesComerciales,
  };
}

export function toCumpleGrowthAssessmentView(
  records: CumpleDiagnostico[]
): GrowthAssessmentView | null {
  const latest = records[0];
  if (!latest) return null;
  const company = latest.empresaNombre?.trim();
  return {
    title: company
      ? `Diagnóstico orientativo · ${company}`
      : "Diagnóstico orientativo",
    headline: latest.result.headline,
    disclaimer: latest.result.disclaimer,
    reportPath: `/informe/${latest.reportToken}`,
    items: latest.result.matters.map((matter) => ({
      id: matter.id,
      label: matter.label,
      statusLabel: MATTER_STATUS_LABEL[matter.status],
      detail: matter.findings.length > 0 ? matter.findings.join(". ") : undefined,
    })),
    previousCount: Math.max(0, records.length - 1),
    ...(company ? { organizationName: company } : {}),
  };
}

function planCapture(formId: string, data: Record<string, unknown>): GrowthFormCapturePlan | null {
  if (formId !== CUMPLE_FORM_ID) return null;
  const parsed = parseDiagnosticoPayload(data);
  if (!parsed.ok) return null;
  const plan = planCumpleNextAction(buildDiagnostico(parsed.input));
  return { summary: plan.summary, kind: plan.kind, sourceKey: plan.sourceKey };
}

async function mongoStore(): Promise<CumpleDiagnosticoStore> {
  const { getDatabase } = await import("@/lib/mongodb");
  const { createMongoCumpleDiagnosticoStore, ensureCumpleDiagnosticoIndexes } = await import(
    "@/lib/cumple/diagnostico-store"
  );
  const db = await getDatabase();
  await ensureCumpleDiagnosticoIndexes(db);
  return createMongoCumpleDiagnosticoStore(db);
}

async function listPersonaRecords(
  db: Db,
  tenantId: string,
  personaId: string,
  oportunidadIds: string[]
): Promise<CumpleDiagnostico[]> {
  const { CUMPLE_DIAGNOSTICOS_COLLECTION } = await import("@/sites/cumple/diagnostico-record");
  const filter =
    oportunidadIds.length > 0
      ? { tenantId, $or: [{ personaId }, { oportunidadId: { $in: oportunidadIds } }] }
      : { tenantId, personaId };
  return db
    .collection<CumpleDiagnostico>(CUMPLE_DIAGNOSTICOS_COLLECTION)
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();
}

export function createCumpleGrowthAssessmentPort(
  store?: CumpleDiagnosticoStore & { all?: () => CumpleDiagnostico[] }
): GrowthSpaceAssessmentPort {
  return {
    async viewForOpportunity(tenantId, oportunidadId) {
      const diagnosticos = store ?? (await mongoStore());
      const records = await diagnosticos.listByOportunidad(tenantId, oportunidadId);
      return toCumpleGrowthAssessmentView(records);
    },

    async listForPersona(tenantId, personaId, oportunidadIds) {
      if (store?.all) {
        const rows = store
          .all()
          .filter(
            (row) =>
              row.tenantId === tenantId &&
              (row.personaId === personaId ||
                (row.oportunidadId ? oportunidadIds.includes(row.oportunidadId) : false))
          )
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        return rows.map(toPersonaAssessmentView);
      }
      const { getDatabase } = await import("@/lib/mongodb");
      const { ensureCumpleDiagnosticoIndexes } = await import("@/lib/cumple/diagnostico-store");
      const db = await getDatabase();
      await ensureCumpleDiagnosticoIndexes(db);
      const rows = await listPersonaRecords(db, tenantId, personaId, oportunidadIds);
      return rows.map(toPersonaAssessmentView);
    },

    planFormCapture({ formId, data }) {
      return planCapture(formId, data);
    },

    async persistFormCapture(input: GrowthFormCaptureInput) {
      if (input.formId !== CUMPLE_FORM_ID) return;
      try {
        const diagnosticos = store ?? (await mongoStore());
        const saved = await recordCumpleDiagnostico(
          diagnosticos,
          {
            tenantId: input.tenantId,
            submissionId: input.submissionId,
            formId: input.formId,
            data: input.data,
            capturedAt: input.createdAt,
            ...(input.campaign ? { campaign: input.campaign } : {}),
            ...(input.personaId ? { personaId: input.personaId } : {}),
            ...(input.oportunidadId ? { oportunidadId: input.oportunidadId } : {}),
          },
          input.actividades
        );
        if (saved.ok) {
          await syncCumpleDiagnosticoNextAction(input.oportunidades, saved.record);
        }
      } catch (error) {
        console.error(
          "[Cumple] no se pudo guardar el diagnóstico (envío y Growth se conservan)",
          error instanceof Error ? error.message : error
        );
      }
    },
  };
}

let registered = false;

export function ensureCumpleGrowthAssessmentPort(): void {
  if (registered) return;
  registered = true;
  registerGrowthAssessmentPort(CUMPLE_TENANT_ID, createCumpleGrowthAssessmentPort());
}
