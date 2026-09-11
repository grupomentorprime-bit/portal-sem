/**
 * OT-GROWTH-AUTOMATION-002 — fachada server-only sobre Mongo (definiciones).
 * Runtime: automations-runtime.ts (AUTOMATION-003).
 */

import "server-only";

import {
  createGrowthAutomation,
  createMongoGrowthAutomationStore,
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

export async function automationsList(tenantId: string) {
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
