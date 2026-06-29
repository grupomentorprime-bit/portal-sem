/** Workflow Engine — dominio genérico desacoplado */

import type { IdentityMembership, IdentitySession, IdentityUser } from "@/types/identity";

export const WORKFLOW_DEFINITION_STATUSES = ["active", "draft", "archived"] as const;
export type WorkflowDefinitionStatus = (typeof WORKFLOW_DEFINITION_STATUSES)[number];

export const WORKFLOW_STATE_TYPES = [
  "initial",
  "normal",
  "approval",
  "published",
  "archived",
  "cancelled",
] as const;
export type WorkflowStateType = (typeof WORKFLOW_STATE_TYPES)[number];

export const WORKFLOW_INSTANCE_STATUSES = ["active", "completed", "cancelled"] as const;
export type WorkflowInstanceStatus = (typeof WORKFLOW_INSTANCE_STATUSES)[number];

export interface WorkflowState {
  id: string;
  key: string;
  label: string;
  type: WorkflowStateType;
  color?: string;
  isInitial?: boolean;
  isFinal?: boolean;
  metadata?: Record<string, unknown>;
}

export interface WorkflowTransition {
  id: string;
  fromState: string;
  toState: string;
  label: string;
  permission?: string;
  guard?: string;
  actions?: string[];
  events?: string[];
}

export interface WorkflowDefinition {
  _id: string;
  tenantId?: string;
  key: string;
  name: string;
  description: string;
  entityType: string;
  version: number;
  initialState: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  status: WorkflowDefinitionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowInstance {
  _id: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  definitionId: string;
  definitionKey: string;
  currentState: string;
  status: WorkflowInstanceStatus;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface WorkflowHistoryEntry {
  _id: string;
  workflowInstanceId: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  definitionId: string;
  fromState: string;
  toState: string;
  performedBy: string;
  performedAt: string;
  comment?: string;
  metadata?: Record<string, unknown>;
}

export interface ExecutionContext {
  requestId: string;
  tenant: string;
  user: IdentityUser;
  membership: IdentityMembership | null;
  permissions: string[];
  session: IdentitySession;
  locale: string;
  timezone: string;
  traceId: string;
  compatMode: boolean;
}

export type WorkflowDomainEventType =
  | "WorkflowStarted"
  | "WorkflowTransitioned"
  | "WorkflowCompleted"
  | "WorkflowCancelled";

export interface WorkflowDomainEvent {
  type: WorkflowDomainEventType;
  tenantId: string;
  entityType: string;
  entityId: string;
  workflowInstanceId: string;
  definitionId: string;
  fromState?: string;
  toState?: string;
  performedBy: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface StartWorkflowInput {
  definitionKey: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export interface TransitionWorkflowInput {
  instanceId: string;
  transitionId?: string;
  toState?: string;
  comment?: string;
  metadata?: Record<string, unknown>;
}
