/**
 * ADR-010 §3 — definición de plataforma `growth.opportunity`.
 * Misma plantilla que entra en SYSTEM_WORKFLOW_TEMPLATES (un solo motor).
 */

import type { DefinitionTemplate } from "@/core/workflow/definitions/defaults";
import { workflowStateColors } from "@/core/workflow/workflow-colors";

export const GROWTH_OPPORTUNITY_DEFINITION_KEY = "growth.opportunity" as const;
export const GROWTH_OPPORTUNITY_ENTITY_TYPE = "growth.opportunity" as const;

export const GROWTH_OPPORTUNITY_FINAL_STATUSES = [
  "won",
  "lost",
  "handed_off",
  "archived",
] as const;

export type GrowthOpportunityFinalStatus =
  (typeof GROWTH_OPPORTUNITY_FINAL_STATUSES)[number];

export function isGrowthOpportunityFinalStatus(
  status: string
): status is GrowthOpportunityFinalStatus {
  return (GROWTH_OPPORTUNITY_FINAL_STATUSES as readonly string[]).includes(status);
}

/** Plantilla canónica — no hardcodea estados educativos. */
export const GROWTH_OPPORTUNITY_WORKFLOW_TEMPLATE: DefinitionTemplate = {
  key: GROWTH_OPPORTUNITY_DEFINITION_KEY,
  name: "Growth — Oportunidad",
  description:
    "Estados mínimos de oportunidad comercial (ADR-010). open → active → won | lost | handed_off | archived.",
  entityType: GROWTH_OPPORTUNITY_ENTITY_TYPE,
  states: [
    {
      key: "open",
      label: "Abierta",
      type: "initial",
      color: workflowStateColors.draft,
      isInitial: true,
    },
    {
      key: "active",
      label: "En seguimiento",
      type: "normal",
      color: workflowStateColors.review,
    },
    {
      key: "won",
      label: "Ganada",
      type: "published",
      color: workflowStateColors.published,
      isFinal: true,
    },
    {
      key: "lost",
      label: "Perdida",
      type: "cancelled",
      color: workflowStateColors.archived,
      isFinal: true,
    },
    {
      key: "handed_off",
      label: "Traspasada",
      type: "archived",
      color: workflowStateColors.approved,
      isFinal: true,
    },
    {
      key: "archived",
      label: "Archivada",
      type: "archived",
      color: workflowStateColors.archived,
      isFinal: true,
    },
  ],
  transitions: [
    {
      id: "activate",
      fromState: "open",
      toState: "active",
      label: "Activar seguimiento",
      actions: ["audit"],
    },
    {
      id: "win",
      fromState: "active",
      toState: "won",
      label: "Cerrar ganada",
      actions: ["audit"],
      events: ["WorkflowTransitioned"],
    },
    {
      id: "lose",
      fromState: "active",
      toState: "lost",
      label: "Cerrar perdida",
      actions: ["audit"],
      events: ["WorkflowTransitioned"],
    },
    {
      id: "hand_off",
      fromState: "active",
      toState: "handed_off",
      label: "Traspasar a sistema externo",
      actions: ["audit"],
      events: ["WorkflowTransitioned"],
    },
    {
      id: "archive",
      fromState: "active",
      toState: "archived",
      label: "Archivar",
      actions: ["audit"],
      events: ["WorkflowTransitioned"],
    },
  ],
};

export interface GrowthOpportunityAvailableTransition {
  id: string;
  fromState: string;
  toState: string;
  label: string;
}

/** Transiciones permitidas desde un estado (plantilla growth.opportunity). */
export function listAvailableGrowthOpportunityTransitions(
  fromState: string
): GrowthOpportunityAvailableTransition[] {
  return GROWTH_OPPORTUNITY_WORKFLOW_TEMPLATE.transitions
    .filter((t) => t.fromState === fromState)
    .map((t) => ({
      id: t.id,
      fromState: t.fromState,
      toState: t.toState,
      label: t.label ?? t.id,
    }));
}
