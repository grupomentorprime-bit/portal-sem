/**
 * Tipos de vista del historial (seguros para client components).
 * Sin attemptKey, eventId, resumeKey ni payloads.
 */

import type { GrowthAutomationRunStatus } from "@/core/growth/automations/types";

export type AutomationRunHistoryItemView = {
  id: string;
  status: GrowthAutomationRunStatus;
  statusLabel: string;
  whenLabel: string;
  lines: string[];
  errorDetail?: string;
};
