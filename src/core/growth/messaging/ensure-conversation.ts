/**
 * OT-GROWTH-MESSAGING-001 — crear / reutilizar Conversación por Espacio.
 * No resuelve Persona ni Oportunidad cruzando tenants.
 */

import { ObjectId } from "mongodb";
import type { GrowthMessagingStore } from "./store";
import type {
  GrowthConversation,
  GrowthConversationChannel,
} from "./types";
import { isGrowthConversationChannel } from "./types";

function newId(): string {
  return new ObjectId().toString();
}

export interface EnsureGrowthConversationInput {
  tenantId: string;
  personaId: string;
  channel: GrowthConversationChannel;
  oportunidadId?: string;
  externalThreadId?: string;
  now?: string;
}

export type EnsureGrowthConversationResult =
  | {
      ok: true;
      conversation: GrowthConversation;
      created: boolean;
    }
  | { ok: false; reason: "missing_tenant_or_persona" }
  | { ok: false; reason: "invalid_channel" };

/**
 * Reutiliza por externalThreadId (canal) o por Persona+canal abierta.
 * Solo guarda FKs — sin datos de Persona/Oportunidad.
 * Si se pasa oportunidadId y difiere del actual, re-vincula (p. ej. nueva
 * intención comercial tras oportunidad final).
 */
export async function ensureGrowthConversation(
  store: GrowthMessagingStore,
  input: EnsureGrowthConversationInput
): Promise<EnsureGrowthConversationResult> {
  const tenantId = input.tenantId?.trim();
  const personaId = input.personaId?.trim();
  if (!tenantId || !personaId) {
    return { ok: false, reason: "missing_tenant_or_persona" };
  }
  if (!isGrowthConversationChannel(input.channel)) {
    return { ok: false, reason: "invalid_channel" };
  }

  const now = input.now ?? new Date().toISOString();
  const externalThreadId = input.externalThreadId?.trim() || undefined;
  const oportunidadId = input.oportunidadId?.trim() || undefined;

  let existing: GrowthConversation | null = null;
  if (externalThreadId) {
    existing = await store.findConversationByExternalThread({
      tenantId,
      channel: input.channel,
      externalThreadId,
    });
  }
  if (!existing) {
    existing = await store.findOpenConversationByPersonaChannel({
      tenantId,
      personaId,
      channel: input.channel,
    });
  }

  if (existing) {
    // Defensa: nunca reutilizar hilo de otra Persona / Espacio
    if (existing.tenantId !== tenantId || existing.personaId !== personaId) {
      return { ok: false, reason: "missing_tenant_or_persona" };
    }

    let next = existing;
    let changed = false;

    // Vincular / re-vincular contexto comercial (p. ej. nueva intención tras won/lost).
    if (oportunidadId && next.oportunidadId !== oportunidadId) {
      next = { ...next, oportunidadId };
      changed = true;
    }
    if (externalThreadId && !next.externalThreadId) {
      next = { ...next, externalThreadId };
      changed = true;
    }
    if (changed) {
      next = { ...next, updatedAt: now };
      next = await store.replaceConversation(next);
    }

    return { ok: true, conversation: next, created: false };
  }

  const conversation: GrowthConversation = {
    _id: newId(),
    tenantId,
    personaId,
    channel: input.channel,
    status: "open",
    createdAt: now,
    updatedAt: now,
    ...(oportunidadId ? { oportunidadId } : {}),
    ...(externalThreadId ? { externalThreadId } : {}),
  };

  const created = await store.insertConversation(conversation);
  return { ok: true, conversation: created, created: true };
}
