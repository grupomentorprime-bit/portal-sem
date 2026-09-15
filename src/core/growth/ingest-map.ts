/**
 * OT-GROWTH-CORE-005/006 — mapeo fuente → GrowthIngestInput.
 * Un solo camino; live ingest y backfill reutilizan estas formas.
 */

import type {
  GrowthAdmissionIngestInput,
  GrowthFormIngestInput,
} from "./ingest";

/** Campos mínimos de portal_interesados para proyectar. */
export interface GrowthInteresadoSourceRow {
  _id: string;
  tenant: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  programId: string;
  programLabel?: string;
  source?: string;
  createdAt?: string;
  handoff?: {
    delivered: boolean;
    externalId?: string;
    adapter?: string;
  };
}

/** Campos mínimos de experience_form_submissions para proyectar. */
export interface GrowthSubmissionSourceRow {
  _id: string;
  tenant: string;
  formId: string;
  destination: string;
  data: Record<string, unknown>;
  createdAt?: string;
  /** OT-GROWTH-CAMPAIGNS-003 — trackingKey resuelto server-side (no hidden/UTM). */
  campaign?: string;
}

export function toGrowthAdmissionInput(
  row: GrowthInteresadoSourceRow
): GrowthAdmissionIngestInput {
  return {
    kind: "admission",
    tenantId: row.tenant,
    interesadoId: row._id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    programId: row.programId,
    ...(row.programLabel ? { programLabel: row.programLabel } : {}),
    ...(row.source ? { channel: row.source } : {}),
    ...(row.createdAt ? { capturedAt: row.createdAt } : {}),
    ...(row.handoff
      ? {
          handoff: {
            delivered: row.handoff.delivered,
            ...(row.handoff.externalId
              ? { externalId: row.handoff.externalId }
              : {}),
            ...(row.handoff.adapter ? { adapter: row.handoff.adapter } : {}),
          },
        }
      : {}),
  };
}

export function toGrowthFormInput(
  row: GrowthSubmissionSourceRow
): GrowthFormIngestInput {
  return {
    kind: "form",
    tenantId: row.tenant,
    submissionId: row._id,
    formId: row.formId,
    destination: row.destination,
    data: row.data ?? {},
    ...(row.createdAt ? { capturedAt: row.createdAt } : {}),
    ...(row.campaign ? { campaign: row.campaign } : {}),
  };
}
