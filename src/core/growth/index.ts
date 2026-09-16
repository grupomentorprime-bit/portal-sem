/**
 * Growth Core — Persona (002) + Oportunidad (003) + Actividad (004) + Ingestión (005) + Backfill (006).
 * Messaging base (MESSAGING-001): Conversación + Mensaje (sin Meta / bandeja).
 * WhatsApp inbound (MESSAGING-002): webhook Cloud API → recordGrowthInboundMessage.
 * WhatsApp reply (MESSAGING-003): envío Cloud API sobre conversación existente.
 * Captación dual-write: fuente primero; Growth proyecta sin revertir.
 */

export {
  GROWTH_ACTIVIDADES_COLLECTION,
  GROWTH_BASE_OPPORTUNITY_TYPE_KEYS,
  GROWTH_DEFAULT_OPPORTUNITY_TYPES,
  GROWTH_OPORTUNIDADES_COLLECTION,
  GROWTH_PERSONAS_COLLECTION,
  GROWTH_SPACE_CONFIG_COLLECTION,
} from "./types";
export type {
  GrowthActivity,
  GrowthActivityKind,
  GrowthActivityStub,
  GrowthBaseOpportunityTypeKey,
  GrowthContactAlias,
  GrowthNextAction,
  GrowthNextActionKind,
  GrowthOportunidad,
  GrowthOpportunityHandoff,
  GrowthOpportunitySource,
  GrowthOpportunityStatus,
  GrowthOpportunitySubjectType,
  GrowthOpportunityTypeConfig,
  GrowthOrigin,
  GrowthOriginInput,
  GrowthOriginKind,
  GrowthPersona,
  GrowthPersonaStatus,
  GrowthSpaceConfig,
  UpdateGrowthPersonaContactInput,
  UpdateGrowthPersonaContactResult,
  UpsertGrowthPersonaInput,
  UpsertGrowthPersonaResult,
} from "./types";

export {
  buildDisplayName,
  normalizeGrowthEmail,
  normalizeGrowthPhone,
} from "./normalize";
export { buildGrowthIngestKey } from "./ingest-key";
export { buildGrowthOrigin } from "./origin";
export type { GrowthPersonaStore } from "./store";
export { createMemoryGrowthPersonaStore } from "./memory-store";
export {
  updateGrowthPersonaContact,
  upsertGrowthPersona,
} from "./upsert-persona";
export type { GrowthPersonaWriteOptions } from "./upsert-persona";
export {
  ensureGrowthActivityIndexes,
  ensureGrowthCoreIndexes,
  ensureGrowthOpportunityIndexes,
  ensureGrowthPersonaIndexes,
} from "./indexes";
export {
  createMongoGrowthPersonaStore,
  openGrowthPersonaStore,
} from "./repository";

export {
  GROWTH_OPPORTUNITY_DEFINITION_KEY,
  GROWTH_OPPORTUNITY_ENTITY_TYPE,
  GROWTH_OPPORTUNITY_FINAL_STATUSES,
  GROWTH_OPPORTUNITY_WORKFLOW_TEMPLATE,
  isGrowthOpportunityFinalStatus,
  listAvailableGrowthOpportunityTransitions,
} from "./opportunity-definition";
export type { GrowthOpportunityAvailableTransition } from "./opportunity-definition";
export type { GrowthOpportunityStore } from "./opportunity-store";
export type { GrowthOpportunityWorkflowPort } from "./opportunity-workflow-port";
export {
  createMemoryGrowthOpportunityWorkflow,
} from "./opportunity-workflow-port";
export { createMemoryGrowthOpportunityStore } from "./opportunity-memory-store";
export {
  createMongoGrowthOpportunityStore,
  openGrowthOpportunityStore,
} from "./opportunity-repository";
export {
  ensureGrowthSpaceConfig,
  isAllowedOpportunityTypeKey,
  platformDefaultOpportunityTypes,
  resolveGrowthSpaceConfig,
} from "./space-config";
export { openGrowthOpportunity } from "./open-opportunity";
export type {
  OpenGrowthOpportunityInput,
  OpenGrowthOpportunityResult,
} from "./open-opportunity";
export {
  handOffGrowthOpportunity,
  transitionGrowthOpportunity,
} from "./transition-opportunity";
export type {
  TransitionGrowthOpportunityInput,
  TransitionGrowthOpportunityResult,
} from "./transition-opportunity";
export {
  clearGrowthNextAction,
  setGrowthNextAction,
} from "./next-action";
export type {
  ClearGrowthNextActionInput,
  SetGrowthNextActionInput,
  SetGrowthNextActionResult,
} from "./next-action";

export { recordGrowthActivity } from "./activity";
export type {
  GrowthActivityRecorder,
  RecordGrowthActivityInput,
  RecordGrowthActivityOptions,
} from "./activity";
export {
  GROWTH_DOMAIN_EVENT_TYPES,
  createMemoryGrowthEventBus,
  growthEventTypeForActivityKind,
} from "./event-bus-port";
export type {
  GrowthDomainEventType,
  GrowthEventBusPort,
  GrowthEventPublishInput,
} from "./event-bus-port";

