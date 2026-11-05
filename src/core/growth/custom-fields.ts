/**
 * Valores de campos del embudo en la oportunidad.
 * Un campo obligatorio vacío queda incompleto y no bloquea la transición.
 */

import {
  GROWTH_FUNNEL_LONG_TEXT_LIMIT,
  GROWTH_FUNNEL_TEXT_LIMIT,
  type GrowthFunnelField,
} from "./funnel-types";

export type GrowthCustomFieldValue = string | number | boolean | null;

export interface GrowthFunnelFieldFormRow {
  key: string;
  label: string;
  type: GrowthFunnelField["type"];
  required: boolean;
  help?: string;
  active: boolean;
  readOnly: boolean;
  incomplete: boolean;
  value: GrowthCustomFieldValue;
  options: Array<{ key: string; label: string; active: boolean }>;
}

function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function readCustomFieldValue(
  fields: GrowthFunnelField[],
  values: Record<string, GrowthCustomFieldValue> | undefined,
  key: string
): GrowthCustomFieldValue {
  const field = fields.find((item) => item.key === key);
  if (!field) return null;
  const value = values?.[key];
  return value === undefined ? null : value;
}

export function presentFunnelFieldRows(
  fields: GrowthFunnelField[],
  values: Record<string, GrowthCustomFieldValue> | undefined
): GrowthFunnelFieldFormRow[] {
  return fields
    .slice()
    .sort((a, b) => a.position - b.position || a.key.localeCompare(b.key))
    .flatMap((field) => {
      const value = readCustomFieldValue(fields, values, field.key);
      const hasValue = value != null && value !== "";
      if (!field.active && !hasValue) return [];
      return [
        {
          key: field.key,
          label: field.label,
          type: field.type,
          required: field.required,
          help: field.help,
          active: field.active,
          readOnly: !field.active,
          incomplete: field.active && field.required && !hasValue,
          value,
          options: (field.options ?? []).filter((option) => option.active || option.key === value),
        },
      ];
    });
}

export function incompleteFunnelFieldKeys(
  fields: GrowthFunnelField[],
  values: Record<string, GrowthCustomFieldValue> | undefined
): string[] {
  return presentFunnelFieldRows(fields, values)
    .filter((row) => row.incomplete)
    .map((row) => row.key);
}

function parseValue(
  field: GrowthFunnelField,
  raw: unknown
): { ok: true; value: GrowthCustomFieldValue } | { ok: false; reason: string } {
  if (raw == null || raw === "") return { ok: true, value: null };
  switch (field.type) {
    case "text": {
      if (typeof raw !== "string") return { ok: false, reason: "invalid_value" };
      const value = raw.trim();
      if (value.length > GROWTH_FUNNEL_TEXT_LIMIT) return { ok: false, reason: "too_long" };
      return { ok: true, value: value || null };
    }
    case "long_text": {
      if (typeof raw !== "string") return { ok: false, reason: "invalid_value" };
      const value = raw.trim();
      if (value.length > GROWTH_FUNNEL_LONG_TEXT_LIMIT) return { ok: false, reason: "too_long" };
      return { ok: true, value: value || null };
    }
    case "number": {
      const value = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isFinite(value)) return { ok: false, reason: "invalid_value" };
      return { ok: true, value };
    }
    case "date": {
      if (typeof raw !== "string" || !isDate(raw)) return { ok: false, reason: "invalid_value" };
      return { ok: true, value: raw };
    }
    case "boolean": {
      if (typeof raw !== "boolean") return { ok: false, reason: "invalid_value" };
      return { ok: true, value: raw };
    }
    case "select": {
      if (typeof raw !== "string") return { ok: false, reason: "invalid_value" };
      const option = (field.options ?? []).find((item) => item.key === raw);
      if (!option || !option.active) return { ok: false, reason: "invalid_value" };
      return { ok: true, value: option.key };
    }
    default:
      return { ok: false, reason: "invalid_value" };
  }
}

export function applyCustomFieldPatch(
  fields: GrowthFunnelField[],
  current: Record<string, GrowthCustomFieldValue> | undefined,
  patch: Record<string, unknown>
):
  | { ok: true; customFields: Record<string, GrowthCustomFieldValue>; incomplete: string[] }
  | { ok: false; reason: string; fieldKey?: string } {
  const next: Record<string, GrowthCustomFieldValue> = { ...(current ?? {}) };
  for (const [key, raw] of Object.entries(patch)) {
    const field = fields.find((item) => item.key === key);
    if (!field || !field.active) continue;
    const parsed = parseValue(field, raw);
    if (!parsed.ok) return { ok: false, reason: parsed.reason, fieldKey: key };
    if (parsed.value == null) delete next[key];
    else next[key] = parsed.value;
  }
  return {
    ok: true,
    customFields: next,
    incomplete: incompleteFunnelFieldKeys(fields, next),
  };
}
