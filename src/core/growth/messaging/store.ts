/**
 * OT-GROWTH-MESSAGING-001 — puerto de persistencia Conversación / Mensaje.
 */

import type { GrowthConversation, GrowthMessage } from "./types";
import type { GrowthConversationChannel } from "./types";

export interface GrowthMessagingStore {
  findConversationById(
    tenantId: string,
    conversationId: string
  ): Promise<GrowthConversation | null>;

  /**
   * Reutiliza hilo externo cuando el canal ya lo conoce.
   */
  findConversationByExternalThread(input: {
    tenantId: string;
    channel: GrowthConversationChannel;
    externalThreadId: string;
  }): Promise<GrowthConversation | null>;

  /**
   * Conversación abierta de la Persona en el canal (sin hilo externo).
   */
  findOpenConversationByPersonaChannel(input: {
    tenantId: string;
    personaId: string;
    channel: GrowthConversationChannel;
  }): Promise<GrowthConversation | null>;

  insertConversation(
    conversation: GrowthConversation
  ): Promise<GrowthConversation>;

  replaceConversation(
    conversation: GrowthConversation
  ): Promise<GrowthConversation>;

  findMessageById(
    tenantId: string,
    messageId: string
  ): Promise<GrowthMessage | null>;

  /**
   * Lookup idempotente: mismo mensaje externo en el Espacio + canal.
   */
  findMessageByExternalId(input: {
    tenantId: string;
    channel: GrowthConversationChannel;
    externalMessageId: string;
  }): Promise<GrowthMessage | null>;

  /**
   * Lookup de reintento outbound: mismo clientRequestId en el Espacio.
   */
  findMessageByClientRequestId(input: {
    tenantId: string;
    clientRequestId: string;
  }): Promise<GrowthMessage | null>;

  /**
   * Último mensaje entrante del hilo (ventana de servicio WhatsApp).
   */
  findLatestInboundMessage(input: {
    tenantId: string;
    conversationId: string;
  }): Promise<GrowthMessage | null>;

  /**
   * Insert idempotente si hay externalMessageId (unique sparse).
   * Si ya existe → retorna la existente.
   * También idempotente por clientRequestId cuando existe.
   */
  insertMessage(message: GrowthMessage): Promise<GrowthMessage>;

  /**
   * Reemplazo de mensaje (estado de envío outbound). Tenant-scoped.
   */
  replaceMessage(message: GrowthMessage): Promise<GrowthMessage>;

  /**
   * Campo técnico post-bus (como Actividad.eventId). No es update de negocio.
   */
  setMessageEventId(
    tenantId: string,
    messageId: string,
    eventId: string
  ): Promise<GrowthMessage | null>;
}
