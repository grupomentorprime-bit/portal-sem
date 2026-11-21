import { MENTOR_APPS, type MentorAppId } from "@/nelzuri/catalog/manifests";
import { isMentorAppId, manifestById } from "@/nelzuri/catalog/registry";

/** Entrada externa. Solo https, como hasta ahora. */
export function isHttpsEntry(url: string | null | undefined): url is string {
  const value = url?.trim() ?? "";
  return value.startsWith("https://");
}

function includedWhenFieldMissing(appId: MentorAppId, tenantId: string): boolean {
  const rule = manifestById(appId).defaultContract;
  if (rule.when !== "field-missing") return false;
  if (rule.spaceId == null) return true;
  return tenantId === rule.spaceId;
}

/**
 * Techo del Espacio.
 * Lista guardada: se respeta, en el orden histórico.
 * Campo ausente: lo dice el manifiesto de cada aplicación.
 */
export function resolveContractedApps(input: {
  tenantId: string;
  contractedApps?: readonly string[] | null;
}): MentorAppId[] {
  if (Array.isArray(input.contractedApps)) {
    return MENTOR_APPS.filter((id) => input.contractedApps!.includes(id));
  }
  return MENTOR_APPS.filter((id) => includedWhenFieldMissing(id, input.tenantId));
}

export function parseContractPatch(input: {
  contractedApps: unknown;
  aprendeHoyEntryUrl: unknown;
}): { ok: true; contractedApps: MentorAppId[]; aprendeHoyEntryUrl: string | null } | { ok: false } {
  if (!Array.isArray(input.contractedApps)) return { ok: false };
  const ids: MentorAppId[] = [];
  for (const item of input.contractedApps) {
    if (typeof item !== "string" || !isMentorAppId(item)) return { ok: false };
    if (!ids.includes(item)) ids.push(item);
  }
  const raw = input.aprendeHoyEntryUrl;
  if (raw == null || (typeof raw === "string" && raw.trim() === "")) {
    return {
      ok: true,
      contractedApps: MENTOR_APPS.filter((id) => ids.includes(id)),
      aprendeHoyEntryUrl: null,
    };
  }
  if (typeof raw !== "string" || !isHttpsEntry(raw)) return { ok: false };
  return {
    ok: true,
    contractedApps: MENTOR_APPS.filter((id) => ids.includes(id)),
    aprendeHoyEntryUrl: raw.trim(),
  };
}

export function newlyContracted(
  before: readonly MentorAppId[],
  after: readonly MentorAppId[]
): MentorAppId[] {
  return after.filter((id) => !before.includes(id));
}
