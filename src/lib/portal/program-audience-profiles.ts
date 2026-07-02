/**
 * Perfiles de audiencia — bloque "¿Este seminario es para ti?"
 */

export const PROGRAM_AUDIENCE_PROFILES = [
  {
    id: "pastores",
    title: "Pastores",
    description: "Formación para quienes guían y pastorean congregaciones",
    href: "/programas?perfil=pastores",
    icon: "Users" as const,
  },
  {
    id: "hermanos",
    title: "Hermanos(as)",
    description: "Profundiza en las Escrituras y fortalece tu servicio",
    href: "/programas?perfil=hermanos",
    icon: "BookOpen" as const,
  },
  {
    id: "lideres",
    title: "Líderes",
    description: "Herramientas bíblicas para el liderazgo en la Iglesia",
    href: "/programas?perfil=lideres",
    icon: "GraduationCap" as const,
  },
  {
    id: "nuevos",
    title: "Nuevos estudiantes",
    description: "Conoce el proceso de admisión y requisitos de ingreso",
    href: "/admision",
    icon: "Sparkles" as const,
  },
] as const;

export type ProgramAudienceProfileId =
  (typeof PROGRAM_AUDIENCE_PROFILES)[number]["id"];
