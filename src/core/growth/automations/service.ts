/**
 * OT-GROWTH-AUTOMATION-002 — operaciones de definición versionada.
 * Crear / editar borrador / publicar / activar-desactivar.
 * No ejecuta Automatizaciones ni invoca sales-ops.
 */

import { generateId } from "@/core/identity/auth/crypto";
import { validateAutomationSteps } from "./catalog";
import type { GrowthAutomationStore } from "./store";
import type {
  GrowthAutomation,
  GrowthAutomationStep,
  GrowthAutomationVersion,
} from "./types";

export type AutomationActor = {
  userId: string;
};

export type AutomationServiceError =
  | { ok: false; code: "not_found"; error: string }
  | { ok: false; code: "validation"; error: string; detail?: string }
  | { ok: false; code: "published_immutable"; error: string }
  | { ok: false; code: "no_draft"; error: string }
  | { ok: false; code: "conflict"; error: string };

function nowIso(now?: string) {
  return now ?? new Date().toISOString();
}

function requireName(name: unknown): string | null {
  if (typeof name !== "string" || !name.trim()) return null;
  return name.trim();
}

export async function createGrowthAutomation(
  store: GrowthAutomationStore,
  input: {
    tenantId: string;
    name: string;
    steps: unknown;
    actor: AutomationActor;
    now?: string;
  }
): Promise<
  | {
      ok: true;
      automation: GrowthAutomation;
      version: GrowthAutomationVersion;
    }
  | AutomationServiceError
> {
  const name = requireName(input.name);
  if (!name) {
    return { ok: false, code: "validation", error: "Nombre obligatorio." };
  }

  const validated = validateAutomationSteps(input.steps);
  if (!validated.ok) {
    return {
      ok: false,
      code: "validation",
      error: validated.error,
      detail: validated.code,
    };
  }

  const ts = nowIso(input.now);
  const automationId = generateId("gauto");
  const versionId = generateId("gautov");

  const automation: GrowthAutomation = {
    _id: automationId,
    tenantId: input.tenantId,
    name,
    status: "draft",
    publishedVersion: null,
    draftVersion: 1,
    createdAt: ts,
    updatedAt: ts,
    createdByUserId: input.actor.userId,
    updatedByUserId: input.actor.userId,
  };

  const version: GrowthAutomationVersion = {
    _id: versionId,
    automationId,
    tenantId: input.tenantId,
    version: 1,
    status: "draft",
    steps: validated.steps,
    createdAt: ts,
    updatedAt: ts,
    createdByUserId: input.actor.userId,
    updatedByUserId: input.actor.userId,
  };

  await store.insertAutomation(automation);
  await store.insertVersion(version);

  return { ok: true, automation, version };
}

export async function updateGrowthAutomationDraft(
  store: GrowthAutomationStore,
  input: {
    tenantId: string;
    automationId: string;
    name?: string;
    steps?: unknown;
    actor: AutomationActor;
    now?: string;
  }
): Promise<
  | {
      ok: true;
      automation: GrowthAutomation;
      version: GrowthAutomationVersion;
      createdNewDraft: boolean;
    }
  | AutomationServiceError
