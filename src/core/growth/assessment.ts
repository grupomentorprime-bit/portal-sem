/**
 * Puerto neutro de evaluación comercial por Espacio.
 * El núcleo no conoce Mentor CUMPLE. Sin adaptador, la vista es null.
 */

import type { GrowthActivityRecorder } from "./activity";
import type { GrowthOpportunityStore } from "./opportunity-store";
import type { GrowthNextActionKind } from "./types";

export interface GrowthAssessmentItem {
  id: string;
  label: string;
  statusLabel: string;
  detail?: string;
}

export interface GrowthAssessmentView {
  title: string;
  headline: string;
  disclaimer: string;
  reportPath?: string;
  items: GrowthAssessmentItem[];
  previousCount: number;
  /** Empresa ya registrada en la evaluación. Ausente si el Espacio no la tiene. */
  organizationName?: string;
}

export interface GrowthRecordedAssessment {
  id: string;
  title: string;
  capturedAt: string;
  headline: string;
  disclaimer?: string;
  reportPath?: string;
  oportunidadId?: string;
  highlights: Array<GrowthAssessmentItem & { tone?: "clear" | "doubt" | "gap" | "missing" }>;
  priorities: Array<{ id: string; label: string }>;
  organizationName?: string;
  commercialAuthorized?: boolean;
}

export interface GrowthFormCapturePlan {
  summary: string;
  kind: GrowthNextActionKind;
  sourceKey: string;
}

export interface GrowthFormCaptureInput {
  tenantId: string;
  formId: string;
  submissionId: string;
  data: Record<string, unknown>;
  createdAt: string;
  campaign?: string;
  personaId?: string;
  oportunidadId?: string;
  actividades: GrowthActivityRecorder;
  oportunidades: GrowthOpportunityStore;
}

export interface GrowthSpaceAssessmentPort {
  viewForOpportunity(
    tenantId: string,
    oportunidadId: string
  ): Promise<GrowthAssessmentView | null>;
  listForPersona(
    tenantId: string,
    personaId: string,
    oportunidadIds: string[]
  ): Promise<GrowthRecordedAssessment[]>;
  planFormCapture(input: {
    formId: string;
    data: Record<string, unknown>;
  }): GrowthFormCapturePlan | null;
  persistFormCapture(input: GrowthFormCaptureInput): Promise<void>;
}

const ports = new Map<string, GrowthSpaceAssessmentPort>();

export function registerGrowthAssessmentPort(
  tenantId: string,
  port: GrowthSpaceAssessmentPort
): void {
  const id = tenantId.trim();
  if (!id) return;
  ports.set(id, port);
}

export function getGrowthAssessmentPort(
  tenantId: string
): GrowthSpaceAssessmentPort | null {
  return ports.get(tenantId.trim()) ?? null;
}

export function clearGrowthAssessmentPorts(): void {
  ports.clear();
}
