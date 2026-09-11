/**
 * OT-GROWTH-AUTOMATION-007 — fachada server-only del historial de ejecuciones.
 */

import "server-only";

import {
  createMongoGrowthAutomationRunStore,
  createMongoGrowthAutomationStore,
  formatAutomationRunWhen,
  getGrowthAutomation,
  listAutomationRuns,
  type GrowthAutomationRun,
  type GrowthAutomationRunStatus,
} from "@/core/growth/automations";
import type { AutomationRunHistoryItemView } from "@/lib/growth/automations-history-types";
import { getDatabase } from "@/lib/mongodb";

export type { AutomationRunHistoryItemView };

const STATUS_LABELS: Record<GrowthAutomationRunStatus, string> = {
  in_progress: "En curso",
  waiting: "Esperando",
  completed: "Terminada",
  needs_attention: "Necesita atención",
};

function toView(
  run: GrowthAutomationRun,
  now: Date
): AutomationRunHistoryItemView {
  return {
    id: run._id,
    status: run.status,
    statusLabel: STATUS_LABELS[run.status],
    whenLabel: formatAutomationRunWhen(run.startedAt, now),
    lines: run.lines.map((l) => l.text),
    ...(run.status === "needs_attention" && run.errorDetail
      ? { errorDetail: run.errorDetail }
      : {}),
  };
}

export async function getAutomationHistoryView(
  tenantId: string,
  automationId: string,
  limit = 20
): Promise<
  | { ok: true; runs: AutomationRunHistoryItemView[] }
  | { ok: false; code: "not_found"; error: string }
> {
  const db = await getDatabase();
  const automationStore = createMongoGrowthAutomationStore(db);
  const detail = await getGrowthAutomation(automationStore, {
    tenantId,
    automationId,
  });
  if (!detail.ok) {
    return { ok: false, code: "not_found", error: detail.error };
  }

  const runs = await listAutomationRuns(
    createMongoGrowthAutomationRunStore(db),
    { tenantId, automationId, limit }
  );
  const now = new Date();
  return {
    ok: true,
    runs: runs.map((r) => toView(r, now)),
  };
}

export { STATUS_LABELS as AUTOMATION_RUN_STATUS_LABELS };
