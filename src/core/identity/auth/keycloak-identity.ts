/**
 * Identidad del realm de plataforma.
 * El id técnico no es la marca: Growth OS es la plataforma.
 * SEM, ADL, Mentor Prime Capacitación y Fundación Mueve son Espacios equivalentes.
 */

/** Id técnico del realm. No renombrar: usuarios, sesiones y callbacks dependen de él. */
export const KEYCLOAK_REALM_TECHNICAL_ID = "seminario-ipn";

/** Nombre visible del realm (Display Name). No es un Espacio. */
export const KEYCLOAK_REALM_DISPLAY_NAME = "Growth OS";

/** Tema de login de la plataforma. Lo usan growth-os-web y growth-os-dev. */
export const KEYCLOAK_GROWTH_OS_LOGIN_THEME = "growth-os";

/** Tema de login solo del cliente del Espacio SEM. */
export const KEYCLOAK_SEM_SPACE_LOGIN_THEME = "sem";

/** Cliente OAuth del Espacio SEM. No es el acceso de plataforma. */
export const SEM_SPACE_KEYCLOAK_CLIENT_ID = "seminario-ipn-web";

export const GROWTH_OS_KEYCLOAK_CLIENT_IDS = ["growth-os-web", "growth-os-dev"] as const;
