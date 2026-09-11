/**
 * OT-GROWTH-AUTOMATION-002/003/005/007 — Automatizaciones (persistencia + runtime + WAIT + historial).
 */

export {
  GROWTH_AUTOMATIONS_COLLECTION,
  GROWTH_AUTOMATION_VERSIONS_COLLECTION,
  GROWTH_AUTOMATION_RUNS_COLLECTION,
  GROWTH_AUTOMATION_SYSTEM_ACTOR,
  GROWTH_AUTOMATION_ACTION_TYPES,
} from "./types";
export type {
  GrowthAutomation,
  GrowthAutomationActionStep,
  GrowthAutomationActionType,
  GrowthAutomationConditionRule,
  GrowthAutomationConditionStep,
  GrowthAutomationRun,
  GrowthAutomationRunLine,
  GrowthAutomationRunStatus,
  GrowthAutomationStatus,
  GrowthAutomationStep,
  GrowthAutomationTriggerStep,
  GrowthAutomationVersion,
  GrowthAutomationVersionStatus,
  GrowthAutomationWaitStep,
} from "./types";

export {
  validateAutomationSteps,
  AUTOMATION_WAIT_MAX_DURATION_MS,
} from "./catalog";
export type {
  AutomationCatalogErrorCode,
  AutomationCatalogValidation,
} from "./catalog";

export type { GrowthAutomationStore } from "./store";
export { createMemoryGrowthAutomationStore } from "./memory-store";
export { createMongoGrowthAutomationStore } from "./repository";
export type { GrowthAutomationRunStore } from "./run-store";
export { createMemoryGrowthAutomationRunStore } from "./memory-run-store";
export { createMongoGrowthAutomationRunStore } from "./run-repository";
export {
  recordAutomationRunPhase,
  listAutomationRuns,
  createAutomationRunRecorder,
} from "./run-history";
export type {
  RecordAutomationRunPhaseInput,
  GrowthAutomationRunRecorder,
} from "./run-history";
export {
  AUTOMATION_HISTORY_COMPLETED_LINE,
  AUTOMATION_HISTORY_FAILED_LINE,
  formatAutomationRunWhen,
  automationActionPastLine,
  automationTriggerPastLabel,
  automationWaitDurationLabel,
  sanitizeAutomationErrorDetail,
} from "./history-prose";
export { ensureGrowthAutomationIndexes } from "./indexes";

export {
  createGrowthAutomation,
  updateGrowthAutomationDraft,
  publishGrowthAutomation,
  setGrowthAutomationActive,
  getGrowthAutomation,
  listGrowthAutomations,
  tryMutatePublishedAutomationVersion,
} from "./service";
export type { AutomationActor, AutomationServiceError } from "./service";

export {
  handleGrowthAutomationEvent,
  handleGrowthAutomationResume,
} from "./runtime";
export type {
  AutomationAttemptOutcome,
  GrowthAutomationEventInput,
  GrowthAutomationHandleResult,
  GrowthAutomationRuntimeDeps,
} from "./runtime";
export {
  resetAutomationReentrancyForTests,
  getAutomationChainStack,
  AUTOMATION_MAX_CHAIN_DEPTH,
  releaseAutomationAttempt,
} from "./reentrancy";
export { executeAutomationActionStep } from "./execute-action";
export type { GrowthAutomationSalesOpsPort } from "./sales-ops-port";
export {
  evaluateAutomationConditionRule,
  evaluateAutomationConditionRules,
} from "./conditions";
export {
  GROWTH_AUTOMATION_RESUME_EVENT,
  automationResumeKey,
  scheduleAutomationWait,
  createMemoryAutomationSchedulePort,
  isGrowthAutomationResumePayload,
} from "./wait";
export type {
  GrowthAutomationResumePayload,
  GrowthAutomationSchedulePort,
} from "./wait";
