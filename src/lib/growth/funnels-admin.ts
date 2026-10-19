/**
 * Administración de embudos del Espacio activo.
 */

import "server-only";

import {
  createMongoGrowthOpportunityStore,
} from "@/core/growth";
import { resolveGrowthSpaceConfig, setGrowthStaleAfterDays } from "@/core/growth/space-config";
import {
  addGrowthFunnelFieldOption,
  createGrowthFunnelField,
  deactivateGrowthFunnelField,
  patchGrowthFunnelFieldOption,
  renameGrowthFunnelField,
  reorderGrowthFunnelFields,
} from "@/core/growth/funnel-fields";
import type { GrowthFunnelFieldFailure } from "@/core/growth/funnel-fields";
import {
  archiveGrowthFunnel,
  createGrowthFunnel,
  createGrowthFunnelStage,
  deactivateGrowthFunnelStage,
  ensureGrowthFunnelsForTenant,
  listGrowthFunnelStages,
  makeDefaultGrowthFunnel,
  renameGrowthFunnel,
  renameGrowthFunnelStage,
  reorderGrowthFunnelStage,
} from "@/core/growth/funnels";
import type { GrowthFunnelFailure } from "@/core/growth/funnel-types";
import { intermediateStages } from "@/core/growth/funnel-stages";
import { getDatabase } from "@/lib/mongodb";
import { openGrowthFunnelDirectory } from "@/core/growth/funnel-mongo";

export async function readGrowthFunnelAdmin(tenantId: string) {
  const db = await getDatabase();
  const directory = await openGrowthFunnelDirectory(db);
  await ensureGrowthFunnelsForTenant(directory, tenantId);
  const funnels = (await directory.listFunnels(tenantId)).filter(
    (funnel) => funnel.tenantId === tenantId
  );
  const rows = [];
  for (const funnel of funnels) {
    const stages = (await listGrowthFunnelStages(directory, tenantId, funnel.key)) ?? [];
    const openCount = await directory.countNonFinal(tenantId, funnel.key);
    rows.push({
      key: funnel.key,
      name: funnel.name,
      status: funnel.status,
      isDefault: funnel.isDefault,
      openCount,
      stages: intermediateStages(stages).map((stage) => ({
        key: stage.key,
        label: stage.label,
        position: stage.position,
        active: stage.active,
        isInitial: stage.isInitial,
      })),
      fields: (funnel.fields ?? [])
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((field) => ({
          key: field.key,
          label: field.label,
          type: field.type,
          required: field.required,
          position: field.position,
          active: field.active,
          help: field.help,
          options: field.options ?? [],
        })),
    });
  }
  return rows.sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name, "es"));
}

export async function readGrowthStaleAfterDays(tenantId: string): Promise<number> {
  const db = await getDatabase();
  const store = createMongoGrowthOpportunityStore(db);
  const config = await resolveGrowthSpaceConfig(store, tenantId);
  return config.staleAfterDays ?? 7;
}

async function directoryFor(tenantId: string) {
  const db = await getDatabase();
  const directory = await openGrowthFunnelDirectory(db);
  await ensureGrowthFunnelsForTenant(directory, tenantId);
  return directory;
}

export async function mutateGrowthFunnel(
  tenantId: string,
  action: string,
  body: Record<string, unknown>
): Promise<
  | { ok: true }
  | { ok: false; reason: GrowthFunnelFailure | GrowthFunnelFieldFailure | "invalid_action" }
> {
  const directory = await directoryFor(tenantId);
  const key = String(body.key ?? "");
  if (action === "create") {
    const created = await createGrowthFunnel(directory, {
      tenantId,
      key,
      name: String(body.name ?? ""),
    });
    return created.ok ? { ok: true } : created;
  }
  if (action === "rename") {
    const renamed = await renameGrowthFunnel(directory, {
      tenantId,
      key,
      name: String(body.name ?? ""),
    });
    return renamed.ok ? { ok: true } : renamed;
  }
  if (action === "archive") {
    const archived = await archiveGrowthFunnel(directory, { tenantId, key });
    return archived.ok ? { ok: true } : archived;
  }
  if (action === "makeDefault") {
    const updated = await makeDefaultGrowthFunnel(directory, { tenantId, key });
    return updated.ok ? { ok: true } : updated;
  }
  if (action === "createStage") {
    const created = await createGrowthFunnelStage(directory, {
      tenantId,
      funnelKey: key,
      key: String(body.stageKey ?? ""),
      label: String(body.label ?? ""),
    });
    return created.ok ? { ok: true } : created;
  }
  if (action === "renameStage") {
    const renamed = await renameGrowthFunnelStage(directory, {
      tenantId,
      funnelKey: key,
      stageKey: String(body.stageKey ?? ""),
      label: String(body.label ?? ""),
    });
    return renamed.ok ? { ok: true } : renamed;
  }
  if (action === "reorderStage") {
    const direction = body.direction === "up" ? "up" : "down";
    const moved = await reorderGrowthFunnelStage(directory, {
      tenantId,
      funnelKey: key,
      stageKey: String(body.stageKey ?? ""),
      direction,
    });
    return moved.ok ? { ok: true } : moved;
  }
  if (action === "deactivateStage") {
    const deactivated = await deactivateGrowthFunnelStage(directory, {
      tenantId,
      funnelKey: key,
      stageKey: String(body.stageKey ?? ""),
    });
    return deactivated.ok ? { ok: true } : deactivated;
  }
  if (action === "staleDays") {
    const db = await getDatabase();
    const store = createMongoGrowthOpportunityStore(db);
    const saved = await setGrowthStaleAfterDays(store, tenantId, Number(body.days));
    return saved.ok ? { ok: true } : { ok: false, reason: "invalid_action" };
  }
  const fieldResult = await mutateFunnelField(directory, tenantId, action, body);
  if (fieldResult) return fieldResult;
  return { ok: false, reason: "invalid_action" };
}

