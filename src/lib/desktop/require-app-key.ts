import "server-only";

import { redirect } from "next/navigation";
import { hasAppKey } from "@/lib/desktop/app-access";
import type { MentorAppId } from "@/lib/desktop/catalog";
import { readSpaceContract } from "@/lib/desktop/store";
import { loadSessionContext } from "@/lib/identity/sessions";

/**
 * Exige llave de aplicación en el Espacio activo.
 * Sin membresía o sin llave → escritorio (no alcanza con ocultar el icono).
 */
export async function requireAppKey(
  appId: MentorAppId,
  options?: { denyTo?: string }
): Promise<void> {
  const session = await loadSessionContext();
  const tenantId = session?.session.tenantId?.trim() ?? "";
  if (!session || !tenantId || !session.membership) {
    redirect(`/login?next=${encodeURIComponent("/escritorio")}`);
  }

  const contract = await readSpaceContract(tenantId);
  const allowed = hasAppKey(appId, {
    contracted: contract.contracted,
    authorizedApps: session.membership.authorizedApps ?? null,
  });
  if (!allowed) {
    redirect(options?.denyTo ?? "/escritorio");
  }
}
