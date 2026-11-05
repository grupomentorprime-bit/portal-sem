import "server-only";

import type { GrowthActivityRecorder } from "@/core/growth/activity";
import type { GrowthIngestResult } from "@/core/growth/ingest";
import type { GrowthOpportunityStore } from "@/core/growth/opportunity-store";
import type { ExperienceFormSubmission } from "@/types/experience-forms";
import { recordCumpleDiagnostico } from "@/sites/cumple/diagnostico-record";
import { syncCumpleDiagnosticoNextAction } from "@/sites/cumple/diagnostico-seguimiento";
import { getDatabase } from "@/lib/mongodb";
import {
  createMongoCumpleDiagnosticoStore,
  ensureCumpleDiagnosticoIndexes,
} from "./diagnostico-store";

function linksFrom(
  projected: GrowthIngestResult | { ok: false; reason: string; error?: string }
): { personaId?: string; oportunidadId?: string } {
  if (
    projected.ok &&
    (projected.outcome === "projected" || projected.outcome === "idempotent_hit")
  ) {
    return {
      personaId: projected.persona._id,
      oportunidadId: projected.oportunidad._id,
    };
  }
  return {};
}

/** Persiste el diagnóstico ya calculado y, si Growth respondió, lo vincula. Fail-soft. */
export async function recordCumpleDiagnosticoLive(input: {
  submission: ExperienceFormSubmission;
  campaign?: string;
  actividades: GrowthActivityRecorder;
  oportunidades: GrowthOpportunityStore;
  projected: GrowthIngestResult | { ok: false; reason: string; error?: string };
}): Promise<void> {
  if (!input.submission._id) return;
  try {
    const db = await getDatabase();
    await ensureCumpleDiagnosticoIndexes(db);
    const links = linksFrom(input.projected);
    const saved = await recordCumpleDiagnostico(
      createMongoCumpleDiagnosticoStore(db),
      {
        tenantId: input.submission.tenant,
        submissionId: input.submission._id,
        formId: input.submission.formId,
        data: input.submission.data ?? {},
        capturedAt: input.submission.createdAt,
        ...(input.campaign ? { campaign: input.campaign } : {}),
        ...links,
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
}
