/**
 * OT-GROWTH-CORE-005 / E2E-FIX-001 — cableado de producción (fail-soft) tras persistir la fuente.
 * No reemplaza portal_interesados ni submissions; no altera el handoff académico.
 * Asegura el playbook de arranque antes de proyectar (Captura → nextAction).
 */

import "server-only";

import {
  ensureGrowthCoreIndexes,
  openGrowthOpportunityStore,
  openGrowthPersonaStore,
  projectGrowthFromSignalSafe,
  toGrowthAdmissionInput,
  toGrowthFormInput,
  type GrowthIngestDeps,
} from "@/core/growth";
import {
  createMongoGrowthAutomationStore,
  ensureGrowthAutomationIndexes,
  ensureGrowthStartupNextActionAutomation,
} from "@/core/growth/automations";
import type { PortalInteresado } from "@/types/admission";
import type { ExperienceFormSubmission } from "@/types/experience-forms";
import { getDatabase } from "@/lib/mongodb";
import { createGrowthEventBusAdapter } from "./event-bus";
import { createMongoGrowthOpportunityWorkflow } from "./opportunity-workflow";

async function ensureStartupNextActionAutomationSafe(
  db: Awaited<ReturnType<typeof getDatabase>>,
  tenantId: string
): Promise<void> {
  try {
    await ensureGrowthAutomationIndexes(db);
    await ensureGrowthStartupNextActionAutomation(
      createMongoGrowthAutomationStore(db),
      tenantId
    );
  } catch (error) {
    console.error(
      "[Growth Core] startup nextAction ensure failed (ingest continues)",
      tenantId,
      error instanceof Error ? error.message : error
    );
  }
}

async function openLiveIngestDeps(
  tenantId: string
): Promise<GrowthIngestDeps> {
  const db = await getDatabase();
  await ensureGrowthCoreIndexes(db);
  await ensureStartupNextActionAutomationSafe(db, tenantId);
  const [personas, oportunidades] = await Promise.all([
    openGrowthPersonaStore(db),
    openGrowthOpportunityStore(db),
  ]);
  return {
    personas,
    oportunidades,
    workflow: createMongoGrowthOpportunityWorkflow(),
    eventBus: createGrowthEventBusAdapter(),
  };
}

/** Después de insertar portal_interesados (+ handoff ya resuelto). */
export async function ingestInteresadoToGrowthSafe(
  interesado: PortalInteresado
): Promise<void> {
  if (!interesado._id) return;
  try {
    const deps = await openLiveIngestDeps(interesado.tenant);
    await projectGrowthFromSignalSafe(
      deps,
      toGrowthAdmissionInput({
        _id: interesado._id,
        tenant: interesado.tenant,
        firstName: interesado.firstName,
        lastName: interesado.lastName,
        email: interesado.email,
        phone: interesado.phone,
        programId: interesado.programId,
        programLabel: interesado.programLabel,
        source: interesado.source,
        createdAt: interesado.createdAt,
        handoff: interesado.handoff,
      })
    );
  } catch (error) {
    console.error(
      "[Growth Core] admission ingest failed (interesado preserved)",
      error instanceof Error ? error.message : error
    );
  }
}

/** Después de guardar experience_form_submissions (destinos V1). */
export async function ingestFormSubmissionToGrowthSafe(
  submission: ExperienceFormSubmission
): Promise<void> {
  if (!submission._id) return;
  try {
    const deps = await openLiveIngestDeps(submission.tenant);
    // OT-GROWTH-CAMPAIGNS-003 — bridge fail-safe: campaña active del Espacio por formId.
    const { resolveFormCampaignTrackingKeyForIngest } = await import(
      "./campaigns"
    );
    const campaign =
      (await resolveFormCampaignTrackingKeyForIngest(
        submission.tenant,
        submission.formId
      )) ?? undefined;
    await projectGrowthFromSignalSafe(
      deps,
      toGrowthFormInput({
        _id: submission._id,
        tenant: submission.tenant,
        formId: submission.formId,
        destination: submission.destination,
        data: submission.data ?? {},
        createdAt: submission.createdAt,
        ...(campaign ? { campaign } : {}),
      })
    );
  } catch (error) {
    console.error(
      "[Growth Core] form ingest failed (submission preserved)",
      error instanceof Error ? error.message : error
    );
  }
}
