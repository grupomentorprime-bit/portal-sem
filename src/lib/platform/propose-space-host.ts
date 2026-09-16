import { buildPlatformSubdomainHost } from "@/core/tenant/hosts";

/**
 * Dirección web inicial al crear un Espacio.
 * Con PLATFORM_BASE_DOMAIN → `{id}.{base}`; sin base → `{id}.localhost:3000` (dev).
 * No hardcodea dominios de producto ni clientes.
 */
export function proposeInitialSpaceHost(
  spaceId: string,
  platformBaseDomain?: string | null
): string {
  const id = spaceId.trim().toLowerCase();
  if (!id) return "";

  const base = platformBaseDomain?.trim() || null;
  if (base) {
    return (
      buildPlatformSubdomainHost(id, { baseDomain: base }) ??
      `${id}.${base.toLowerCase()}`
    );
  }

  return `${id}.localhost:3000`;
}
