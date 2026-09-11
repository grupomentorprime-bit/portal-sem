/**
 * OT-GROWTH-CORE-002 / ADR-010 §4.2 — upsert Persona + dedupe por Espacio.
 * Conflicto email/teléfono → identity_conflict (modelo Actividad CORE-004).
 */

import { ObjectId } from "mongodb";
import { recordGrowthActivity } from "./activity";
import type { GrowthEventBusPort } from "./event-bus-port";
import { buildGrowthIngestKey } from "./ingest-key";
import {
  buildDisplayName,
  normalizeGrowthEmail,
  normalizeGrowthPhone,
} from "./normalize";
import { buildGrowthOrigin } from "./origin";
import type { GrowthPersonaStore } from "./store";
import type {
  GrowthActivity,
  GrowthContactAlias,
  GrowthPersona,
  UpdateGrowthPersonaContactInput,
  UpdateGrowthPersonaContactResult,
  UpsertGrowthPersonaInput,
  UpsertGrowthPersonaResult,
} from "./types";

function newId(): string {
  return new ObjectId().toString();
}

function touchAlias(
  aliases: GrowthContactAlias[],
  value: string,
  normalized: string,
  now: string
): GrowthContactAlias[] {
  const idx = aliases.findIndex((a) => a.normalized === normalized);
  if (idx >= 0) {
    const next = aliases.slice();
    next[idx] = { ...next[idx], value, lastSeenAt: now };
    return next;
  }
  return [...aliases, { value, normalized, firstSeenAt: now, lastSeenAt: now }];
}

function maybeFillDisplayName(current: string, incoming?: string): string {
  if (current.trim()) return current;
  const next = incoming?.trim().replace(/\s+/g, " ") ?? "";
  return next;
}

function maybeFillOptional(current: string | undefined, incoming?: string): string | undefined {
  if (current?.trim()) return current;
  const next = incoming?.trim();
  return next || current;
}

async function recordIdentityConflict(
  store: GrowthPersonaStore,
  opts: {
    tenantId: string;
    emailPersonaId: string;
    phonePersonaId: string;
    sourceCollection?: string;
    sourceId?: string;
    now: string;
    eventBus?: GrowthEventBusPort;
  }
): Promise<GrowthActivity> {
  const sourceCollection = opts.sourceCollection ?? "growth";
  const sourceId =
    opts.sourceId ?? `${opts.emailPersonaId}:${opts.phonePersonaId}:${opts.now}`;
  const ingestKey = buildGrowthIngestKey(
    sourceCollection,
    sourceId,
    "identity_conflict"
  );

  const recorded = await recordGrowthActivity(
    store,
    {
      tenantId: opts.tenantId,
      // Ancla en la Persona del email; payload apunta a ambas.
      personaId: opts.emailPersonaId,
      kind: "identity_conflict",
      summary:
        "Conflicto de identidad: email y teléfono apuntan a Personas distintas",
      ingestKey,
      sourceCollection: opts.sourceCollection,
      sourceId: opts.sourceId,
      payload: {
        emailPersonaId: opts.emailPersonaId,
        phonePersonaId: opts.phonePersonaId,
      },
      occurredAt: opts.now,
    },
    { eventBus: opts.eventBus }
  );

  if (!recorded.ok) {
    throw new Error("identity_conflict requires tenantId and personaId");
  }
  return recorded.activity;
}

/**
 * Aplica email/teléfono entrantes a una Persona ya resuelta.
 * Si el canal nuevo choca con otra Persona → conflicto (sin robar clave).
 */