async function mutateFunnelField(
  directory: Awaited<ReturnType<typeof directoryFor>>,
  tenantId: string,
  action: string,
  body: Record<string, unknown>
): Promise<{ ok: true } | { ok: false; reason: GrowthFunnelFailure | GrowthFunnelFieldFailure | "invalid_action" } | null> {
  const key = String(body.key ?? "");
  const fieldKey = String(body.fieldKey ?? "");
  if (action === "createField") {
    const options = Array.isArray(body.options)
      ? body.options.flatMap((option) => {
          if (!option || typeof option !== "object") return [];
          const row = option as { key?: string; label?: string };
          return [{ key: String(row.key ?? ""), label: String(row.label ?? "") }];
        })
      : undefined;
    const created = await createGrowthFunnelField(directory, {
      tenantId,
      funnelKey: key,
      key: fieldKey,
      label: String(body.label ?? ""),
      type: String(body.type ?? ""),
      required: Boolean(body.required),
      help: typeof body.help === "string" ? body.help : undefined,
      options,
    });
    return created.ok ? { ok: true } : created;
  }
  if (action === "renameField") {
    const renamed = await renameGrowthFunnelField(directory, {
      tenantId,
      funnelKey: key,
      fieldKey,
      label: String(body.label ?? ""),
      help: typeof body.help === "string" ? body.help : undefined,
    });
    return renamed.ok ? { ok: true } : renamed;
  }
  if (action === "reorderField") {
    const moved = await reorderGrowthFunnelFields(directory, {
      tenantId,
      funnelKey: key,
      fieldKey,
      direction: body.direction === "up" ? "up" : "down",
    });
    return moved.ok ? { ok: true } : moved;
  }
  if (action === "deactivateField") {
    const deactivated = await deactivateGrowthFunnelField(directory, {
      tenantId,
      funnelKey: key,
      fieldKey,
    });
    return deactivated.ok ? { ok: true } : deactivated;
  }
  if (action === "addFieldOption") {
    const added = await addGrowthFunnelFieldOption(directory, {
      tenantId,
      funnelKey: key,
      fieldKey,
      key: String(body.optionKey ?? ""),
      label: String(body.label ?? ""),
    });
    return added.ok ? { ok: true } : added;
  }
  if (action === "patchFieldOption") {
    const patched = await patchGrowthFunnelFieldOption(directory, {
      tenantId,
      funnelKey: key,
      fieldKey,
      optionKey: String(body.optionKey ?? ""),
      label: typeof body.label === "string" ? body.label : undefined,
      active: typeof body.active === "boolean" ? body.active : undefined,
    });
    return patched.ok ? { ok: true } : patched;
  }
  return null;
}

export function growthFunnelFailureMessage(
  reason: GrowthFunnelFailure | GrowthFunnelFieldFailure | "invalid_action"
): string {
  switch (reason) {
    case "invalid_key":
      return "La clave debe ser un slug en minúsculas y el nombre no puede quedar vacío.";
    case "duplicate_key":
      return "Esa clave ya existe y no se puede reutilizar.";
    case "duplicate_stage":
      return "Esa etapa ya existe en el embudo, aunque esté inactiva.";
    case "reserved_stage":
      return "Esa clave está reservada para un resultado de plataforma.";
    case "not_found":
      return "No se encontró el embudo o la etapa en este Espacio.";
    case "cannot_deactivate_initial":
      return "La etapa inicial no se puede desactivar.";
    case "cannot_deactivate_result":
      return "Los resultados de plataforma no se desactivan.";
    case "cannot_deactivate_last_active":
      return "Tiene que quedar al menos una etapa intermedia activa.";
    case "cannot_rename_result":
      return "Los resultados de plataforma no se renombran.";
    case "open_opportunities":
      return "No se archiva un embudo con oportunidades abiertas.";
    case "default_required":
      return "Elige otro embudo predeterminado antes de archivar este.";
    case "archived":
      return "Un embudo archivado no puede quedar como predeterminado.";
    case "not_intermediate":
      return "Solo se reordenan etapas intermedias.";
    case "limit":
      return "Se alcanzó el máximo de campos u opciones.";
    case "invalid_type":
      return "Ese tipo de campo no está permitido.";
    case "type_locked":
      return "El tipo de un campo no se puede cambiar.";
    case "invalid_options":
      return "Un campo de lista necesita opciones válidas.";
    default:
      return "No se pudo aplicar el cambio.";
  }
}
