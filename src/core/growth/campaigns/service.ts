/**
 * OT-GROWTH-CAMPAIGNS-003 — operaciones de configuración Campañas V1.
 * Crear / editar draft / activar / terminar. Sin envío masivo ni runner propio.
 */

import { generateId } from "@/core/identity/auth/crypto";
import type { GrowthCampaignStore } from "./store";
import type {
  GrowthCampaign,
  GrowthCampaignAudience,
  GrowthCampaignAudienceFilter,
  GrowthCampaignSource,
  GrowthCampaignStatus,
} from "./types";
import { GROWTH_CAMPAIGN_STATUSES } from "./types";

export type CampaignActor = {
  userId: string;
};

/** Validación de FKs lógicas en el mismo Espacio (inyectable). */
export type CampaignRefsPort = {
  formExists(tenantId: string, formId: string): Promise<boolean>;
  automationExists(tenantId: string, automationId: string): Promise<boolean>;
};

export type CampaignServiceError =
  | { ok: false; code: "not_found"; error: string }
  | { ok: false; code: "validation"; error: string; detail?: string }
  | { ok: false; code: "conflict"; error: string }
  | { ok: false; code: "active_form_conflict"; error: string }
  | { ok: false; code: "form_not_found"; error: string }
  | { ok: false; code: "automation_not_found"; error: string }
  | { ok: false; code: "tracking_key_immutable"; error: string }
  | { ok: false; code: "invalid_transition"; error: string }
  | { ok: false; code: "tracking_key_taken"; error: string };

const TRACKING_KEY_RE = /^[a-z0-9][a-z0-9-_]*$/;
const OBJECTIVE_MAX = 200;
const NAME_MAX = 120;

function nowIso(now?: string) {
  return now ?? new Date().toISOString();
}

function requireName(name: unknown): string | null {
  if (typeof name !== "string" || !name.trim()) return null;
  const trimmed = name.trim();
  if (trimmed.length > NAME_MAX) return null;
  return trimmed;
}

function requireObjective(objective: unknown): string | null {
  if (typeof objective !== "string" || !objective.trim()) return null;
  const trimmed = objective.trim();
  if (trimmed.length > OBJECTIVE_MAX) return null;
  return trimmed;
}

function requireTrackingKey(key: unknown): string | null {
  if (typeof key !== "string" || !key.trim()) return null;
  const trimmed = key.trim().toLowerCase();
  if (!TRACKING_KEY_RE.test(trimmed) || trimmed.length > 64) return null;
  return trimmed;
}

function isIsoOptional(value: unknown): value is string | undefined {
  if (value === undefined || value === null || value === "") return true;
  if (typeof value !== "string") return false;
  return !Number.isNaN(Date.parse(value));
}

function parseSource(raw: unknown): GrowthCampaignSource | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const kind = (raw as { kind?: unknown }).kind;
  const pageIdRaw = (raw as { pageId?: unknown }).pageId;
  const pageId =
    typeof pageIdRaw === "string" && pageIdRaw.trim()
      ? pageIdRaw.trim()
      : undefined;

  if (kind === "none") {
    return pageId ? { kind: "none", pageId } : { kind: "none" };
  }
  if (kind === "form") {
    const formId = (raw as { formId?: unknown }).formId;
    if (typeof formId !== "string" || !formId.trim()) return null;
    return pageId
      ? { kind: "form", formId: formId.trim(), pageId }
      : { kind: "form", formId: formId.trim() };
  }
  return null;
}

const AUDIENCE_FIELDS = new Set([
  "typeKey",
  "status",
  "origin.kind",
  "origin.channel",
  "origin.formId",
  "origin.campaign",
]);

function parseAudience(raw: unknown): GrowthCampaignAudience | null | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== "object" || Array.isArray(raw)) return null;
  const filtersRaw = (raw as { filters?: unknown }).filters;
  if (!Array.isArray(filtersRaw)) return null;
  const filters: GrowthCampaignAudienceFilter[] = [];
  for (const item of filtersRaw) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return null;
    }
    const field = (item as { field?: unknown }).field;
    const op = (item as { op?: unknown }).op;
    const value = (item as { value?: unknown }).value;
    if (
      typeof field !== "string" ||
      !AUDIENCE_FIELDS.has(field) ||
      op !== "eq" ||
      typeof value !== "string" ||
      !value.trim()
    ) {
      return null;
    }
    filters.push({
      field: field as GrowthCampaignAudienceFilter["field"],
      op: "eq",
      value: value.trim(),
    } as GrowthCampaignAudienceFilter);
  }
  return { filters };
}

