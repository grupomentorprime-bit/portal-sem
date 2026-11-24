/**
 * OT-GROWTH-PERSONAS-IMPLEMENT-003 — capa admin delgada sobre upsertGrowthPersona.
 * Sin escritura Mongo directa, sin segundo motor de dedupe ni normalización.
 */

import {
  buildGrowthIngestKey,
  recordGrowthActivity,
  upsertGrowthPersona,
  type GrowthEventBusPort,
  type GrowthPersonaStore,
} from "@/core/growth";
import {
  CHILE_PHONE_INVALID_MESSAGE,
  normalizeChilePhone,
} from "@/lib/experience/forms/phone-chile";
import {
  GROWTH_PERSONAS_CONFLICT_MESSAGE,
  GROWTH_PERSONAS_CREATED_MESSAGE,
  GROWTH_PERSONAS_MATCHED_MESSAGE,
  GROWTH_PERSONAS_NAME_REQUIRED_MESSAGE,
  GROWTH_PERSONAS_VALIDATION_MESSAGE,
} from "./labels";

export type CreateGrowthPersonaAdminResult =
  | {
      ok: true;
      outcome: "created" | "matched";
      personaId: string;
      message: string;
    }
  | {
      ok: false;
      code: "validation" | "identity_conflict" | "error";
      message: string;
    };

export interface CreateGrowthPersonaAdminInput {
  tenantId: string;
  displayName: string;
  email?: string;
  phone?: string;
  actorUserId: string;
  now?: string;
  eventBus?: GrowthEventBusPort;
}

/**
 * Crear Persona manual vía store (testable). origin.kind = manual.
 */
export async function createGrowthPersonaWithStore(
  store: GrowthPersonaStore,
  input: CreateGrowthPersonaAdminInput
): Promise<CreateGrowthPersonaAdminResult> {
  const tenantId = input.tenantId?.trim();
  if (!tenantId) {
    return {
      ok: false,
      code: "validation",
      message: GROWTH_PERSONAS_VALIDATION_MESSAGE,
    };
  }

  const displayName = input.displayName?.trim().replace(/\s+/g, " ") ?? "";
  if (!displayName) {
    return {
      ok: false,
      code: "validation",
      message: GROWTH_PERSONAS_NAME_REQUIRED_MESSAGE,
    };
  }

  const email = input.email?.trim() || undefined;
  const phoneRaw = input.phone?.trim() || "";
  const phone = phoneRaw ? normalizeChilePhone(phoneRaw) ?? undefined : undefined;
  if (phoneRaw && !phone) {
    return {
      ok: false,
      code: "validation",
      message: CHILE_PHONE_INVALID_MESSAGE,
    };
  }
  if (!email && !phone) {
    return {
      ok: false,
      code: "validation",
      message: GROWTH_PERSONAS_VALIDATION_MESSAGE,
    };
  }

  const actorUserId = input.actorUserId?.trim() || "unknown";
  const now = input.now ?? new Date().toISOString();
  const sourceId = `manual:${actorUserId}:${now}`;

  const result = await upsertGrowthPersona(store, {
    tenantId,
    displayName,
    email,
    phone,
    origin: {
      kind: "manual",
      sourceCollection: "admin_personas",
      sourceId,
    },
    sourceCollection: "admin_personas",
    sourceId,
    now,
  });

  if (result.ok) {
    if (result.outcome === "created") {
      await recordGrowthActivity(
        store,
        {
          tenantId,
          personaId: result.persona._id,
          kind: "persona_registered",
          summary: "Registro manual.",
          ingestKey: buildGrowthIngestKey(
            "admin_personas",
            result.persona._id,
            "persona_registered"
          ),
          sourceCollection: "admin_personas",
          sourceId,
          actorUserId,
          occurredAt: now,
          payload: { originKind: "manual" },
        },
        input.eventBus ? { eventBus: input.eventBus } : undefined
      );
    }
    return {
      ok: true,
      outcome: result.outcome,
      personaId: result.persona._id,
      message:
        result.outcome === "created"
          ? GROWTH_PERSONAS_CREATED_MESSAGE
          : GROWTH_PERSONAS_MATCHED_MESSAGE,
    };
  }

  if (result.reason === "identity_conflict") {
    return {
      ok: false,
      code: "identity_conflict",
      message: GROWTH_PERSONAS_CONFLICT_MESSAGE,
    };
  }

  return {
    ok: false,
    code: "validation",
    message: GROWTH_PERSONAS_VALIDATION_MESSAGE,
  };
}

/**
 * Crear Persona manual: origin.kind = manual, Espacio activo,
 * actor autenticado (sourceId). Reutiliza únicamente upsertGrowthPersona.
 */
export async function createGrowthPersonaAdmin(
  input: CreateGrowthPersonaAdminInput
): Promise<CreateGrowthPersonaAdminResult> {
  const { getDatabase } = await import("@/lib/mongodb");
  const { createMongoGrowthPersonaStore } = await import("@/core/growth");
  const { createGrowthEventBusAdapter } = await import("./event-bus");
  const db = await getDatabase();
  const store = createMongoGrowthPersonaStore(db);
  return createGrowthPersonaWithStore(store, {
    ...input,
    eventBus: input.eventBus ?? createGrowthEventBusAdapter(),
  });
}
