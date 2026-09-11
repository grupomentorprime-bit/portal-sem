/**
 * OT-GROWTH-MESSAGING-001 — base de Conversaciones (sin Meta / bandeja).
 * Outbound WhatsApp = MESSAGING-003 (adaptador), no aquí.
 */

export {
  GROWTH_CONVERSACIONES_COLLECTION,
  GROWTH_CONVERSATION_CHANNELS,
  GROWTH_MENSAJES_COLLECTION,
  isGrowthConversationChannel,
} from "./types";
export type {
  GrowthConversation,
  GrowthConversationChannel,
  GrowthConversationStatus,
  GrowthMessage,
  GrowthMessageDirection,
  GrowthMessageStatus,
} from "./types";

export type { GrowthMessagingStore } from "./store";
export { createMemoryGrowthMessagingStore } from "./memory-store";
export {
  createMongoGrowthMessagingStore,
  openGrowthMessagingStore,
} from "./repository";
export { ensureGrowthMessagingIndexes } from "./indexes";
export type { EnsureMessagingIndexResult } from "./indexes";

export { ensureGrowthConversation } from "./ensure-conversation";
export type {
  EnsureGrowthConversationInput,
  EnsureGrowthConversationResult,
} from "./ensure-conversation";

export {
  GROWTH_MESSAGE_RECEIVED_EVENT,
  recordGrowthInboundMessage,
} from "./record-inbound-message";
export type {
  RecordGrowthInboundMessageInput,
  RecordGrowthInboundMessageOptions,
  RecordGrowthInboundMessageResult,
} from "./record-inbound-message";