async function applyContactChannels(
  store: GrowthPersonaStore,
  persona: GrowthPersona,
  channels: {
    email?: string;
    emailNormalized?: string;
    phone?: string;
    phoneNormalized?: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    sourceCollection?: string;
    sourceId?: string;
    now: string;
    eventBus?: GrowthEventBusPort;
  }
): Promise<UpsertGrowthPersonaResult> {
  const now = channels.now;
  let next: GrowthPersona = { ...persona, emails: [...persona.emails], phones: [...persona.phones] };
  let changed = false;

  if (channels.emailNormalized && channels.email) {
    if (
      next.emailNormalized &&
      next.emailNormalized !== channels.emailNormalized
    ) {
      const owner = await store.findByEmail(next.tenantId, channels.emailNormalized);
      if (owner && owner._id !== next._id) {
        const activity = await recordIdentityConflict(store, {
          tenantId: next.tenantId,
          emailPersonaId: owner._id,
          phonePersonaId: next._id,
          sourceCollection: channels.sourceCollection,
          sourceId: channels.sourceId,
          now,
          eventBus: channels.eventBus,
        });
        return {
          ok: false,
          reason: "identity_conflict",
          emailPersonaId: owner._id,
          phonePersonaId: next._id,
          activity,
        };
      }
      // Cambio de primario: alias del anterior
      if (next.email && next.emailNormalized) {
        next.emails = touchAlias(next.emails, next.email, next.emailNormalized, now);
      }
      next.email = channels.email;
      next.emailNormalized = channels.emailNormalized;
      next.emails = touchAlias(next.emails, channels.email, channels.emailNormalized, now);
      changed = true;
    } else if (!next.emailNormalized) {
      next.email = channels.email;
      next.emailNormalized = channels.emailNormalized;
      next.emails = touchAlias(next.emails, channels.email, channels.emailNormalized, now);
      changed = true;
    } else {
      next.emails = touchAlias(next.emails, channels.email, channels.emailNormalized, now);
    }
  }

  if (channels.phoneNormalized && channels.phone) {
    if (
      next.phoneNormalized &&
      next.phoneNormalized !== channels.phoneNormalized
    ) {
      const owner = await store.findByPhone(next.tenantId, channels.phoneNormalized);
      if (owner && owner._id !== next._id) {
        const activity = await recordIdentityConflict(store, {
          tenantId: next.tenantId,
          emailPersonaId: next._id,
          phonePersonaId: owner._id,
          sourceCollection: channels.sourceCollection,
          sourceId: channels.sourceId,
          now,
          eventBus: channels.eventBus,
        });
        return {
          ok: false,
          reason: "identity_conflict",
          emailPersonaId: next._id,
          phonePersonaId: owner._id,
          activity,
        };
      }
      if (next.phone && next.phoneNormalized) {
        next.phones = touchAlias(next.phones, next.phone, next.phoneNormalized, now);
      }
      next.phone = channels.phone;
      next.phoneNormalized = channels.phoneNormalized;
      next.phones = touchAlias(next.phones, channels.phone, channels.phoneNormalized, now);
      changed = true;
    } else if (!next.phoneNormalized) {
      next.phone = channels.phone;
      next.phoneNormalized = channels.phoneNormalized;
      next.phones = touchAlias(next.phones, channels.phone, channels.phoneNormalized, now);
      changed = true;
    } else {
      next.phones = touchAlias(next.phones, channels.phone, channels.phoneNormalized, now);
    }
  }

  const displayName = maybeFillDisplayName(next.displayName, channels.displayName);
  if (displayName !== next.displayName) {
    next.displayName = displayName;
    changed = true;
  }
  const firstName = maybeFillOptional(next.firstName, channels.firstName);
  if (firstName !== next.firstName) {
    next.firstName = firstName;
    changed = true;
  }
  const lastName = maybeFillOptional(next.lastName, channels.lastName);
  if (lastName !== next.lastName) {
    next.lastName = lastName;
    changed = true;
  }

  if (changed) {
    next.updatedAt = now;
    next = await store.replace(next);
  }

  return { ok: true, outcome: "matched", persona: next };
}

export interface GrowthPersonaWriteOptions {
  eventBus?: GrowthEventBusPort;
}

export async function upsertGrowthPersona(
  store: GrowthPersonaStore,
  input: UpsertGrowthPersonaInput,
  options?: GrowthPersonaWriteOptions
): Promise<UpsertGrowthPersonaResult> {
  const tenantId = input.tenantId?.trim();
  if (!tenantId) {
    return { ok: false, reason: "missing_identity" };
  }

  const now = input.now ?? new Date().toISOString();
  const { email, emailNormalized } = normalizeGrowthEmail(input.email);
  const { phone, phoneNormalized } = normalizeGrowthPhone(input.phone);

  if (!emailNormalized && !phoneNormalized) {
    return { ok: false, reason: "missing_identity" };
  }

  const byEmail = emailNormalized
    ? await store.findByEmail(tenantId, emailNormalized)
    : null;
  const byPhone = phoneNormalized
    ? await store.findByPhone(tenantId, phoneNormalized)
    : null;

  if (byEmail && byPhone && byEmail._id !== byPhone._id) {
    const activity = await recordIdentityConflict(store, {
      tenantId,
      emailPersonaId: byEmail._id,
      phonePersonaId: byPhone._id,
      sourceCollection: input.sourceCollection ?? input.origin.sourceCollection,
      sourceId: input.sourceId ?? input.origin.sourceId,
      now,
      eventBus: options?.eventBus,
    });
    return {
      ok: false,
      reason: "identity_conflict",
      emailPersonaId: byEmail._id,
      phonePersonaId: byPhone._id,
      activity,
    };
  }

  const matched = byEmail ?? byPhone;
  if (matched) {
    // Origen inmutable: no se pasa a applyContactChannels
    return applyContactChannels(store, matched, {
      email,
      emailNormalized,
      phone,
      phoneNormalized,
      displayName: input.displayName,
      firstName: input.firstName,
      lastName: input.lastName,
      sourceCollection: input.sourceCollection ?? input.origin.sourceCollection,
      sourceId: input.sourceId ?? input.origin.sourceId,
      now,
      eventBus: options?.eventBus,
    });
  }

  const displayName = buildDisplayName({
    displayName: input.displayName,
    firstName: input.firstName,
    lastName: input.lastName,
  });

  const origin = buildGrowthOrigin(input.origin, now);
  const emails: GrowthContactAlias[] = [];
  const phones: GrowthContactAlias[] = [];
  if (email && emailNormalized) {
    emails.push({
      value: email,
      normalized: emailNormalized,
      firstSeenAt: now,
      lastSeenAt: now,
    });
  }
  if (phone && phoneNormalized) {
    phones.push({
      value: phone,
      normalized: phoneNormalized,
      firstSeenAt: now,
      lastSeenAt: now,
    });
  }

  const persona: GrowthPersona = {
    _id: newId(),
    tenantId,
    status: "active",
    displayName,
    firstName: input.firstName?.trim() || undefined,
    lastName: input.lastName?.trim() || undefined,
    email,
    emailNormalized,
    phone,
    phoneNormalized,
    emails,
    phones,
    origin,
    identityUserId: input.identityUserId,
    createdAt: now,
    updatedAt: now,
  };

  // Omitir campos undefined de email/phone para sparse unique
  if (!persona.emailNormalized) {
    delete persona.email;
    delete persona.emailNormalized;
  }
  if (!persona.phoneNormalized) {
    delete persona.phone;
    delete persona.phoneNormalized;
  }

  const created = await store.insert(persona);
  return { ok: true, outcome: "created", persona: created };
}

