/**
 * Embudo por Espacio. Un solo motor de estados: Workflow Engine.
 * Una oportunidad no cambia de embudo. organizationId queda null.
 */

import { ObjectId } from "mongodb";
import type { GrowthFunnelDirectory } from "./funnel-directory";
import {
  definitionFromStages,
  freshFunnelStages,
  initialStageKey,
  intermediateStages,
  platformDefaultStages,
  stageLabel,
  stagesFromDefinition,
  validateNewStageKey,
} from "./funnel-stages";
import { isGrowthOpportunityFinalStatus } from "./opportunity-definition";
import {
  GROWTH_FUNNEL_DEFAULT_KEY,
  GROWTH_FUNNEL_DEFAULT_NAME,
  growthOpportunityDefinitionKey,
  isGrowthFunnelResultKey,
  isGrowthFunnelSlug,
  type GrowthFunnel,
  type GrowthFunnelDefinition,
  type GrowthFunnelFailure,
  type GrowthFunnelStage,
} from "./funnel-types";
import type { GrowthOportunidad } from "./types";

function nowIso(now?: string): string {
  return now ?? new Date().toISOString();
}

function newId(): string {
  return new ObjectId().toString();
}

async function writeStages(
  directory: GrowthFunnelDirectory,
  funnel: GrowthFunnel,
  stages: GrowthFunnelStage[],
  now: string
): Promise<GrowthFunnelDefinition> {
  const current = await directory.getDefinition(
    funnel.tenantId,
    funnel.workflowDefinitionKey
  );
  const definition = definitionFromStages({
    id: current?._id ?? `wfdef_${newId()}`,
    tenantId: funnel.tenantId,
    key: funnel.workflowDefinitionKey,
    name: funnel.name,
    stages,
    version: (current?.version ?? 0) + 1,
  });
  await directory.saveDefinition(definition);
  await directory.saveFunnel({ ...funnel, updatedAt: now });
  return definition;
}

export async function listGrowthFunnelStages(
  directory: GrowthFunnelDirectory,
  tenantId: string,
  funnelKey: string
): Promise<GrowthFunnelStage[] | null> {
  const funnel = await directory.findFunnel(tenantId, funnelKey);
  if (!funnel) return null;
  const definition = await directory.getDefinition(
    tenantId,
    funnel.workflowDefinitionKey
  );
  return stagesFromDefinition(definition);
}

export async function growthFunnelInitialKeys(
  directory: GrowthFunnelDirectory,
  tenantId: string
): Promise<Record<string, string>> {
  const funnels = await directory.listFunnels(tenantId);
  const map: Record<string, string> = {};
  for (const funnel of funnels) {
    const definition = await directory.getDefinition(
      tenantId,
      funnel.workflowDefinitionKey
    );
    map[funnel.key] = initialStageKey(stagesFromDefinition(definition));
  }
  if (!map.default) map.default = "open";
  return map;
}

export async function ensureGrowthFunnelsForTenant(
  directory: GrowthFunnelDirectory,
  tenantId: string,
  now?: string
): Promise<GrowthFunnel> {
  const at = nowIso(now);
  const existing = await directory.findFunnel(tenantId, GROWTH_FUNNEL_DEFAULT_KEY);
  const funnel =
    existing ??
    (await createDefaultFunnel(directory, tenantId, at));
  await backfillOpportunities(directory, tenantId);
  await retargetLegacyInstances(directory, tenantId, funnel);
  return funnel;
}

async function createDefaultFunnel(
  directory: GrowthFunnelDirectory,
  tenantId: string,
  now: string
): Promise<GrowthFunnel> {
  const legacy = await directory.getDefinition(tenantId, "growth.opportunity");
  const stages = legacy ? stagesFromDefinition(legacy) : platformDefaultStages();
  const funnel: GrowthFunnel = {
    _id: newId(),
    tenantId,
    key: GROWTH_FUNNEL_DEFAULT_KEY,
    name: GROWTH_FUNNEL_DEFAULT_NAME,
    status: "active",
    isDefault: true,
    workflowDefinitionKey: growthOpportunityDefinitionKey(GROWTH_FUNNEL_DEFAULT_KEY),
    fields: [],
    createdAt: now,
    updatedAt: now,
  };
  await directory.saveFunnel(funnel);
  await writeStages(directory, funnel, stages, now);
  return funnel;
}

