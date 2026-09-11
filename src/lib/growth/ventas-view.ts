/**
 * OT-GROWTH-SALES-001 — tipos de proyección UI Ventas (sin I/O).
 */

import type {
  GrowthActivityView,
  GrowthOportunidadDetailView,
} from "./persona-view";

export interface GrowthVentasQueueItemView {
  id: string;
  personaId: string;
  personaDisplayName: string;
  originLabel: string;
  typeLabel: string;
  typeKey: string;
  status: string;
  statusLabel: string;
  nextActionLabel: string;
  hasNextAction: boolean;
  lastActivityLabel: string;
  lastActivityAt?: string;
  updatedAt: string;
}

export interface GrowthVentasOpportunityOperateView
  extends GrowthOportunidadDetailView {
  typeKey: string;
  availableTransitions: Array<{
    id: string;
    toState: string;
    label: string;
  }>;
  recentActivities: GrowthActivityView[];
}
