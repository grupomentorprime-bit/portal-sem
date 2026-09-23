import { buildDefaultSpaceHost } from "@/core/tenant/hosts";

/**
 * Dirección web inicial al crear un Espacio.
 * `{id}.{PLATFORM_BASE_DOMAIN}` o, sin base, `{id}.localhost:{puerto}`.
 * No hardcodea dominios de producto ni clientes.
 */
export function proposeInitialSpaceHost(
  spaceId: string,
  platformBaseDomain?: string | null
): string {
  const id = spaceId.trim().toLowerCase();
  if (!id) return "";

  return (
    buildDefaultSpaceHost(id, {
      baseDomain: platformBaseDomain?.trim() || null,
    }) ?? ""
  );
}
