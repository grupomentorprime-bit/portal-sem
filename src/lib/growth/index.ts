/**
 * OT-GROWTH-CORE-005/006/007 — ingestión, backfill y lectura UI.
 */

export {
  ingestFormSubmissionToGrowthSafe,
  ingestInteresadoToGrowthSafe,
} from "./live-ingest";
export {
  createMongoGrowthBackfillSource,
  runMongoGrowthBackfill,
} from "./backfill";
export {
  GROWTH_NO_NEXT_ACTION_LABEL,
  GROWTH_ORIGIN_SECTION_LABEL,
  GROWTH_NEXT_ACTION_SECTION_LABEL,
  GROWTH_TIMELINE_SECTION_LABEL,
  GROWTH_VIEW_DETAIL_LABEL,
  growthActivityKindLabel,
  growthNextActionKindLabel,
  growthOpportunityStatusLabel,
  growthOpportunityTypeLabel,
  growthOriginArrivalLabel,
  growthOriginKindLabel,
} from "./labels";
export {
  activitiesVisibleInUi,
  escapeGrowthSearchRegex,
  personaMatchesSearch,
  pickPrimaryNextAction,
  sortActivitiesNewestFirst,
  toOportunidadDetailView,
  toPersonaDetailView,
  toPersonaListItemView,
} from "./persona-view";
export type {
  GrowthActivityView,
  GrowthNextActionView,
  GrowthOportunidadDetailView,
  GrowthOportunidadView,
  GrowthPersonaDetailView,
  GrowthPersonaListItemView,
} from "./persona-view";
export {
  getGrowthOportunidadDetailView,
  getGrowthPersonaDetailView,
  listGrowthPersonaViews,
} from "./personas-read";
export type { GrowthPersonasListFilters } from "./personas-read";
