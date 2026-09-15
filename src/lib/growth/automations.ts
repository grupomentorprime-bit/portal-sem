/**
 * OT-GROWTH-AUTOMATION-002 / E2E-FIX-001 — fachada server-only sobre Mongo (definiciones).
 * Runtime: automations-runtime.ts (AUTOMATION-003).
 * ensure de playbook de arranque al listar (Espacios existentes).
 */

import "server-only";

import {
  createGrowthAutomation,
  createMongoGrowthAutomationStore,
  ensureGrowthAutomationIndexes,
  ensureGrowthStartupNextActionAutomation,
  getGrowthAutomation,
  listGrowthAutomations,
  publishGrowthAutomation,
  setGrowthAutomationActive,
  updateGrowthAutomationDraft,
  type AutomationActor,
} from "@/core/growth/automations";
import { getDatabase } from "@/lib/mongodb";

async function store() {
  const db = await getDatabase();
  return createMongoGrowthAutomationStore(db);
}

/** Ensure idempotente del playbook de arranque (fail-soft). */
async function ensureStartupSeed(tenantId: string): Promise<void> {
  try {
    const db = await getDatabase();
    await ensureGrowthAutomationIndexes(db);
    await ensureGrowthStartupNextActionAutomation(
      createMongoGrowthAutomationStore(db),
      tenantId
    );
  } catch (error) {
    console.error(
      "[Growth] startup nextAction ensure failed",
      tenantId,
      error instanceof Error ? error.message : error
    );
  }
}

export async function automationsList(tenantId: string) {
  await ensureStartupSeed(tenantId);
  return listGrowthAutomations(await store(), tenantId);
}

export async function automationsGet(tenantId: string, automationId: string) {
  return getGrowthAutomation(await store(), { tenantId, automationId });
}

export async function automationsCreate(input: {
  tenantId: string;
  name: string;
  steps: unknown;
  actor: AutomationActor;
}) {
  return createGrowthAutomation(await store(), input);
}

export async function automationsUpdateDraft(input: {
  tenantId: string;
  automationId: string;
  name?: string;
  steps?: unknown;
  actor: AutomationActor;
}) {
  return updateGrowthAutomationDraft(await store(), input);
}

export async function automationsPublish(input: {
  tenantId: string;
  automationId: string;
  actor: AutomationActor;
}) {
  return publishGrowthAutomation(await store(), input);
}

export async function automationsSetActive(input: {
  tenantId: string;
  automationId: string;
  active: boolean;
  actor: AutomationActor;
}) {
  return setGrowthAutomationActive(await store(), input);
}