> {
  const existing = await store.findAutomationById(
    input.tenantId,
    input.automationId
  );
  if (!existing || existing.tenantId !== input.tenantId) {
    return { ok: false, code: "not_found", error: "Automatización no encontrada." };
  }

  const name =
    input.name !== undefined ? requireName(input.name) : existing.name;
  if (!name) {
    return { ok: false, code: "validation", error: "Nombre obligatorio." };
  }

  let steps: GrowthAutomationStep[] | undefined;
  if (input.steps !== undefined) {
    const validated = validateAutomationSteps(input.steps);
    if (!validated.ok) {
      return {
        ok: false,
        code: "validation",
        error: validated.error,
        detail: validated.code,
      };
    }
    steps = validated.steps;
  }

  const ts = nowIso(input.now);

  // Si hay borrador editable → mutar solo ese (nunca published).
  if (existing.draftVersion != null) {
    const draft = await store.findVersion(
      input.tenantId,
      existing._id,
      existing.draftVersion
    );
    if (!draft || draft.tenantId !== input.tenantId) {
      return { ok: false, code: "not_found", error: "Borrador no encontrado." };
    }
    if (draft.status !== "draft") {
      return {
        ok: false,
        code: "published_immutable",
        error: "La versión publicada no se puede modificar.",
      };
    }

    const updatedVersion: GrowthAutomationVersion = {
      ...draft,
      steps: steps ?? draft.steps,
      updatedAt: ts,
      updatedByUserId: input.actor.userId,
    };
    await store.replaceVersion(updatedVersion);

    const updatedAutomation: GrowthAutomation = {
      ...existing,
      name,
      updatedAt: ts,
      updatedByUserId: input.actor.userId,
    };
    await store.replaceAutomation(updatedAutomation);

    return {
      ok: true,
      automation: updatedAutomation,
      version: updatedVersion,
      createdNewDraft: false,
    };
  }

  // Sin borrador: la publicada no se toca; se crea versión nueva en draft.
  if (existing.publishedVersion == null) {
    return {
      ok: false,
      code: "no_draft",
      error: "No hay borrador ni versión publicada para editar.",
    };
  }

  const published = await store.findVersion(
    input.tenantId,
    existing._id,
    existing.publishedVersion
  );
  if (!published || published.tenantId !== input.tenantId) {
    return {
      ok: false,
      code: "not_found",
      error: "Versión publicada no encontrada.",
    };
  }

  const nextVersionNumber = existing.publishedVersion + 1;
  const newDraft: GrowthAutomationVersion = {
    _id: generateId("gautov"),
    automationId: existing._id,
    tenantId: input.tenantId,
    version: nextVersionNumber,
    status: "draft",
    steps: steps ?? structuredClone(published.steps),
    createdAt: ts,
    updatedAt: ts,
    createdByUserId: input.actor.userId,
    updatedByUserId: input.actor.userId,
  };
  await store.insertVersion(newDraft);

  const updatedAutomation: GrowthAutomation = {
    ...existing,
    name,
    draftVersion: nextVersionNumber,
    updatedAt: ts,
    updatedByUserId: input.actor.userId,
  };
  await store.replaceAutomation(updatedAutomation);

  return {
    ok: true,
    automation: updatedAutomation,
    version: newDraft,
    createdNewDraft: true,
  };
}

export async function publishGrowthAutomation(
  store: GrowthAutomationStore,
  input: {
    tenantId: string;
    automationId: string;
    actor: AutomationActor;
    now?: string;
  }
): Promise<
  | {
      ok: true;
      automation: GrowthAutomation;
      version: GrowthAutomationVersion;
    }
  | AutomationServiceError
> {
  const existing = await store.findAutomationById(
    input.tenantId,
    input.automationId
  );
  if (!existing || existing.tenantId !== input.tenantId) {
    return { ok: false, code: "not_found", error: "Automatización no encontrada." };
  }
  if (existing.draftVersion == null) {
    return {
      ok: false,
      code: "no_draft",
      error: "No hay borrador para publicar.",
    };
  }

  const draft = await store.findVersion(
    input.tenantId,
    existing._id,
    existing.draftVersion
  );
  if (!draft || draft.tenantId !== input.tenantId) {
    return { ok: false, code: "not_found", error: "Borrador no encontrado." };
  }
  if (draft.status !== "draft") {
    return {
      ok: false,
      code: "published_immutable",
      error: "La versión ya está publicada.",
    };
  }

  // Revalidar catálogo al publicar (defensa en profundidad).
  const validated = validateAutomationSteps(draft.steps);
  if (!validated.ok) {
    return {
      ok: false,
      code: "validation",
      error: validated.error,
      detail: validated.code,
    };
  }

  const ts = nowIso(input.now);
  const published: GrowthAutomationVersion = {
    ...draft,
    status: "published",
    steps: validated.steps,
    updatedAt: ts,
    updatedByUserId: input.actor.userId,
    publishedAt: ts,
    publishedByUserId: input.actor.userId,
  };

  // Publicación = transición draft→published (replaceVersion solo acepta draft en Mongo).
  await store.replaceVersion(published);

  const automation: GrowthAutomation = {
    ...existing,
    status: "active",
    publishedVersion: published.version,
    draftVersion: null,
    updatedAt: ts,
    updatedByUserId: input.actor.userId,
  };
  await store.replaceAutomation(automation);

  return { ok: true, automation, version: published };
}

