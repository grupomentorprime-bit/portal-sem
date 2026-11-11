import {
  CUMPLE_SPACE_ID,
  MENTOR_APPS,
  isMentorAppId,
  type MentorAppId,
} from "@/lib/desktop/catalog";

export function resolveContractedApps(input: {
  tenantId: string;
  contractedApps?: readonly string[] | null;
}): MentorAppId[] {
  if (Array.isArray(input.contractedApps)) {
    return MENTOR_APPS.filter((id) => input.contractedApps!.includes(id));
  }
  const defaults: MentorAppId[] = ["growth-os"];
  if (input.tenantId === CUMPLE_SPACE_ID) defaults.push("cumple");
  return defaults;
}

export function isHttpsEntry(url: string | null | undefined): url is string {
  const value = url?.trim() ?? "";
  return value.startsWith("https://");
}

export type DesktopClick =
  | { kind: "open"; href: string }
  | { kind: "request" }
  | { kind: "later" }
  | { kind: "disconnected" };

export function desktopClick(input: {
  appId: MentorAppId;
  tenantId: string;
  contracted: readonly MentorAppId[];
  aprendeHoyEntryUrl?: string | null;
  cumpleOrigin?: string | null;
}): DesktopClick {
  if (!input.contracted.includes(input.appId)) return { kind: "request" };
  if (input.appId === "growth-os") return { kind: "open", href: "/admin" };
  if (input.appId === "rrhh") return { kind: "later" };
  if (input.appId === "aprende-hoy") {
    return isHttpsEntry(input.aprendeHoyEntryUrl)
      ? { kind: "open", href: input.aprendeHoyEntryUrl.trim() }
      : { kind: "disconnected" };
  }
  if (input.tenantId === CUMPLE_SPACE_ID && isHttpsEntry(input.cumpleOrigin)) {
    return { kind: "open", href: input.cumpleOrigin.trim() };
  }
  return { kind: "disconnected" };
}

export function escritorioRedirect(input: {
  hasSpace: boolean;
  studentAffairs: boolean;
  isPlatformOperator: boolean;
  hasMembership: boolean;
}): "/admin/sin-espacio" | "/admin/portal/asuntos-estudiantiles" | "/platform" | null {
  if (!input.hasSpace) return "/admin/sin-espacio";
  if (input.studentAffairs) return "/admin/portal/asuntos-estudiantiles";
  if (input.isPlatformOperator && !input.hasMembership) return "/platform";
  return null;
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
    return { ok: true, contractedApps: MENTOR_APPS.filter((id) => ids.includes(id)), aprendeHoyEntryUrl: null };
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
