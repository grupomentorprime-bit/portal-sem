/**
 * Capacidades del núcleo. No se contratan y no dependen de una aplicación.
 */
export const NELZURI_CAPABILITIES = [
  "escritorio",
  "identidad",
  "clientes",
  "espacios",
  "usuarios",
  "membresias",
  "permisos",
  "catalogo",
  "administracion",
] as const;

export type NelzuriCapability = (typeof NELZURI_CAPABILITIES)[number];

/** Siguen disponibles aunque el Espacio no contrate ninguna aplicación. */
export function availableCoreCapabilities(): readonly NelzuriCapability[] {
  return NELZURI_CAPABILITIES;
}