function isDuplicateKeyError(error: unknown): boolean {
  return (error as { code?: number })?.code === 11000;
}

async function validateRefs(
  refs: CampaignRefsPort | undefined,
  tenantId: string,
  source: GrowthCampaignSource,
  automationId: string | undefined
): Promise<CampaignServiceError | null> {
  if (!refs) return null;
  if (source.kind === "form") {
    const ok = await refs.formExists(tenantId, source.formId);
    if (!ok) {
      return {
        ok: false,
        code: "form_not_found",
        error: "No pudimos usar este formulario.",
      };
    }
  }
  if (automationId) {
    const ok = await refs.automationExists(tenantId, automationId);
    if (!ok) {
      return {
        ok: false,
        code: "automation_not_found",
        error: "No pudimos usar esta automatización.",
      };
    }
  }
  return null;
}

export async function createGrowthCampaign(
  store: GrowthCampaignStore,
  input: {
    tenantId: string;
    name: string;
    objective: string;
    trackingKey: string;
    source: unknown;
    audience?: unknown;
    automationId?: string | null;
    startAt?: string | null;
    endAt?: string | null;
    actor: CampaignActor;
    refs?: CampaignRefsPort;
    now?: string;
  }
): Promise<{ ok: true; campaign: GrowthCampaign } | CampaignServiceError> {
  const name = requireName(input.name);
  if (!name) {
    return {
      ok: false,
      code: "validation",
      error: "Nombre obligatorio (máx. 120).",
    };
  }
  const objective = requireObjective(input.objective);
  if (!objective) {
    return {
      ok: false,
      code: "validation",
      error: "Objetivo obligatorio (máx. 200).",
    };
  }
  const trackingKey = requireTrackingKey(input.trackingKey);
  if (!trackingKey) {
    return {
      ok: false,
      code: "validation",
      error:
        "Clave de seguimiento inválida. Usa minúsculas, números, guiones o guiones bajos.",
    };
  }
  const source = parseSource(input.source);
  if (!source) {
    return {
      ok: false,
      code: "validation",
      error: "Fuente inválida. Elige un formulario o «sin formulario».",
    };
  }
  const audience = parseAudience(input.audience);
  if (audience === null) {
    return {
      ok: false,
      code: "validation",
      error: "Audiencia inválida. Solo filtros V1 con op=eq.",
    };
  }
  if (!isIsoOptional(input.startAt) || !isIsoOptional(input.endAt)) {
    return {
      ok: false,
      code: "validation",
      error: "Fechas de inicio/fin inválidas.",
    };
  }

  const automationId =
    typeof input.automationId === "string" && input.automationId.trim()
      ? input.automationId.trim()
      : undefined;
  const startAt =
    typeof input.startAt === "string" && input.startAt.trim()
      ? input.startAt.trim()
      : undefined;
  const endAt =
    typeof input.endAt === "string" && input.endAt.trim()
      ? input.endAt.trim()
      : undefined;

  const refErr = await validateRefs(
    input.refs,
    input.tenantId,
    source,
    automationId
  );
  if (refErr) return refErr;

  const taken = await store.findByTrackingKey(input.tenantId, trackingKey);
  if (taken) {
    return {
      ok: false,
      code: "tracking_key_taken",
      error: "Esa clave de seguimiento ya está en uso en este Espacio.",
    };
  }

  const ts = nowIso(input.now);
  const campaign: GrowthCampaign = {
    _id: generateId("gcamp"),
    tenantId: input.tenantId,
    name,
    status: "draft",
    objective,
    trackingKey,
    source,
    ...(audience ? { audience } : {}),
    ...(automationId ? { automationId } : {}),
    ...(startAt ? { startAt } : {}),
    ...(endAt ? { endAt } : {}),
    createdBy: input.actor.userId,
    createdAt: ts,
    updatedAt: ts,
  };

  try {
    await store.insert(campaign);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return {
        ok: false,
        code: "tracking_key_taken",
        error: "Esa clave de seguimiento ya está en uso en este Espacio.",
      };
    }
    throw error;
  }

  return { ok: true, campaign };
}

