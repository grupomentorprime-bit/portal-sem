import { isMentorAppId, MENTOR_APPS, type MentorAppId } from "@/lib/desktop/catalog";

export const CLIENT_STATUSES = [
  {
    id: "active",
    label: "Activo",
    line: "El portal se publica en su dominio.",
  },
  {
    id: "inactive",
    label: "Inactivo",
    line: "El portal deja de publicarse. Se puede volver a activar.",
  },
  {
    id: "suspended",
    label: "En pausa",
    line: "El portal queda en mantenimiento hasta activarlo.",
  },
  {
    id: "archived",
    label: "Archivado",
    line: "Deja de publicarse y sigue en el catálogo.",
  },
] as const;

export type ClientStatus = (typeof CLIENT_STATUSES)[number]["id"];

export interface ClientConsoleModel {
  name: string;
  status: ClientStatus;
  typeLabel: string;
  platformHost: string | null;
  customHost: string | null;
  primaryHost: string | null;
  contractedApps: MentorAppId[];
  aprendeHoyEntryUrl: string | null;
  requestedApps: MentorAppId[];
}

export function clientStatusLine(status: string): string {
  return CLIENT_STATUSES.find((item) => item.id === status)?.line ?? CLIENT_STATUSES[1].line;
}

function asStatus(value: unknown): ClientStatus {
  if (CLIENT_STATUSES.some((item) => item.id === value)) return value as ClientStatus;
  return "inactive";
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function readClientConsole(space: unknown): ClientConsoleModel | null {
  if (!space || typeof space !== "object") return null;
  const row = space as Record<string, unknown>;
  const name = text(row.name);
  if (!name) return null;

  const domains = Array.isArray(row.domains) ? row.domains : [];
  const typed = domains.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const domain = item as Record<string, unknown>;
    const host = text(domain.host);
    if (!host) return [];
    return [
      {
        host,
        isPrimary: domain.isPrimary === true,
        kind: text(domain.kind),
      },
    ];
  });
  const platform = typed.find((item) => item.kind === "platform_subdomain") ?? null;
  const custom = typed.find((item) => item.kind === "custom") ?? null;
  const primary = typed.find((item) => item.isPrimary) ?? typed[0] ?? null;

  const contractedApps = MENTOR_APPS.filter(
    (appId) => Array.isArray(row.contractedApps) && row.contractedApps.includes(appId)
  );
  const requestedApps = Array.isArray(row.openAppRequests)
    ? row.openAppRequests.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const appId = (item as { appId?: unknown }).appId;
        return typeof appId === "string" && isMentorAppId(appId) ? [appId] : [];
      })
    : [];

  return {
    name,
    status: asStatus(row.status),
    typeLabel: text(row.typeLabel) ?? "Organización",
    platformHost: platform?.host ?? null,
    customHost: custom?.host ?? null,
    primaryHost: primary?.host ?? null,
    contractedApps,
    aprendeHoyEntryUrl: text(row.aprendeHoyEntryUrl),
    requestedApps,
  };
}

export function planDraftChanged(input: {
  contracted: readonly string[];
  draft: readonly string[];
  entryUrl: string | null;
  draftUrl: string;
}): boolean {
  const sameApps =
    [...input.contracted].sort().join("\0") === [...input.draft].sort().join("\0");
  const sameUrl = (input.entryUrl ?? "").trim() === input.draftUrl.trim();
  return !sameApps || !sameUrl;
}

export function domainDraftChanged(current: string | null, draft: string): boolean {
  return (current ?? "").trim() !== draft.trim();
}