async function backfillOpportunities(
  directory: GrowthFunnelDirectory,
  tenantId: string
): Promise<void> {
  const opportunities = await directory.listOpportunities(tenantId);
  for (const oportunidad of opportunities) {
    if (oportunidad.tenantId !== tenantId) continue;
    const stored = oportunidad as GrowthOportunidad & {
      funnelKey?: string;
      organizationId?: string | null;
    };
    const funnelKey = stored.funnelKey?.trim();
    if (funnelKey && stored.organizationId !== undefined) continue;
    await directory.saveOpportunity({
      ...oportunidad,
      funnelKey: funnelKey || GROWTH_FUNNEL_DEFAULT_KEY,
      organizationId: funnelKey ? (stored.organizationId ?? null) : null,
    });
  }
}

async function retargetLegacyInstances(
  directory: GrowthFunnelDirectory,
  tenantId: string,
  funnel: GrowthFunnel
): Promise<void> {
  const definition = await directory.getDefinition(
    tenantId,
    funnel.workflowDefinitionKey
  );
  if (!definition) return;
  const instances = await directory.listOpportunityInstances(tenantId);
  for (const instance of instances) {
    if (instance.tenantId !== tenantId) continue;
    if (instance.definitionKey !== "growth.opportunity") continue;
    await directory.retargetInstance(
      tenantId,
      instance._id,
      definition._id,
      funnel.workflowDefinitionKey
    );
  }
}

export async function createGrowthFunnel(
  directory: GrowthFunnelDirectory,
  input: { tenantId: string; key: string; name: string; now?: string }
): Promise<{ ok: true; funnel: GrowthFunnel } | { ok: false; reason: GrowthFunnelFailure }> {
  const tenantId = input.tenantId.trim();
  const key = input.key.trim();
  const name = input.name.trim();
  if (!tenantId || !isGrowthFunnelSlug(key) || !name) {
    return { ok: false, reason: "invalid_key" };
  }
  if (await directory.findFunnel(tenantId, key)) {
    return { ok: false, reason: "duplicate_key" };
  }
  const now = nowIso(input.now);
  const siblings = await directory.listFunnels(tenantId);
  const funnel: GrowthFunnel = {
    _id: newId(),
    tenantId,
    key,
    name,
    status: "active",
    isDefault: !siblings.some((item) => item.isDefault && item.status === "active"),
    workflowDefinitionKey: growthOpportunityDefinitionKey(key),
    fields: [],
    createdAt: now,
    updatedAt: now,
  };
  await directory.saveFunnel(funnel);
  await writeStages(directory, funnel, freshFunnelStages(), now);
  return { ok: true, funnel };
}

export async function renameGrowthFunnel(
  directory: GrowthFunnelDirectory,
  input: { tenantId: string; key: string; name: string; now?: string }
): Promise<{ ok: true; funnel: GrowthFunnel } | { ok: false; reason: GrowthFunnelFailure }> {
  const funnel = await directory.findFunnel(input.tenantId, input.key);
  if (!funnel || funnel.tenantId !== input.tenantId) return { ok: false, reason: "not_found" };
  const name = input.name.trim();
  if (!name) return { ok: false, reason: "invalid_key" };
  const now = nowIso(input.now);
  const next = { ...funnel, name, updatedAt: now };
  await directory.saveFunnel(next);
  const stages = await listGrowthFunnelStages(directory, input.tenantId, input.key);
  if (stages) await writeStages(directory, next, stages, now);
  return { ok: true, funnel: next };
}

export async function archiveGrowthFunnel(
  directory: GrowthFunnelDirectory,
  input: { tenantId: string; key: string; now?: string }
): Promise<{ ok: true; funnel: GrowthFunnel } | { ok: false; reason: GrowthFunnelFailure }> {
  const funnel = await directory.findFunnel(input.tenantId, input.key);
  if (!funnel || funnel.tenantId !== input.tenantId) return { ok: false, reason: "not_found" };
  if (funnel.isDefault) return { ok: false, reason: "default_required" };
  const open = await directory.countNonFinal(input.tenantId, funnel.key);
  if (open > 0) return { ok: false, reason: "open_opportunities" };
  const now = nowIso(input.now);
  const next = { ...funnel, status: "archived" as const, updatedAt: now };
  await directory.saveFunnel(next);
  return { ok: true, funnel: next };
}

