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
  GrowthPersonaConversationView,
  GrowthPersonaDetailView,
  GrowthPersonaListItemView,
} from "./persona-view";
export {
  buildPersonaOriginMongoFilter,
  getGrowthOportunidadDetailView,
  getGrowthPersonaDetailView,
  listGrowthPersonaViews,
  listPersonaConversationViews,
} from "./personas-read";
export type { GrowthPersonasListFilters } from "./personas-read";
export {
  createGrowthPersonaAdmin,
  createGrowthPersonaWithStore,
} from "./personas-create";
export type {
  CreateGrowthPersonaAdminInput,
  CreateGrowthPersonaAdminResult,
} from "./personas-create";
export {
  humanizeOriginDisplayLabel,
  isKnownHumanOriginChannel,
} from "./humanize-origin-display";
export {
  filterActividadFeedByCategory,
  listGrowthActividadFeed,
  projectActivityToFeedItem,
  projectMessageToFeedItem,
  resolveGrowthActividadCategory,
  sortActividadFeedNewestFirst,
} from "./actividad-read";
export type {
  GrowthActividadFeedCategory,
  GrowthActividadFeedCategoryFilter,
  GrowthActividadFeedItem,
  GrowthActividadFeedFilters,
  GrowthActividadFeedResult,
} from "./actividad-read";
export {
  GROWTH_ACTIVIDAD_FEED_CATEGORIES,
  GROWTH_ACTIVIDAD_PERSONAS_KINDS,
  GROWTH_ACTIVIDAD_VENTAS_KINDS,
  dedupeHandoffTransitions,
  encodeActividadFeedCursor,
  decodeActividadFeedCursor,
  paginateActividadFeed,
} from "./actividad-view";
export {
  getAnalyticsV1,
  resolveAnalyticsPeriod,
  isTimestampInPeriod,
  buildAnalyticsV1Response,
  emptyAnalyticsV1Response,
  formatConversionPercent,
  computeConversionRate,
  acquisitionOriginGroupLabel,
  ANALYTICS_PERIOD_PRESETS,
} from "./analytics-read";
export type {
  AnalyticsV1Response,
  AnalyticsPeriod,
  AnalyticsPeriodPreset,
  ResolveAnalyticsPeriodInput,
  ResolveAnalyticsPeriodResult,
  GetAnalyticsV1Result,
} from "./analytics-read";
