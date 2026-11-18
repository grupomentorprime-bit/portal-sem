/** Primera pantalla al entrar a un cliente. */
export const SPACE_ENTRY_HOME = "/admin";

/**
 * Destino al pulsar entrar en un cliente.
 * Siempre Inicio, salvo que ese cliente ya esté activo y ya estés en Inicio.
 */
export function spaceEntryDestination(input: {
  pathname: string;
  spaceChanges: boolean;
}): string | null {
  const pathname = input.pathname.split("?")[0]?.split("#")[0] ?? "";
  if (!input.spaceChanges && pathname === SPACE_ENTRY_HOME) return null;
  return SPACE_ENTRY_HOME;
}