export async function makeDefaultGrowthFunnel(
  directory: GrowthFunnelDirectory,
  input: { tenantId: string; key: string; now?: string }
): Promise<{ ok: true; funnel: GrowthFunnel } | { ok: false; reason: GrowthFunnelFailure }> {
  const funnel = await directory.findFunnel(input.tenantId, input.key);
  if (!funnel || funnel.tenantId !== input.tenantId) return { ok: false, reason: "not_found" };
  if (funnel.status !== "active") return { ok: false, reason: "archived" };
  const now = nowIso(input.now);
  const funnels = await directory.listFunnels(input.tenantId);
  for (const item of funnels) {
    if (item.tenantId !== input.tenantId) continue;
    if (!item.isDefault || item.key === funnel.key) continue;
    await directory.saveFunnel({ ...item, isDefault: false, updatedAt: now });
  }
  const next = { ...funnel, isDefault: true, updatedAt: now };
  await directory.saveFunnel(next);
  return { ok: true, funnel: next };
}

export async function createGrowthFunnelStage(
  directory: GrowthFunnelDirectory,
  input: { tenantId: string; funnelKey: string; key: string; label: string; now?: string }
): Promise<{ ok: true; stages: GrowthFunnelStage[] } | { ok: false; reason: GrowthFunnelFailure }> {
  const funnel = await directory.findFunnel(input.tenantId, input.funnelKey);
  if (!funnel || funnel.tenantId !== input.tenantId) return { ok: false, reason: "not_found" };
  const stages = stagesFromDefinition(
    await directory.getDefinition(input.tenantId, funnel.workflowDefinitionKey)
  );
  const key = input.key.trim();
  const invalid = validateNewStageKey(stages, key);
  if (invalid) return { ok: false, reason: invalid };
  const label = input.label.trim();
  if (!label) return { ok: false, reason: "invalid_key" };
  const position =
    intermediateStages(stages).reduce((max, stage) => Math.max(max, stage.position), -1) + 1;
  const next = [
    ...stages,
    {
      key,
      label,
      position,
      active: true,
      isInitial: false,
      isResult: false,
    },
  ];
  const definition = await writeStages(directory, funnel, next, nowIso(input.now));
  return { ok: true, stages: stagesFromDefinition(definition) };
}

export async function renameGrowthFunnelStage(
  directory: GrowthFunnelDirectory,
  input: { tenantId: string; funnelKey: string; stageKey: string; label: string; now?: string }
): Promise<{ ok: true; stages: GrowthFunnelStage[] } | { ok: false; reason: GrowthFunnelFailure }> {
  const funnel = await directory.findFunnel(input.tenantId, input.funnelKey);
  if (!funnel || funnel.tenantId !== input.tenantId) return { ok: false, reason: "not_found" };
  if (isGrowthFunnelResultKey(input.stageKey)) {
    return { ok: false, reason: "cannot_rename_result" };
  }
  const stages = stagesFromDefinition(
    await directory.getDefinition(input.tenantId, funnel.workflowDefinitionKey)
  );
  const label = input.label.trim();
  if (!label) return { ok: false, reason: "invalid_key" };
  const current = stages.find((stage) => stage.key === input.stageKey);
  if (!current || current.isResult) return { ok: false, reason: "not_found" };
  const next = stages.map((stage) =>
    stage.key === input.stageKey ? { ...stage, label } : stage
  );
  const definition = await writeStages(directory, funnel, next, nowIso(input.now));
  return { ok: true, stages: stagesFromDefinition(definition) };
}