export async function updateGrowthCampaign(
  store: GrowthCampaignStore,
  input: {
    tenantId: string;
    campaignId: string;
    name?: string;
    objective?: string;
    trackingKey?: string;
    source?: unknown;
    audience?: unknown;
    automationId?: string | null;
    startAt?: string | null;
    endAt?: string | null;
    actor: CampaignActor;
    refs?: CampaignRefsPort;
    now?: string;
  }
): Promise<{ ok: true; campaign: GrowthCampaign } | CampaignServiceError> {
  const existing = await store.findById(input.tenantId, input.campaignId);
  if (!existing || existing.tenantId !== input.tenantId) {
    return { ok: false, code: "not_found", error: "Campaña no encontrada." };
  }
  if (existing.status === "ended") {
    return {
      ok: false,
      code: "validation",
      error: "Una campaña terminada no se puede editar.",
    };
  }

  const name =
    input.name !== undefined ? requireName(input.name) : existing.name;
  if (!name) {
    return {
      ok: false,
      code: "validation",
      error: "Nombre obligatorio (máx. 120).",
    };
  }
  const objective =
    input.objective !== undefined
      ? requireObjective(input.objective)
      : existing.objective;
  if (!objective) {
    return {
      ok: false,
      code: "validation",
      error: "Objetivo obligatorio (máx. 200).",
    };
  }

  let trackingKey = existing.trackingKey;
  if (input.trackingKey !== undefined) {
    if (existing.status !== "draft") {
      return {
        ok: false,
        code: "tracking_key_immutable",
        error: "La clave de seguimiento no se puede cambiar tras activar.",
      };
    }
    const next = requireTrackingKey(input.trackingKey);
    if (!next) {
      return {
        ok: false,
        code: "validation",
        error:
          "Clave de seguimiento inválida. Usa minúsculas, números, guiones o guiones bajos.",
      };
    }
    if (next !== existing.trackingKey) {
      const taken = await store.findByTrackingKey(input.tenantId, next);
      if (taken && taken._id !== existing._id) {
        return {
          ok: false,
          code: "tracking_key_taken",
          error: "Esa clave de seguimiento ya está en uso en este Espacio.",
        };
      }
    }
    trackingKey = next;
  }

  let source = existing.source;
  if (input.source !== undefined) {
    const parsed = parseSource(input.source);
    if (!parsed) {
      return {
        ok: false,
        code: "validation",
        error: "Fuente inválida. Elige un formulario o «sin formulario».",
      };
    }
    source = parsed;
  }

  let audience = existing.audience;
  if (input.audience !== undefined) {
    const parsed = parseAudience(input.audience);
    if (parsed === null) {
      return {
        ok: false,
        code: "validation",
        error: "Audiencia inválida. Solo filtros V1 con op=eq.",
      };
    }
    audience = parsed;
  }

  if (input.startAt !== undefined && !isIsoOptional(input.startAt)) {
    return {
      ok: false,
      code: "validation",
      error: "Fecha de inicio inválida.",
    };
  }
  if (input.endAt !== undefined && !isIsoOptional(input.endAt)) {
    return { ok: false, code: "validation", error: "Fecha de fin inválida." };
  }

  let automationId = existing.automationId;
  if (input.automationId !== undefined) {
    automationId =
      typeof input.automationId === "string" && input.automationId.trim()
        ? input.automationId.trim()
        : undefined;
  }

  const startAt =
    input.startAt !== undefined
      ? typeof input.startAt === "string" && input.startAt.trim()
        ? input.startAt.trim()
        : undefined
      : existing.startAt;
  const endAt =
    input.endAt !== undefined
      ? typeof input.endAt === "string" && input.endAt.trim()
        ? input.endAt.trim()
        : undefined
      : existing.endAt;

  const refErr = await validateRefs(
    input.refs,
    input.tenantId,
    source,
    automationId
  );
  if (refErr) return refErr;

  // Si está active y cambia formId, verificar conflicto.
  if (
    existing.status === "active" &&
    source.kind === "form" &&
    (existing.source.kind !== "form" ||
      existing.source.formId !== source.formId)
  ) {
    const other = await store.findActiveByFormId(input.tenantId, source.formId);
    if (other && other._id !== existing._id) {
      return {
        ok: false,
        code: "active_form_conflict",
        error:
          "Este formulario ya está siendo usado por otra campaña activa.",
      };
    }
  }

  const ts = nowIso(input.now);
  const updated: GrowthCampaign = {
    ...existing,
    name,
    objective,
    trackingKey,
    source,
    updatedAt: ts,
  };
  if (audience) updated.audience = audience;
  else delete updated.audience;
  if (automationId) updated.automationId = automationId;
  else delete updated.automationId;
  if (startAt) updated.startAt = startAt;
  else delete updated.startAt;
  if (endAt) updated.endAt = endAt;
  else delete updated.endAt;

  try {
    await store.replace(updated);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return {
        ok: false,
        code: "conflict",
        error: "No se pudo guardar por un conflicto de configuración.",
      };
    }
    throw error;
  }

  return { ok: true, campaign: updated };
}

