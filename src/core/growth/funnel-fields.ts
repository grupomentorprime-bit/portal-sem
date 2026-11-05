/**
 * Campos del embudo. No viven en el workflow ni disparan transiciones.
 */

import type { GrowthFunnelDirectory } from "./funnel-directory";
import {
  GROWTH_FUNNEL_FIELD_LIMIT,
  GROWTH_FUNNEL_FIELD_TYPES,
  GROWTH_FUNNEL_SELECT_OPTION_LIMIT,
  isGrowthFunnelSlug,
  type GrowthFunnel,
  type GrowthFunnelField,
  type GrowthFunnelFieldOption,
  type GrowthFunnelFieldType,
} from "./funnel-types";

export type GrowthFunnelFieldFailure =
  | "not_found"
  | "invalid_key"
  | "duplicate_key"
  | "limit"
  | "type_locked"
  | "invalid_type"
  | "invalid_options"
  | "archived";

function nowIso(now?: string): string {
  return now ?? new Date().toISOString();
}

function fieldsOf(funnel: GrowthFunnel): GrowthFunnelField[] {
  return (funnel.fields ?? []).slice().sort((a, b) => a.position - b.position || a.key.localeCompare(b.key));
}

async function loadFunnel(
  directory: GrowthFunnelDirectory,
  tenantId: string,
  funnelKey: string
): Promise<GrowthFunnel | null> {
  const funnel = await directory.findFunnel(tenantId, funnelKey);
  if (!funnel || funnel.tenantId !== tenantId) return null;
  return funnel;
}

function optionList(
  raw: Array<{ key: string; label: string }> | undefined
): GrowthFunnelFieldOption[] | null {
  if (!raw) return [];
  if (raw.length > GROWTH_FUNNEL_SELECT_OPTION_LIMIT) return null;
  const seen = new Set<string>();
  const options: GrowthFunnelFieldOption[] = [];
  for (const item of raw) {
    const key = item.key.trim();
    const label = item.label.trim();
    if (!isGrowthFunnelSlug(key) || !label || seen.has(key)) return null;
    seen.add(key);
    options.push({ key, label, active: true });
  }
  return options;
}

export async function createGrowthFunnelField(
  directory: GrowthFunnelDirectory,
  input: {
    tenantId: string;
    funnelKey: string;
    key: string;
    label: string;
    type: string;
    required?: boolean;
    help?: string;
    options?: Array<{ key: string; label: string }>;
    now?: string;
  }
): Promise<{ ok: true; funnel: GrowthFunnel } | { ok: false; reason: GrowthFunnelFieldFailure }> {
  const funnel = await loadFunnel(directory, input.tenantId, input.funnelKey);
  if (!funnel) return { ok: false, reason: "not_found" };
  if (funnel.status === "archived") return { ok: false, reason: "archived" };
  const key = input.key.trim();
  const label = input.label.trim();
  if (!isGrowthFunnelSlug(key) || !label) return { ok: false, reason: "invalid_key" };
  if (!(GROWTH_FUNNEL_FIELD_TYPES as readonly string[]).includes(input.type)) {
    return { ok: false, reason: "invalid_type" };
  }
  const current = fieldsOf(funnel);
  if (current.length >= GROWTH_FUNNEL_FIELD_LIMIT) return { ok: false, reason: "limit" };
  if (current.some((field) => field.key === key)) return { ok: false, reason: "duplicate_key" };
  const type = input.type as GrowthFunnelFieldType;
  const options = type === "select" ? optionList(input.options) : [];
  if (options == null) return { ok: false, reason: "invalid_options" };
  if (type === "select" && options.length === 0) return { ok: false, reason: "invalid_options" };
  const help = input.help?.trim();
  const field: GrowthFunnelField = {
    key,
    label,
    type,
    required: Boolean(input.required),
    position: current.length,
    active: true,
    ...(type === "select" ? { options } : {}),
    ...(help ? { help: help.slice(0, 200) } : {}),
  };
  const next = {
    ...funnel,
    fields: [...current, field],
    updatedAt: nowIso(input.now),
  };
  await directory.saveFunnel(next);
  return { ok: true, funnel: next };
}

export async function renameGrowthFunnelField(
  directory: GrowthFunnelDirectory,
  input: {
    tenantId: string;
    funnelKey: string;
    fieldKey: string;
    label: string;
    help?: string;
    now?: string;
  }
): Promise<{ ok: true; funnel: GrowthFunnel } | { ok: false; reason: GrowthFunnelFieldFailure }> {
  const funnel = await loadFunnel(directory, input.tenantId, input.funnelKey);
  if (!funnel) return { ok: false, reason: "not_found" };
  const label = input.label.trim();
  if (!label) return { ok: false, reason: "invalid_key" };
  const current = fieldsOf(funnel);
  const index = current.findIndex((field) => field.key === input.fieldKey);
  if (index < 0) return { ok: false, reason: "not_found" };
  const help = input.help?.trim();
  current[index] = {
    ...current[index],
    label,
    ...(help ? { help: help.slice(0, 200) } : { help: undefined }),
  };
  const next = { ...funnel, fields: current, updatedAt: nowIso(input.now) };
  await directory.saveFunnel(next);
  return { ok: true, funnel: next };
}

