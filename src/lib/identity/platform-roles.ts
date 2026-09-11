import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type { IdentityUser } from "@/types/identity";
import {
  isPlatformRoleCode,
  normalizePlatformRoles,
  type PlatformRoleCode,
} from "@/core/identity/platform/codes";
import { writeAudit } from "@/lib/identity/audit";
import { findUserById } from "@/lib/identity/users";

export async function setUserPlatformRoles(input: {
  userId: string;
  roles: PlatformRoleCode[];
  actorUserId?: string;
}): Promise<IdentityUser> {
  const roles = normalizePlatformRoles(input.roles);
  if (input.roles.some((code) => !isPlatformRoleCode(code))) {
    throw new Error("Rol de plataforma inválido.");
  }

  const user = await findUserById(input.userId);
  if (!user) {
    throw new Error("Usuario no encontrado.");
  }

  const previous = normalizePlatformRoles(user.platformRoles);
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.collection<IdentityUser>("identity_users").updateOne(
    { _id: input.userId },
    { $set: { platformRoles: roles, updatedAt: now } }
  );

  const action = roles.length === 0 ? "platform.role.revoke" : "platform.role.grant";
  await writeAudit({
    scope: "platform",
    userId: input.actorUserId ?? input.userId,
    action,
    entity: "user",
    entityId: input.userId,
    metadata: { previous, roles },
  });

  const updated = await findUserById(input.userId);
  if (!updated) {
    throw new Error("Usuario no encontrado.");
  }
  return updated;
}
