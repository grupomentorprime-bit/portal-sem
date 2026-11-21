/** Clase de una aplicación del escritorio. */
export type AppClass = "essential" | "transversal" | "specialized";

/**
 * Dónde vive la aplicación.
 * `internal` corre en este proceso. `connect` sale por el protocolo ya existente.
 * `unassigned` está registrada y todavía no se abre desde la mesa.
 */
export type AppIntegration = "internal" | "connect" | "unassigned";

/** Qué pasa con el contrato cuando el Espacio no trae el campo. */
export type DefaultContract =
  | { when: "never" }
  | { when: "field-missing"; spaceId?: string };

/** Cómo se abre. Los datos viven aquí; la lógica de cada aplicación, no. */
export type OpenDeclaration =
  | { type: "none" }
  | { type: "internal"; href: string }
  | { type: "connect"; channel: "rrhh"; missing: "later" }
  | { type: "connect-or-https"; channel: "aprende-hoy" }
  | { type: "connect-in-space"; channel: "cumple"; missing: "disconnected" };

export interface AppManifest {
  id: string;
  class: AppClass;
  integration: AppIntegration;
  label: string;
  blurb: string;
  /** Puede persistirse en `contractedApps`. */
  contractable: boolean;
  defaultContract: DefaultContract;
  /** La apertura solo procede en este Espacio. */
  requiresSpaceId?: string;
  open: OpenDeclaration;
}
