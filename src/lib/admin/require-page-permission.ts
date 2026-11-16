import "server-only";

import { redirect } from "next/navigation";
import { can } from "@/core/identity/policies/engine";
import { readPlatformRoles } from "@/core/identity/platform/capability";
import { loadSessionContext } from "@/lib/identity/sessions";

/**
 * Redirige si la sesión no tiene al menos uno de los permisos.
 * Misma base que Canales: membresía activa + resolver de permisos.
 */
export async function requirePageAnyPermission(
  permissions: readonly string[],
  options: { nextPath: string; denyTo?: string }
): Promise<void> {
  const session = await loadSessionContext();
  const tenantId = session?.session.tenantId?.trim();
  if (!session || !tenantId || !session.membership) {
    redirect(`/login?next=${encodeURIComponent(options.nextPath)}`);
  }

  const { resolvePermissionsForMembership } = await import(
    "@/lib/identity/permission-resolver"
  );
  const resolved = await resolvePermissionsForMembership(tenantId, session.membership);
  const authCtx = {
    user: session.user,
    session: session.session,
    membership: session.membership,
    permissions: resolved,
    tenantId,
    platformRoles: readPlatformRoles(session.user),
    compatMode: false,
  };

  const allowed = permissions.some((permission) => can(authCtx, permission));
  if (!allowed) {
    redirect(options.denyTo ?? "/admin");
  }
}
