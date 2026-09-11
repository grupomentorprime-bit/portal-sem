/**
 * Store en memoria de ejecuciones (tests).
 */

import type { GrowthAutomationRunStore } from "./run-store";
import type { GrowthAutomationRun } from "./types";

function runKey(tenantId: string, automationId: string, attemptKey: string) {
  return `${tenantId}::${automationId}::${attemptKey}`;
}

export function createMemoryGrowthAutomationRunStore(): GrowthAutomationRunStore & {
  runs: Map<string, GrowthAutomationRun>;
} {
  const runs = new Map<string, GrowthAutomationRun>();

  return {
    runs,
    async upsertRun(doc) {
      const key = runKey(doc.tenantId, doc.automationId, doc.attemptKey);
      runs.set(key, { ...doc, lines: [...doc.lines] });
      return runs.get(key)!;
    },
    async findByAttemptKey(tenantId, automationId, attemptKey) {
      const doc = runs.get(runKey(tenantId, automationId, attemptKey));
      return doc ? { ...doc, lines: [...doc.lines] } : null;
    },
    async listRecent(tenantId, automationId, limit) {
      return [...runs.values()]
        .filter(
          (r) => r.tenantId === tenantId && r.automationId === automationId
        )
        .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
        .slice(0, limit)
        .map((r) => ({ ...r, lines: [...r.lines] }));
    },
  };
}