export {
  GROWTH_V1_FORM_DESTINATIONS,
  isGrowthV1FormDestination,
  projectGrowthFromSignal,
  projectGrowthFromSignalSafe,
} from "./ingest";
export type {
  GrowthAdmissionIngestInput,
  GrowthFormIngestInput,
  GrowthIngestDeps,
  GrowthIngestInput,
  GrowthIngestResult,
  GrowthV1FormDestination,
} from "./ingest";
export { extractGrowthContactFromFormData } from "./ingest-contact";
export type { GrowthContactFields } from "./ingest-contact";
export { createMemoryGrowthIngestStores } from "./ingest-memory";
export {
  toGrowthAdmissionInput,
  toGrowthFormInput,
} from "./ingest-map";
export type {
  GrowthInteresadoSourceRow,
  GrowthSubmissionSourceRow,
} from "./ingest-map";
export {
  classifyGrowthBackfillResult,
  createMemoryGrowthBackfillSource,
  emptyGrowthBackfillSummary,
  runGrowthBackfill,
} from "./backfill";
export type {
  GrowthBackfillClassify,
  GrowthBackfillOptions,
  GrowthBackfillPage,
  GrowthBackfillSourceReader,
  GrowthBackfillSummary,
} from "./backfill";
export { createMongoGrowthBackfillSource } from "./backfill-mongo";

export {
  GROWTH_CONVERSACIONES_COLLECTION,
  GROWTH_CONVERSATION_CHANNELS,
  GROWTH_MENSAJES_COLLECTION,
  GROWTH_MESSAGE_RECEIVED_EVENT,
  createMemoryGrowthMessagingStore,
  createMongoGrowthMessagingStore,
  ensureGrowthConversation,
  ensureGrowthMessagingIndexes,
  isGrowthConversationChannel,
  openGrowthMessagingStore,
  recordGrowthInboundMessage,
} from "./messaging";
export type {
  EnsureGrowthConversationInput,
  EnsureGrowthConversationResult,
  EnsureMessagingIndexResult,
  GrowthConversation,
  GrowthConversationChannel,
  GrowthConversationStatus,
  GrowthMessage,
  GrowthMessageDirection,
  GrowthMessageStatus,
  GrowthMessagingStore,
  RecordGrowthInboundMessageInput,
  RecordGrowthInboundMessageOptions,
  RecordGrowthInboundMessageResult,
} from "./messaging";

export {
  GROWTH_MESSAGE_SENT_EVENT,
  GROWTH_WHATSAPP_CHANNEL,
  GROWTH_WHATSAPP_CONNECTIONS_COLLECTION,
  GROWTH_WHATSAPP_CONNECTION_SOURCE_EMBEDDED,
  GROWTH_WHATSAPP_CONNECTION_SOURCE_LEGACY,
  GROWTH_WHATSAPP_OPPORTUNITY_TYPE_KEY,
  GROWTH_WHATSAPP_SOURCE_COLLECTION,
  META_PLATFORM_ENV,
  WHATSAPP_CHANNEL_STATUS_LABEL,
  WHATSAPP_CLOUD_API_VERSION,
  WHATSAPP_CUSTOMER_SERVICE_WINDOW_MS,
  completeWhatsAppEmbeddedSignup,
  createHttpWhatsAppCloudApi,
  createHttpWhatsAppEmbeddedSignupGraph,
  createMemoryGrowthWhatsAppConnectionStore,
  createWhatsAppConnectState,
  deriveWhatsAppChannelStatus,
  disconnectWhatsAppConnection,
  ensureGrowthWhatsAppIndexes,
  evaluateWhatsAppServiceWindow,
  extractWhatsAppInboundMessages,
  getMetaAppSecret,
  getMetaPlatformPublicConfig,
  getMetaWebhookVerifyToken,
  parseWhatsAppRecipientFromThreadId,
  readMetaPlatformConfig,
  receiveWhatsAppCloudWebhook,
  sendWhatsAppReply,
  signWhatsAppHubBody,
  testGrowthWhatsAppConnection,
  toPublicWhatsAppConnection,
  toWhatsAppChannelAdminView,
  upsertGrowthWhatsAppConnection,
  verifyWhatsAppConnectState,
  verifyWhatsAppHubSignature,
  verifyWhatsAppWebhookSubscription,
} from "./whatsapp";
export type {
  CompleteWhatsAppEmbeddedSignupInput,
  CompleteWhatsAppEmbeddedSignupResult,
  DisconnectWhatsAppConnectionResult,
  EnsureWhatsAppIndexResult,
  GrowthWhatsAppConnection,
  GrowthWhatsAppConnectionPublic,
  GrowthWhatsAppConnectionSource,
  GrowthWhatsAppConnectionStore,
  MetaPlatformConfig,
  MetaPlatformPublicConfig,
  ReceiveWhatsAppCloudWebhookDeps,
  ReceiveWhatsAppCloudWebhookResult,
  SendWhatsAppReplyDeps,
  SendWhatsAppReplyInput,
  SendWhatsAppReplyResult,
  TestGrowthWhatsAppConnectionResult,
  UpsertGrowthWhatsAppConnectionInput,
  UpsertGrowthWhatsAppConnectionResult,
  VerifyWhatsAppWebhookResult,
  WhatsAppChannelAdminView,
  WhatsAppChannelStatus,
  WhatsAppCloudApiPort,
  WhatsAppConnectStateResult,
  WhatsAppEmbeddedSignupGraphPort,
  WhatsAppInboundExtracted,
  WhatsAppProbeInput,
  WhatsAppProbeResult,
  WhatsAppReceiveItem,
  WhatsAppSendTextResult,
  WhatsAppServiceWindow,
} from "./whatsapp";