export async function setGrowthAutomationActive(
  store: GrowthAutomationStore,
  input: {
    tenantId: string;
    automationId: string;
    active: boolean;
    actor: AutomationActor;
    now?: string;
  }
): Promise<{ ok: true; automation: GrowthAutomation } | AutomationServiceError> {
  const existing = await store.findAutomationById(
    input.tenantId,
    input.automationId
  );
  if (!existing || existing.tenantId !== input.tenantId) {
    return { ok: false, code: "not_found", error: "Automatización no encontrada." };
  }
  if (existing.publishedVersion == null) {
    return {
      ok: false,
      code: "conflict",
      error: "No se puede activar/desactivar sin versión publicada.",
    };
  }

  const ts = nowIso(input.now);
  const automation: GrowthAutomation = {
    ...existing,
    status: input.active ? "active" : "disabled",
    updatedAt: ts,
    updatedByUserId: input.actor.userId,
  };
  await store.replaceAutomation(automation);
  return { ok: true, automation };
}

export async function getGrowthAutomation(
  store: GrowthAutomationStore,
  input: { tenantId: string; automationId: string }
): Promise<
  | {
      ok: true;
      automation: GrowthAutomation;
      versions: GrowthAutomationVersion[];
      draft: GrowthAutomationVersion | null;
      published: GrowthAutomationVersion | null;
    }
  | AutomationServiceError
> {
  const automation = await store.findAutomationById(
    input.tenantId,
    input.automationId
  );
  if (!automation || automation.tenantId !== input.tenantId) {
    return { ok: false, code: "not_found", error: "Automatización no encontrada." };
  }
  const versions = await store.listVersions(input.tenantId, automation._id);
  const draft =
    automation.draftVersion != null
      ? (versions.find((v) => v.version === automation.draftVersion) ?? null)
      : null;
  const published =
    automation.publishedVersion != null
      ? (versions.find((v) => v.version === automation.publishedVersion) ?? null)
      : null;
  return { ok: true, automation, versions, draft, published };
}

export async function listGrowthAutomations(
  store: GrowthAutomationStore,
  tenantId: string
): Promise<GrowthAutomation[]> {
  return store.listAutomations(tenantId);
}

/**
 * Intento directo de mutar una versión publicada — debe fallar.
 * Expuesto para pruebas de inmutabilidad.
 */
export async function tryMutatePublishedAutomationVersion(
  store: GrowthAutomationStore,
  input: {
    tenantId: string;
    automationId: string;
    version: number;
    steps: unknown;
    actor: AutomationActor;
    now?: string;
  }
): Promise<AutomationServiceError | { ok: true }> {
  const versionDoc = await store.findVersion(
    input.tenantId,
    input.automationId,
    input.version
  );
  if (!versionDoc || versionDoc.tenantId !== input.tenantId) {
    return { ok: false, code: "not_found", error: "Versión no encontrada." };
  }
  if (versionDoc.status === "published") {
    return {
      ok: false,
      code: "published_immutable",
      error: "La versión publicada no se puede modificar.",
    };
  }
  const validated = validateAutomationSteps(input.steps);
  if (!validated.ok) {
    return {
      ok: false,
      code: "validation",
      error: validated.error,
      detail: validated.code,
    };
  }
  const ts = nowIso(input.now);
  await store.replaceVersion({
    ...versionDoc,
    steps: validated.steps,
    updatedAt: ts,
    updatedByUserId: input.actor.userId,
  });
  return { ok: true };
}
