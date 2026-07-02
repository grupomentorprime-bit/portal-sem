import type { WorkflowDefinition } from "@/types/workflow";
import type { WorkflowStateType } from "@/types/workflow";
import { workflowStateColors } from "@/core/workflow/workflow-colors";

export interface DefinitionTemplate {
  key: string;
  name: string;
  description: string;
  entityType: string;
  states: Array<{
    key: string;
    label: string;
    type: WorkflowStateType;
    color?: string;
    isInitial?: boolean;
    isFinal?: boolean;
  }>;
  transitions: Array<{
    id: string;
    fromState: string;
    toState: string;
    label: string;
    permission?: string;
    guard?: string;
    actions?: string[];
    events?: string[];
  }>;
}

export const SYSTEM_WORKFLOW_TEMPLATES: DefinitionTemplate[] = [
  {
    key: "cms.page",
    name: "CMS — Página",
    description: "Flujo editorial de páginas",
    entityType: "cms.page",
    states: [
      { key: "draft", label: "Borrador", type: "initial", color: workflowStateColors.draft, isInitial: true },
      { key: "review", label: "En revisión", type: "approval", color: workflowStateColors.review },
      { key: "approved", label: "Aprobado", type: "normal", color: workflowStateColors.approved },
      { key: "published", label: "Publicado", type: "published", color: workflowStateColors.published, isFinal: true },
      { key: "archived", label: "Archivado", type: "archived", color: workflowStateColors.archived, isFinal: true },
    ],
    transitions: [
      { id: "submit-review", fromState: "draft", toState: "review", label: "Enviar a revisión", permission: "cms.pages.update" },
      { id: "approve", fromState: "review", toState: "approved", label: "Aprobar", permission: "cms.pages.publish", guard: "requireRole:Reviewer" },
      { id: "publish", fromState: "approved", toState: "published", label: "Publicar", permission: "cms.pages.publish", actions: ["audit"], events: ["WorkflowTransitioned"] },
      { id: "publish-direct", fromState: "draft", toState: "published", label: "Publicar directo", permission: "cms.pages.publish", actions: ["audit"] },
      { id: "archive", fromState: "published", toState: "archived", label: "Archivar", permission: "cms.pages.delete", actions: ["audit"] },
      { id: "revert-draft", fromState: "review", toState: "draft", label: "Devolver a borrador", permission: "cms.pages.update" },
    ],
  },
  {
    key: "academy.program",
    name: "Programa académico",
    description: "Flujo de publicación de programas",
    entityType: "academy.program",
    states: [
      { key: "draft", label: "Borrador", type: "initial", color: workflowStateColors.draft, isInitial: true },
      { key: "published", label: "Publicado", type: "published", color: workflowStateColors.published, isFinal: true },
      { key: "archived", label: "Archivado", type: "archived", color: workflowStateColors.archived, isFinal: true },
    ],
    transitions: [
      { id: "publish", fromState: "draft", toState: "published", label: "Publicar", permission: "programs.manage", actions: ["audit"] },
      { id: "archive", fromState: "published", toState: "archived", label: "Archivar", permission: "programs.manage", actions: ["audit"] },
      { id: "restore", fromState: "archived", toState: "draft", label: "Restaurar", permission: "programs.manage" },
    ],
  },
  {
    key: "content.news",
    name: "Noticia",
    description: "Flujo editorial de noticias",
    entityType: "content.news",
    states: [
      { key: "draft", label: "Borrador", type: "initial", color: workflowStateColors.draft, isInitial: true },
      { key: "review", label: "En revisión", type: "approval", color: workflowStateColors.review },
      { key: "published", label: "Publicado", type: "published", color: workflowStateColors.published, isFinal: true },
    ],
    transitions: [
      { id: "submit-review", fromState: "draft", toState: "review", label: "Enviar a revisión", permission: "cms.pages.update" },
      { id: "publish", fromState: "review", toState: "published", label: "Publicar", permission: "news.publish", actions: ["audit"] },
      { id: "publish-direct", fromState: "draft", toState: "published", label: "Publicar directo", permission: "news.publish", actions: ["audit"] },
    ],
  },
];

export function templateToDefinition(
  template: DefinitionTemplate,
  tenantId?: string
): Omit<WorkflowDefinition, "_id" | "createdAt" | "updatedAt"> {
  const initial = template.states.find((s) => s.isInitial) ?? template.states[0];
  return {
    tenantId,
    key: template.key,
    name: template.name,
    description: template.description,
    entityType: template.entityType,
    version: 1,
    initialState: initial.key,
    states: template.states.map((s) => ({
      id: s.key,
      key: s.key,
      label: s.label,
      type: s.type,
      color: s.color,
      isInitial: s.isInitial,
      isFinal: s.isFinal,
    })),
    transitions: template.transitions,
    status: "active",
  };
}
