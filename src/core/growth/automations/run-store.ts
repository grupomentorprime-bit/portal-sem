/**
 * OT-GROWTH-AUTOMATION-007 — store de proyección de ejecuciones.
 */

import type { GrowthAutomationRun } from "./types";

export interface GrowthAutomationRunStore {
  upsertRun(doc: GrowthAutomationRun): Promise<GrowthAutomationRun>;
  findByAttemptKey(
    tenantId: string,
    automationId: string,
    attemptKey: string
  ): Promise<GrowthAutomationRun | null>;
  listRecent(
    tenantId: string,
    automationId: string,
    limit: number
  ): Promise<GrowthAutomationRun[]>;
}
