import { PLATFORM_DISPLAY_NAME } from "@/core/branding/display";
import { labelSpaceRole } from "@/lib/platform/space-labels";

export const OWNER_PROFILE_IDS = [
  "platform_owner",
  "platform_operator",
  "super_admin",
  "institution_admin",
  "support",
  "admissions",
  "student_affairs",
  "communications",
  "reviewer",
  "guest",
] as const;

export type OwnerProfileId = (typeof OWNER_PROFILE_IDS)[number];

export interface MaintainedMembership {
  tenantId: string;
  spaceName: string;
  roleLabel: string;
}

export interface MaintainedUserRow {
  id: string;
  email: string;
  displayName: string;
  avatarPresetId?: string | null;
  avatarPhoto?: boolean;
  avatarPhotoUpdatedAt?: string | null;
  profile: string;
  status: string;
  /** Dueño u operador de Growth OS. Esas cuentas no entran en la lista de un cliente. */
  platformLabel?: string | null;
  platformRole?: "platform_owner" | "platform_operator" | null;
  /** Cuenta reservada del sistema. No se suspende ni se elimina. */
  reserved?: boolean;
  memberships?: MaintainedMembership[];
}

export interface MaintainedUserGroup {
  id: string;
  title: string;
  users: MaintainedUserRow[];
}

function byDisplayName(a: MaintainedUserRow, b: MaintainedUserRow): number {
  return a.displayName.localeCompare(b.displayName, "es");
}

/**
 * Separa las cuentas por cliente. Quien administra el ecosistema aparece una sola vez,
 * en su propio grupo, aunque tenga membresía para entrar a un Espacio.
 */
export function groupMaintainedUsers(users: MaintainedUserRow[]): MaintainedUserGroup[] {
  const ecosystem: MaintainedUserRow[] = [];
  const clients = new Map<string, { title: string; users: MaintainedUserRow[] }>();
  const unassigned: MaintainedUserRow[] = [];

  for (const user of users) {
    const platformLabel = user.platformLabel?.trim() || "";
    if (platformLabel) {
      ecosystem.push({ ...user, profile: platformLabel });
      continue;
    }

    const memberships = user.memberships ?? [];
    if (memberships.length === 0) {
      unassigned.push(user);
      continue;
    }

    const seen = new Set<string>();
    for (const membership of memberships) {
      if (seen.has(membership.tenantId)) continue;
      seen.add(membership.tenantId);
      const current = clients.get(membership.tenantId) ?? {
        title: membership.spaceName,
        users: [],
      };
      current.users.push({
        ...user,
        profile: membership.roleLabel,
        memberships: [membership],
      });
      clients.set(membership.tenantId, current);
    }
  }

  const groups: MaintainedUserGroup[] = [];
  if (ecosystem.length > 0) {
    groups.push({ id: "ecosystem", title: "Ecosistema", users: ecosystem.sort(byDisplayName) });
  }
  for (const [id, group] of [...clients.entries()].sort((a, b) =>
    a[1].title.localeCompare(b[1].title, "es")
  )) {
    groups.push({ id, title: group.title, users: group.users.sort(byDisplayName) });
  }
  if (unassigned.length > 0) {
    groups.push({ id: "unassigned", title: "Sin cliente", users: unassigned.sort(byDisplayName) });
  }
  return groups;
}

const SPACE_PROFILES = new Set<OwnerProfileId>([
  "super_admin",
  "institution_admin",
  "support",
  "admissions",
  "student_affairs",
  "communications",
  "reviewer",
  "guest",
]);

export function isOwnerProfileId(value: string): value is OwnerProfileId {
  return (OWNER_PROFILE_IDS as readonly string[]).includes(value);
}

export function profileNeedsSpace(profile: OwnerProfileId): boolean {
  return SPACE_PROFILES.has(profile);
}

export function labelOwnerProfile(profile: OwnerProfileId): string {
  if (profile === "platform_owner") return `Dueño de ${PLATFORM_DISPLAY_NAME}`;
  if (profile === "platform_operator") return "Operador de usuarios";
  return labelSpaceRole(profile);
}
