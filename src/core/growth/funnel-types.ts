/**
 * Embudo comercial por Espacio. Las etapas viven en la definición de workflow.
 */

export const GROWTH_FUNNELS_COLLECTION = "growth_funnels" as const;

export const GROWTH_FUNNEL_DEFAULT_KEY = "default" as const;
export const GROWTH_FUNNEL_DEFAULT_NAME = "Ventas" as const;

export const GROWTH_FUNNEL_RESULTS = [
  { key: "won", label: "Ganada" },
  { key: "lost", label: "Perdida" },
  { key: "archived", label: "Archivada" },
  { key: "handed_off", label: "Traspasada" },
] as const;

export type GrowthFunnelResultKey = (typeof GROWTH_FUNNEL_RESULTS)[number]["key"];

const RESULT_LABEL = Object.fromEntries(
  GROWTH_FUNNEL_RESULTS.map((item) => [item.key, item.label])
) as Record<GrowthFunnelResultKey, string>;

export function isGrowthFunnelResultKey(key: string): key is GrowthFunnelResultKey {
  return Object.prototype.hasOwnProperty.call(RESULT_LABEL, key);
}

export function growthFunnelResultLabel(key: string): string | null {
  return isGrowthFunnelResultKey(key) ? RESULT_LABEL[key] : null;
}

export function growthOpportunityDefinitionKey(funnelKey: string): string {
  return `growth.opportunity.${funnelKey}`;
}

export function isGrowthFunnelSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export const GROWTH_FUNNEL_FIELD_TYPES = [
  "text",
  "long_text",
  "number",
  "date",
  "select",
  "boolean",
] as const;

export type GrowthFunnelFieldType = (typeof GROWTH_FUNNEL_FIELD_TYPES)[number];

export const GROWTH_FUNNEL_FIELD_LIMIT = 30;
export const GROWTH_FUNNEL_SELECT_OPTION_LIMIT = 50;
export const GROWTH_FUNNEL_TEXT_LIMIT = 500;
export const GROWTH_FUNNEL_LONG_TEXT_LIMIT = 4000;

export interface GrowthFunnelFieldOption {
  key: string;
  label: string;
  active: boolean;
}

export interface GrowthFunnelField {
  key: string;
  label: string;
  type: GrowthFunnelFieldType;
  required: boolean;
  position: number;
  active: boolean;
  options?: GrowthFunnelFieldOption[];
  help?: string;
}

export interface GrowthFunnel {
  _id: string;
  tenantId: string;
  key: string;
  name: string;
  status: "active" | "archived";
  isDefault: boolean;
  workflowDefinitionKey: string;
  /** Campos del embudo. Vacío si aún no se definieron. */
  fields?: GrowthFunnelField[];
  createdAt: string;
  updatedAt: string;
}

export interface GrowthFunnelStage {
  key: string;
  label: string;
  position: number;
  active: boolean;
  isInitial: boolean;
  isResult: boolean;
}

export interface GrowthFunnelTransition {
  id: string;
  fromState: string;
  toState: string;
  label: string;
}

export interface GrowthFunnelDefinition {
  _id: string;
  tenantId: string;
  key: string;
  name: string;
  initialState: string;
  states: Array<{
    key: string;
    label: string;
    isInitial?: boolean;
    isFinal?: boolean;
    metadata?: Record<string, unknown>;
  }>;
  transitions: GrowthFunnelTransition[];
  version: number;
}

export type GrowthFunnelFailure =
  | "invalid_key"
  | "duplicate_key"
  | "not_found"
  | "reserved_stage"
  | "duplicate_stage"
  | "cannot_deactivate_initial"
  | "cannot_deactivate_result"
  | "cannot_deactivate_last_active"
  | "cannot_rename_result"
  | "open_opportunities"
  | "default_required"
  | "archived"
  | "not_intermediate";
