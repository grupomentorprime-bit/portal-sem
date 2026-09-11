/**
 * OT-GROWTH-AUTOMATION-003 — puerto hacia sales-ops (sin duplicar lógica de Ventas).
 * Producción: adapter que llama a src/lib/growth/sales-ops.ts
 * Tests: implementación en memoria sobre Growth Core.
 */

import type { GrowthActivity, GrowthNextActionKind, GrowthOportunidad } from "@/core/growth/types";

export type GrowthAutomationSalesOpsActor = {
  userId: string;
};

export type GrowthAutomationSalesOpsPort = {
  salesTransitionOpportunity(input: {
    tenantId: string;
    oportunidadId: string;
    actor: GrowthAutomationSalesOpsActor;
    toState?: string;
    transitionId?: string;
    comment?: string;
  }): Promise<
    | {
        ok: true;
        oportunidad: GrowthOportunidad;
        fromState: string;
        toState: string;
        activity: GrowthActivity;
      }
    | { ok: false; reason: string; error?: string }
  >;

  salesRecordFollowUp(input: {
    tenantId: string;
    oportunidadId: string;
    actor: GrowthAutomationSalesOpsActor;
    kind: "note" | "contact";
    summary: string;
  }): Promise<
    | {
        ok: true;
        activity: GrowthActivity;
        published: boolean;
        oportunidad: GrowthOportunidad;
      }
    | { ok: false; reason: string }
  >;

  salesSetNextAction(input: {
    tenantId: string;
    oportunidadId: string;
    actor: GrowthAutomationSalesOpsActor;
    summary: string;
    dueAt?: string;
    kind?: GrowthNextActionKind;
  }): Promise<
    | {
        ok: true;
        oportunidad: GrowthOportunidad;
        activity: GrowthActivity;
      }
    | { ok: false; reason: string }
  >;

  salesClearNextAction(input: {
    tenantId: string;
    oportunidadId: string;
    actor: GrowthAutomationSalesOpsActor;
  }): Promise<
    | {
        ok: true;
        oportunidad: GrowthOportunidad;
        activity: GrowthActivity;
      }
    | { ok: false; reason: string }
  >;
};