function canTransition(
  from: GrowthCampaignStatus,
  to: GrowthCampaignStatus
): boolean {
  if (from === "draft" && (to === "active" || to === "ended")) return true;
  if (from === "active" && to === "ended") return true;
  return false;
}

export async function activateGrowthCampaign(
  store: GrowthCampaignStore,
  input: {
    tenantId: string;
    campaignId: string;
    actor: CampaignActor;
    refs?: CampaignRefsPort;
    now?: string;
  }
): Promise<{ ok: true; campaign: GrowthCampaign } | CampaignServiceError> {
  const existing = await store.findById(input.tenantId, input.campaignId);
  if (!existing || existing.tenantId !== input.tenantId) {
    return { ok: false, code: "not_found", error: "Campaña no encontrada." };
  }
  if (!canTransition(existing.status, "active")) {
    return {
      ok: false,
      code: "invalid_transition",
      error: "Solo se puede activar una campaña en borrador.",
    };
  }

  const refErr = await validateRefs(
    input.refs,
    input.tenantId,
    existing.source,
    existing.automationId
  );
  if (refErr) return refErr;

  if (existing.source.kind === "form") {
    const other = await store.findActiveByFormId(
      input.tenantId,
      existing.source.formId
    );
    if (other && other._id !== existing._id) {
      return {
        ok: false,
        code: "active_form_conflict",
        error:
          "Este formulario ya está siendo usado por otra campaña activa.",
      };
    }
  }

  const ts = nowIso(input.now);
  const updated: GrowthCampaign = {
    ...existing,
    status: "active",
    updatedAt: ts,
    ...(existing.startAt ? {} : { startAt: ts }),
  };

  try {
    await store.replace(updated);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return {
        ok: false,
        code: "active_form_conflict",
        error:
          "Este formulario ya está siendo usado por otra campaña activa.",
      };
    }
    throw error;
  }

  return { ok: true, campaign: updated };
}

export async function endGrowthCampaign(
  store: GrowthCampaignStore,
  input: {
    tenantId: string;
    campaignId: string;
    actor: CampaignActor;
    now?: string;
  }
): Promise<{ ok: true; campaign: GrowthCampaign } | CampaignServiceError> {
  const existing = await store.findById(input.tenantId, input.campaignId);
  if (!existing || existing.tenantId !== input.tenantId) {
    return { ok: false, code: "not_found", error: "Campaña no encontrada." };
  }
  if (!canTransition(existing.status, "ended")) {
    return {
      ok: false,
      code: "invalid_transition",
      error: "Esta campaña ya está terminada.",
    };
  }

  const ts = nowIso(input.now);
  const updated: GrowthCampaign = {
    ...existing,
    status: "ended",
    updatedAt: ts,
    ...(existing.endAt ? {} : { endAt: ts }),
  };

  await store.replace(updated);
  return { ok: true, campaign: updated };
}

export async function getGrowthCampaign(
  store: GrowthCampaignStore,
  input: { tenantId: string; campaignId: string }
): Promise<GrowthCampaign | null> {
  const doc = await store.findById(input.tenantId, input.campaignId);
  if (!doc || doc.tenantId !== input.tenantId) return null;
  return doc;
}

export async function listGrowthCampaigns(
  store: GrowthCampaignStore,
  tenantId: string
): Promise<GrowthCampaign[]> {
  return store.list(tenantId);
}

export function isGrowthCampaignStatus(
  value: unknown
): value is GrowthCampaignStatus {
  return (
    typeof value === "string" &&
    (GROWTH_CAMPAIGN_STATUSES as readonly string[]).includes(value)
  );
}
