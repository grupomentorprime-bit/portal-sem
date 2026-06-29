/** Workflow Engine v1 — genérico y desacoplado */

export { buildExecutionContext } from "./services/context";

export {
  SYSTEM_WORKFLOW_TEMPLATES,
  templateToDefinition,
} from "./definitions/defaults";

export { evaluateGuard, canTransitionGuard } from "./guards";
export { registerAction, runActions } from "./actions/registry";
export { subscribe, publish } from "./events/bus";
export { writeWorkflowAudit } from "./audit";

export {
  startWorkflow,
  transition,
  canTransition,
  getCurrentState,
  getHistory,
  cancelWorkflow,
  restartWorkflow,
  getAvailableTransitions,
} from "./engine/engine";
