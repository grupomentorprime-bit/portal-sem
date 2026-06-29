/** Interfaces base para flujos de trabajo multi-tenant (admisión, matrícula, etc.) */

export type WorkflowStatus = "draft" | "active" | "archived";

export interface WorkflowDefinition {
  id: string;
  tenantId: string;
  name: string;
  status: WorkflowStatus;
}

export interface WorkflowService {
  list(tenantId: string): Promise<WorkflowDefinition[]>;
}
