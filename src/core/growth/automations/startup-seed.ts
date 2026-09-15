/**
 * OT-GROWTH-E2E-FIX-001 — playbook de arranque por Espacio (opción B).
 * GrowthOpportunityOpened → nextAction absent → salesSetNextAction.
 * Idempotente: seedKey estable; no recrea ni reactiva si el cliente la editó/apagó.
 */

import type { Db } from "mongodb";
import { TENANTS_COLLECTION } from "@/core/tenant/constants";
import type { TenantDocument } from "@/core/tenant/types";
import {
  createGrowthAutomation,
  publishGrowthAutomation,
} from "./service";
import { createMongoGrowthAutomationStore } from "./repository";
import type { GrowthAutomationStore } from "./store";
import {
  GROWTH_PLATFORM_SEED_ACTOR,
  GROWTH_STARTUP_NEXT_ACTION_AUTOMATION_NAME,
  GROWTH_STARTUP_NEXT_ACTION_SEED_KEY,
  GROWTH_STARTUP_NEXT_ACTION_SUMMARY,
  type GrowthAutomation,
  type GrowthAutomationStep,
} from "./types";

export const GROWTH_STARTUP_NEXT_ACTION_STEPS: GrowthAutomationStep[] = [
  {
    kind: "trigger",
    eventTypes: ["GrowthOpportunityOpened"],
  },
  {
    kind: "condition",
    rules: [{ field: "nextAction", op: "absent" }],
  },
  {
    kind: "action",
    action: "salesSetNextAction",
    summary: GROWTH_STARTUP_NEXT_ACTION_SUMMARY,
    nextActionKind: "contact",
  },
];

export type EnsureGrowthStartupNextActionResult =
  | {
      ok: true;
      automation: GrowthAutomation;
      created: boolean;
    }
  | {
      ok: false;
      error: string;
      detail?: string;
    };

/**
 * Asegura la Automatización de arranque del Espacio.
 * Si ya existe por seedKey → la devuelve sin mutar (respeta edición/renombre/desactivación).
 * Si no existe → create + publish (active + published).
 */
export async function ensureGrowthStartupNextActionAutomation(
  store: GrowthAutomationStore,
  tenantId: string,
  now?: string
): Promise<EnsureGrowthStartupNextActionResult> {
  const tid = tenantId.trim();
  if (!tid) {
    return { ok: false, error: "tenantId obligatorio." };
  }

  const existing = await store.findAutomationBySeedKey(
    tid,
    GROWTH_STARTUP_NEXT_ACTION_SEED_KEY
  );
  if (existing) {
    return { ok: true, automation: existing, created: false };
  }

  const actor = { userId: GROWTH_PLATFORM_SEED_ACTOR };

  let created;
  try {
    created = await createGrowthAutomation(store, {
      tenantId: tid,
      name: GROWTH_STARTUP_NEXT_ACTION_AUTOMATION_NAME,
      steps: GROWTH_STARTUP_NEXT_ACTION_STEPS,
      actor,
      seedKey: GROWTH_STARTUP_NEXT_ACTION_SEED_KEY,
      now,
    });
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code === 11000) {
      const raced = await store.findAutomationBySeedKey(
        tid,
        GROWTH_STARTUP_NEXT_ACTION_SEED_KEY
      );
      if (raced) return { ok: true, automation: raced, created: false };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  if (!created.ok) {
    // Carrera: otro ensure insertó el mismo seedKey → re-leer y respetar.
    if (created.code === "conflict") {
      const raced = await store.findAutomationBySeedKey(
        tid,
        GROWTH_STARTUP_NEXT_ACTION_SEED_KEY
      );
      if (raced) return { ok: true, automation: raced, created: false };
    }
    return {
      ok: false,
      error: created.error,
      detail: "code" in created ? created.code : undefined,
    };
  }

  const published = await publishGrowthAutomation(store, {
    tenantId: tid,
    automationId: created.automation._id,
    actor,
    now,
  });
  if (!published.ok) {
    return {
      ok: false,
      error: published.error,
      detail: published.code,
    };
  }
  return { ok: true, automation: published.automation, created: true };
}

/**
 * Backfill idempotente: asegura el playbook en todos los Espacios existentes.
 * No toca producción a mano; se invoca desde migración / ensure paths.
 */
export async function backfillGrowthStartupNextActionAutomations(
  db: Db
): Promise<{
  tenants: number;
  created: number;
  existing: number;
  failed: number;
  details: string[];
}> {
  const store = createMongoGrowthAutomationStore(db);
  const tenants = await db
    .collection<TenantDocument>(TENANTS_COLLECTION)
    .find({}, { projection: { tenantId: 1 } })
    .toArray();

  let created = 0;
  let existing = 0;
  let failed = 0;
  const details: string[] = [];

  for (const tenant of tenants) {
    const tenantId = (tenant.tenantId || tenant._id || "").trim();
    if (!tenantId) continue;
    const result = await ensureGrowthStartupNextActionAutomation(
      store,
      tenantId
    );
    if (!result.ok) {
      failed += 1;
      details.push(`fail tenant=${tenantId}: ${result.error}`);
      continue;
    }
    if (result.created) {
      created += 1;
      details.push(`created tenant=${tenantId} id=${result.automation._id}`);
    } else {
      existing += 1;
    }
  }

  return {
    tenants: tenants.length,
    created,
    existing,
    failed,
    details,
  };
}