export async function reorderGrowthFunnelFields(
  directory: GrowthFunnelDirectory,
  input: {
    tenantId: string;
    funnelKey: string;
    fieldKey: string;
    direction: "up" | "down";
    now?: string;
  }
): Promise<{ ok: true; funnel: GrowthFunnel } | { ok: false; reason: GrowthFunnelFieldFailure }> {
  const funnel = await loadFunnel(directory, input.tenantId, input.funnelKey);
  if (!funnel) return { ok: false, reason: "not_found" };
  const current = fieldsOf(funnel);
  const index = current.findIndex((field) => field.key === input.fieldKey);
  if (index < 0) return { ok: false, reason: "not_found" };
  const swap = input.direction === "up" ? index - 1 : index + 1;
  if (swap < 0 || swap >= current.length) return { ok: true, funnel };
  const nextFields = current.slice();
  const [item] = nextFields.splice(index, 1);
  nextFields.splice(swap, 0, item);
  const positioned = nextFields.map((field, position) => ({ ...field, position }));
  const next = { ...funnel, fields: positioned, updatedAt: nowIso(input.now) };
  await directory.saveFunnel(next);
  return { ok: true, funnel: next };
}

export async function deactivateGrowthFunnelField(
  directory: GrowthFunnelDirectory,
  input: { tenantId: string; funnelKey: string; fieldKey: string; now?: string }
): Promise<{ ok: true; funnel: GrowthFunnel } | { ok: false; reason: GrowthFunnelFieldFailure }> {
  const funnel = await loadFunnel(directory, input.tenantId, input.funnelKey);
  if (!funnel) return { ok: false, reason: "not_found" };
  const current = fieldsOf(funnel);
  const index = current.findIndex((field) => field.key === input.fieldKey);
  if (index < 0) return { ok: false, reason: "not_found" };
  current[index] = { ...current[index], active: false };
  const next = { ...funnel, fields: current, updatedAt: nowIso(input.now) };
  await directory.saveFunnel(next);
  return { ok: true, funnel: next };
}

export async function addGrowthFunnelFieldOption(
  directory: GrowthFunnelDirectory,
  input: {
    tenantId: string;
    funnelKey: string;
    fieldKey: string;
    key: string;
    label: string;
    now?: string;
  }
): Promise<{ ok: true; funnel: GrowthFunnel } | { ok: false; reason: GrowthFunnelFieldFailure }> {
  const funnel = await loadFunnel(directory, input.tenantId, input.funnelKey);
  if (!funnel) return { ok: false, reason: "not_found" };
  const current = fieldsOf(funnel);
  const index = current.findIndex((field) => field.key === input.fieldKey);
  if (index < 0) return { ok: false, reason: "not_found" };
  const field = current[index];
  if (field.type !== "select") return { ok: false, reason: "invalid_type" };
  const key = input.key.trim();
  const label = input.label.trim();
  if (!isGrowthFunnelSlug(key) || !label) return { ok: false, reason: "invalid_key" };
  const options = field.options ?? [];
  if (options.length >= GROWTH_FUNNEL_SELECT_OPTION_LIMIT) return { ok: false, reason: "limit" };
  if (options.some((option) => option.key === key)) return { ok: false, reason: "duplicate_key" };
  current[index] = { ...field, options: [...options, { key, label, active: true }] };
  const next = { ...funnel, fields: current, updatedAt: nowIso(input.now) };
  await directory.saveFunnel(next);
  return { ok: true, funnel: next };
}

export async function patchGrowthFunnelFieldOption(
  directory: GrowthFunnelDirectory,
  input: {
    tenantId: string;
    funnelKey: string;
    fieldKey: string;
    optionKey: string;
    label?: string;
    active?: boolean;
    now?: string;
  }
): Promise<{ ok: true; funnel: GrowthFunnel } | { ok: false; reason: GrowthFunnelFieldFailure }> {
  const funnel = await loadFunnel(directory, input.tenantId, input.funnelKey);
  if (!funnel) return { ok: false, reason: "not_found" };
  const current = fieldsOf(funnel);
  const index = current.findIndex((field) => field.key === input.fieldKey);
  if (index < 0) return { ok: false, reason: "not_found" };
  const field = current[index];
  const options = (field.options ?? []).slice();
  const optionIndex = options.findIndex((option) => option.key === input.optionKey);
  if (optionIndex < 0) return { ok: false, reason: "not_found" };
  const label = input.label?.trim();
  if (input.label != null && !label) return { ok: false, reason: "invalid_key" };
  options[optionIndex] = {
    ...options[optionIndex],
    ...(label ? { label } : {}),
    ...(input.active != null ? { active: input.active } : {}),
  };
  current[index] = { ...field, options };
  const next = { ...funnel, fields: current, updatedAt: nowIso(input.now) };
  await directory.saveFunnel(next);
  return { ok: true, funnel: next };
}
