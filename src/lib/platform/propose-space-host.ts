import { buildDefaultSpaceHost } from "@/core/tenant/hosts";

/**
 * Dirección web inicial al crear un Espacio.
 * `{id}.{SPACE_BASE_DOMAIN}`. Sin esa base, `{id}.localhost:{puerto}`.
 * No usa APP_URL.
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
