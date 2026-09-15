/**
 * OT-GROWTH-PERSONAS-IMPLEMENT-003 — capa admin delgada sobre upsertGrowthPersona.
 * Sin escritura Mongo directa, sin segundo motor de dedupe ni normalización.
 */

import {
  upsertGrowthPersona,
  type GrowthPersonaStore,
} from "@/core/growth";
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
  const phone = input.phone?.trim() || undefined;
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
  const db = await getDatabase();
  const store = createMongoGrowthPersonaStore(db);
  return createGrowthPersonaWithStore(store, input);
}
