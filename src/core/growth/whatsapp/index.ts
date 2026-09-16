/**
 * OT-GROWTH-MESSAGING-002/003/005 / OT-GROWTH-WHATSAPP-META-001 —
 * adaptador WhatsApp Cloud API.
 * Inbound + envío + Embedded Signup + estado de canal admin.
 * Sin bot, IA ni plantillas gestionadas. Sin segundo conector.
 */

export {
  GROWTH_WHATSAPP_CHANNEL,
  GROWTH_WHATSAPP_CONNECTIONS_COLLECTION,
  GROWTH_WHATSAPP_CONNECTION_SOURCE_EMBEDDED,
  GROWTH_WHATSAPP_CONNECTION_SOURCE_LEGACY,
  GROWTH_WHATSAPP_OPPORTUNITY_TYPE_KEY,
  GROWTH_WHATSAPP_SOURCE_COLLECTION,
  toPublicWhatsAppConnection,
} from "./types";
export type {
  GrowthWhatsAppConnection,
  GrowthWhatsAppConnectionPublic,
  GrowthWhatsAppConnectionSource,
  WhatsAppInboundExtracted,
} from "./types";

export {
  WHATSAPP_CHANNEL_STATUS_LABEL,
  deriveWhatsAppChannelStatus,
  toWhatsAppChannelAdminView,
} from "./channel-status";
export type {
  WhatsAppChannelAdminView,
  WhatsAppChannelStatus,
} from "./channel-status";

export type { GrowthWhatsAppConnectionStore } from "./connection-store";
export { createMemoryGrowthWhatsAppConnectionStore } from "./memory-store";
export { ensureGrowthWhatsAppIndexes } from "./indexes";
export type { EnsureWhatsAppIndexResult } from "./indexes";

export {
  safeEqualString,
  signWhatsAppHubBody,
  verifyWhatsAppHubSignature,
} from "./crypto";

export {
  collectWhatsAppPhoneNumberIds,
  extractWhatsAppInboundMessages,
  occurredAtFromWhatsAppTimestamp,
} from "./parse";

export { verifyWhatsAppWebhookSubscription } from "./verify";
export type { VerifyWhatsAppWebhookResult } from "./verify";

export { upsertGrowthWhatsAppConnection } from "./upsert-connection";
export type {
  UpsertGrowthWhatsAppConnectionInput,
  UpsertGrowthWhatsAppConnectionResult,
} from "./upsert-connection";

export { receiveWhatsAppCloudWebhook } from "./receive";
export type {
  ReceiveWhatsAppCloudWebhookDeps,
  ReceiveWhatsAppCloudWebhookInput,
  ReceiveWhatsAppCloudWebhookResult,
  WhatsAppReceiveItem,
} from "./receive";

export {
  WHATSAPP_CLOUD_API_VERSION,
  WHATSAPP_GRAPH_BASE_URL,
  WHATSAPP_TEMPLATE_REQUIRED_CODES,
  createHttpWhatsAppCloudApi,
} from "./cloud-api";
export type {
  WhatsAppCloudApiPort,
  WhatsAppProbeInput,
  WhatsAppProbeResult,
  WhatsAppSendTextInput,
  WhatsAppSendTextResult,
} from "./cloud-api";

export {
  WHATSAPP_CUSTOMER_SERVICE_WINDOW_MS,
  evaluateWhatsAppServiceWindow,
  parseWhatsAppRecipientFromThreadId,
} from "./window";
export type { WhatsAppServiceWindow } from "./window";

export {
  GROWTH_MESSAGE_SENT_EVENT,
  sendWhatsAppReply,
} from "./send-reply";
export type {
  SendWhatsAppReplyDeps,
  SendWhatsAppReplyInput,
  SendWhatsAppReplyResult,
} from "./send-reply";

export { testGrowthWhatsAppConnection } from "./test-connection";
export type { TestGrowthWhatsAppConnectionResult } from "./test-connection";

export {
  META_PLATFORM_ENV,
  getMetaAppSecret,
  getMetaPlatformPublicConfig,
  getMetaWebhookVerifyToken,
  readMetaPlatformConfig,
} from "./meta-platform";
export type {
  MetaPlatformConfig,
  MetaPlatformPublicConfig,
} from "./meta-platform";

export {
  createWhatsAppConnectState,
  verifyWhatsAppConnectState,
} from "./connect-state";
export type { WhatsAppConnectStateResult } from "./connect-state";

export {
  completeWhatsAppEmbeddedSignup,
  createHttpWhatsAppEmbeddedSignupGraph,
  disconnectWhatsAppConnection,
} from "./embedded-signup";
export type {
  CompleteWhatsAppEmbeddedSignupInput,
  CompleteWhatsAppEmbeddedSignupResult,
  DisconnectWhatsAppConnectionResult,
  WhatsAppEmbeddedSignupGraphPort,
} from "./embedded-signup";