/**
 * Cambio posterior de email/teléfono (ADR-010 §4.2 punto 7).
 * No fusiona; conflicto si la clave ya pertenece a otra Persona del Espacio.
 */
export async function updateGrowthPersonaContact(
  store: GrowthPersonaStore,
  input: UpdateGrowthPersonaContactInput,
  options?: GrowthPersonaWriteOptions
): Promise<UpdateGrowthPersonaContactResult> {
  const tenantId = input.tenantId?.trim();
  if (!tenantId) return { ok: false, reason: "missing_identity" };

  const now = input.now ?? new Date().toISOString();
  const persona = await store.findById(tenantId, input.personaId);
  if (!persona) return { ok: false, reason: "not_found" };

  const emailNorm = normalizeGrowthEmail(input.email);
  const phoneNorm = normalizeGrowthPhone(input.phone);

  if (
    input.email !== undefined &&
    !emailNorm.emailNormalized &&
    input.phone !== undefined &&
    !phoneNorm.phoneNormalized &&
    !persona.emailNormalized &&
    !persona.phoneNormalized
  ) {
    return { ok: false, reason: "missing_identity" };
  }

  // Conflicto cruzado si ambos canales entrantes apuntan a dueños distintos
  if (emailNorm.emailNormalized && phoneNorm.phoneNormalized) {
    const byEmail = await store.findByEmail(tenantId, emailNorm.emailNormalized);
    const byPhone = await store.findByPhone(tenantId, phoneNorm.phoneNormalized);
    if (
      byEmail &&
      byPhone &&
      byEmail._id !== byPhone._id &&
      (byEmail._id !== persona._id || byPhone._id !== persona._id)
    ) {
      // Si uno es la persona actual y el otro otra → conflicto
      if (byEmail._id !== byPhone._id) {
        const activity = await recordIdentityConflict(store, {
          tenantId,
          emailPersonaId: byEmail._id,
          phonePersonaId: byPhone._id,
          sourceCollection: input.sourceCollection,
          sourceId: input.sourceId,
          now,
          eventBus: options?.eventBus,
        });
        return {
          ok: false,
          reason: "identity_conflict",
          emailPersonaId: byEmail._id,
          phonePersonaId: byPhone._id,
          activity,
        };
      }
    }
  }

  const before = JSON.stringify({
    email: persona.emailNormalized,
    phone: persona.phoneNormalized,
  });

  const result = await applyContactChannels(store, persona, {
    email: emailNorm.email,
    emailNormalized: emailNorm.emailNormalized,
    phone: phoneNorm.phone,
    phoneNormalized: phoneNorm.phoneNormalized,
    sourceCollection: input.sourceCollection,
    sourceId: input.sourceId,
    now,
    eventBus: options?.eventBus,
  });

  if (!result.ok) {
    if (result.reason !== "identity_conflict") {
      return { ok: false, reason: "missing_identity" };
    }
    return {
      ok: false,
      reason: "identity_conflict",
      emailPersonaId: result.emailPersonaId,
      phonePersonaId: result.phonePersonaId,
      activity: result.activity,
    };
  }

  const after = JSON.stringify({
    email: result.persona.emailNormalized,
    phone: result.persona.phoneNormalized,
  });

  return {
    ok: true,
    persona: result.persona,
    changed: before !== after || result.persona.updatedAt === now,
  };
}
