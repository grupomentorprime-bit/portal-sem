/**
 * Clase de una aplicación del escritorio.
 * Las capacidades esenciales de NELZURI no son aplicaciones y no usan este tipo.
 */
export type AppClass = "transversal" | "specialized";

/**
 * Dónde vive la aplicación.
 * `internal` y `connect` ya están integradas.
 * `pending` está identificada y todavía no se integra.
 */
export type AppIntegration = "internal" | "connect" | "pending";

/**
 * Publicación del manifiesto.
 * `draft` no es un servicio operativo. `retired` deja de ofrecerse.
 */
export type AppPublication = "draft" | "published" | "retired";

/**
 * Qué se asume solo cuando un documento antiguo no trae `contractedApps`.
 * Una lista guardada, aunque esté vacía, no usa esta regla.
 */
export type DefaultContract =
  | { when: "never" }
  | { when: "field-missing"; spaceId?: string };

/**
 * Puerta que ya existe para una capacidad especializada.
 * No contrata, no crea un permiso y no abre otra ruta.
 */
export interface SpecializedDoor {
  /** Alcanza cualquiera de estos permisos. */
  anyPermission: readonly string[];
  /**
   * Unidad dueña.
   * Solo se exige cuando la membresía está recortada a unidades.
   */
  unitId?: string;
}

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
  /** Revisión del manifiesto en este despliegue. */
  version: string;
  publication: AppPublication;
  label: string;
  blurb: string;
  /** Puede persistirse en `contractedApps`. */
  contractable: boolean;
  /**
   * Rubros a los que orienta. No restringe el contrato ni la solicitud.
   * Una aplicación pendiente no declara rubro: no se recomienda como operativa.
   */
  sectors?: readonly string[];
  defaultContract: DefaultContract;
  /** La apertura solo procede en este Espacio. */
  requiresSpaceId?: string;
  /** Capacidad especializada. Ausente en una aplicación transversal. */
  door?: SpecializedDoor;
  open: OpenDeclaration;
}
