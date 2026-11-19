import { PLATFORM_DISPLAY_NAME } from "@/core/branding/display";

/** Operador institucional de NELZURI (sin datos personales). */
export const PLATFORM_SUPPORT_EMAIL = "soporte@mentorprime.cl";

/** Empresa operadora de NELZURI. */
export const PLATFORM_OPERATOR_NAME = "Mentor Prime";

export const PLATFORM_LEGAL_LAST_UPDATED = "2026-11-19";

export const PLATFORM_LEGAL_ROUTES = {
  index: "/legal",
  privacy: "/legal/privacidad",
  terms: "/legal/terminos",
  dataDeletion: "/legal/eliminacion-de-datos",
} as const;

export type PlatformLegalRouteKey = keyof typeof PLATFORM_LEGAL_ROUTES;

export const PLATFORM_LEGAL_NAV = [
  {
    href: PLATFORM_LEGAL_ROUTES.privacy,
    label: "Política de privacidad",
    shortLabel: "Privacidad",
  },
  {
    href: PLATFORM_LEGAL_ROUTES.terms,
    label: "Términos de servicio",
    shortLabel: "Términos",
  },
  {
    href: PLATFORM_LEGAL_ROUTES.dataDeletion,
    label: "Eliminación de datos",
    shortLabel: "Eliminación",
  },
] as const;

export function platformLegalTitle(documentName: string): string {
  return `${documentName} | ${PLATFORM_DISPLAY_NAME}`;
}
