/**
 * OT-GROWTH-SALES-001 — tipos de proyección UI Ventas (sin I/O).
 */

import type { GrowthAssessmentView } from "@/core/growth/assessment";
import type { GrowthFunnelFieldFormRow } from "@/core/growth/custom-fields";
import type { GrowthPriorityBand } from "@/core/growth/priority";
import type { OpportunityStageTrack } from "./opportunity-stage-track";
import type {
  GrowthActivityView,
  GrowthOportunidadDetailView,
  GrowthPersonaConversationView,
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
  funnelKey: string;
  funnelName: string;
  stageLabel: string;
  availableTransitions: Array<{
    id: string;
    toState: string;
    label: string;
  }>;
  nextActionLabel: string;
  hasNextAction: boolean;
  lastActivityLabel: string;
  lastActivityAt?: string;
  openedAt: string;
  updatedAt: string;
  priorityBand: GrowthPriorityBand | null;
  priorityRank: number;
  priorityKey: number | null;
  ownerUserId?: string;
  ownerLabel?: string;
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
  funnelKey: string;
  funnelName: string;
  stageLabel: string;
  assessment: GrowthAssessmentView | null;
  ownerUserId?: string;
  ownerLabel?: string;
  funnelFields: GrowthFunnelFieldFormRow[];
  email?: string;
  phone?: string;
  closedAt?: string;
  organizationName?: string;
  stageTrack: OpportunityStageTrack;
  conversations: GrowthPersonaConversationView[];
}

export interface GrowthVentasFunnelOption {
  key: string;
  name: string;
  isDefault: boolean;
  status: "active" | "archived";
}

export interface GrowthVentasStageColumn {
  key: string;
  label: string;
  position: number;
  active: boolean;
}

export interface GrowthVentasBoardLane {
  funnelKey: string;
  funnelName: string;
  isDefault: boolean;
  columns: GrowthVentasStageColumn[];
}

export interface GrowthVentasStatusOption {
  value: string;
  label: string;
}