export async function reorderGrowthFunnelStage(
  directory: GrowthFunnelDirectory,
  input: {
    tenantId: string;
    funnelKey: string;
    stageKey: string;
    direction: "up" | "down";
    now?: string;
  }
): Promise<{ ok: true; stages: GrowthFunnelStage[] } | { ok: false; reason: GrowthFunnelFailure }> {
  const funnel = await directory.findFunnel(input.tenantId, input.funnelKey);
  if (!funnel || funnel.tenantId !== input.tenantId) return { ok: false, reason: "not_found" };
  const stages = stagesFromDefinition(
    await directory.getDefinition(input.tenantId, funnel.workflowDefinitionKey)
  );
  const ordered = intermediateStages(stages);
  const index = ordered.findIndex((stage) => stage.key === input.stageKey);
  if (index < 0) return { ok: false, reason: "not_intermediate" };
  const swap = input.direction === "up" ? index - 1 : index + 1;
  if (swap < 0 || swap >= ordered.length) {
    return { ok: true, stages };
  }
  const moved = ordered.slice();
  const [item] = moved.splice(index, 1);
  moved.splice(swap, 0, item!);
  const positioned = moved.map((stage, position) => ({ ...stage, position }));
  const definition = await writeStages(
    directory,
    funnel,
    [...positioned, ...stages.filter((stage) => stage.isResult)],
    nowIso(input.now)
  );
  return { ok: true, stages: stagesFromDefinition(definition) };
}

export async function deactivateGrowthFunnelStage(
  directory: GrowthFunnelDirectory,
  input: { tenantId: string; funnelKey: string; stageKey: string; now?: string }
): Promise<{ ok: true; stages: GrowthFunnelStage[] } | { ok: false; reason: GrowthFunnelFailure }> {
  const funnel = await directory.findFunnel(input.tenantId, input.funnelKey);
  if (!funnel || funnel.tenantId !== input.tenantId) return { ok: false, reason: "not_found" };
  if (isGrowthFunnelResultKey(input.stageKey)) {
    return { ok: false, reason: "cannot_deactivate_result" };
  }
  const stages = stagesFromDefinition(
    await directory.getDefinition(input.tenantId, funnel.workflowDefinitionKey)
  );
  const current = stages.find((stage) => stage.key === input.stageKey && !stage.isResult);
  if (!current) return { ok: false, reason: "not_found" };
  if (current.isInitial) return { ok: false, reason: "cannot_deactivate_initial" };
  const active = intermediateStages(stages).filter((stage) => stage.active);
  if (current.active && active.length <= 1) {
    return { ok: false, reason: "cannot_deactivate_last_active" };
  }
  const next = stages.map((stage) =>
    stage.key === input.stageKey ? { ...stage, active: false } : stage
  );
  const definition = await writeStages(directory, funnel, next, nowIso(input.now));
  return { ok: true, stages: stagesFromDefinition(definition) };
}

export function availableGrowthFunnelTransitions(
  stages: GrowthFunnelStage[],
  fromState: string
): Array<{ id: string; toState: string; label: string }> {
  const definition = definitionFromStages({
    id: "virtual",
    tenantId: "virtual",
    key: "virtual",
    name: "virtual",
    stages,
  });
  return definition.transitions
    .filter((transition) => transition.fromState === fromState)
    .map((transition) => ({
      id: transition.id,
      toState: transition.toState,
      label: stageLabel(stages, transition.toState),
    }));
}

export function opportunityMatchesFunnel(
  oportunidad: Pick<GrowthOportunidad, "funnelKey" | "tenantId">,
  tenantId: string,
  funnelKey?: string
): boolean {
  if (oportunidad.tenantId !== tenantId) return false;
  if (!funnelKey) return true;
  return (oportunidad.funnelKey || GROWTH_FUNNEL_DEFAULT_KEY) === funnelKey;
}

export function isReusableOpportunity(
  oportunidad: Pick<GrowthOportunidad, "status" | "funnelKey" | "tenantId">,
  tenantId: string,
  funnelKey: string
): boolean {
  return (
    opportunityMatchesFunnel(oportunidad, tenantId, funnelKey) &&
    !isGrowthOpportunityFinalStatus(oportunidad.status)
  );
}

export async function resolveCaptureFunnelKey(
  directory: GrowthFunnelDirectory,
  tenantId: string,
  requested?: string
): Promise<string | null> {
  await ensureGrowthFunnelsForTenant(directory, tenantId);
  const key = requested?.trim() || GROWTH_FUNNEL_DEFAULT_KEY;
  const funnel = await directory.findFunnel(tenantId, key);
  if (!funnel || funnel.tenantId !== tenantId || funnel.status !== "active") return null;
  if (!requested?.trim() && !funnel.isDefault) {
    const funnels = await directory.listFunnels(tenantId);
    const preferred = funnels.find(
      (item) => item.tenantId === tenantId && item.isDefault && item.status === "active"
    );
    return preferred?.key ?? null;
  }
  return funnel.key;
}
