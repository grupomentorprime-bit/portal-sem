import type { MentorAppId } from "@/lib/desktop/catalog";

export type DirectoryRole = {
  id: string;
  label: string;
};

export type DirectoryMember = {
  membershipId: string;
  displayName: string;
  email: string;
  status: string;
  roles: DirectoryRole[];
  authorizedApps: readonly string[];
};

export type DirectoryInvitation = {
  id: string;
  email: string;
  displayName: string;
  status: string;
};

export type TeamDirectoryFilters = {
  query?: string;
  status?: string;
  roleId?: string;
  appId?: string;
};

export function membershipStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Activo";
    case "suspended":
      return "Suspendido";
    case "archived":
      return "Archivado";
    case "invited":
      return "Invitado";
    default:
      return "Sin estado";
  }
}

export function invitationStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Pendiente";
    case "expired":
      return "Venció";
    case "revoked":
      return "Cancelada";
    case "accepted":
      return "Aceptada";
    default:
      return "Sin estado";
  }
}

export function canResendInvitation(status: string): boolean {
  return status === "pending";
}

export function sameAppSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const seen = new Set(left);
  return right.every((id) => seen.has(id));
}

export function filterTeamDirectory<T extends DirectoryMember>(
  members: readonly T[],
  filters: TeamDirectoryFilters = {}
): T[] {
  const query = filters.query?.trim().toLowerCase() ?? "";
  const status = filters.status && filters.status !== "all" ? filters.status : "";
  const roleId = filters.roleId && filters.roleId !== "all" ? filters.roleId : "";
  const appId = filters.appId && filters.appId !== "all" ? filters.appId : "";

  return members.filter((member) => {
    if (status && member.status !== status) return false;
    if (roleId && !member.roles.some((role) => role.id === roleId)) return false;
    if (appId && !member.authorizedApps.includes(appId)) return false;
    if (!query) return true;
    const haystack = `${member.displayName} ${member.email}`.toLowerCase();
    return haystack.includes(query);
  });
}

/** Pendientes y vencidas: las demás ya no se administran desde esta bandeja. */
export function filterTeamInvitations(
  invitations: readonly DirectoryInvitation[],
  query = ""
): DirectoryInvitation[] {
  const needle = query.trim().toLowerCase();
  return invitations.filter((invitation) => {
    if (invitation.status !== "pending" && invitation.status !== "expired") return false;
    if (!needle) return true;
    return `${invitation.displayName} ${invitation.email}`.toLowerCase().includes(needle);
  });
}

export function profileOptions(members: readonly DirectoryMember[]): DirectoryRole[] {
  const seen = new Map<string, string>();
  for (const member of members) {
    for (const role of member.roles) {
      if (!seen.has(role.id)) seen.set(role.id, role.label);
    }
  }
  return [...seen.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
}

export function appFilterOptions(
  contracted: readonly MentorAppId[],
  labels: (appId: MentorAppId) => string
): Array<{ id: MentorAppId; label: string }> {
  return contracted.map((id) => ({ id, label: labels(id) }));
}
