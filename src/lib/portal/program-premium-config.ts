import type { ProgramItem } from "@/types/content";

export interface ProgramPremiumFilter {
  id: string;
  label: string;
  match: (program: ProgramItem) => boolean;
}

function programText(program: ProgramItem): string {
  const parts = [
    program.title,
    program.category,
    program.certification,
    ...(program.categories ?? []),
  ];
  return parts.filter(Boolean).join(" ");
}

/** Filtros de catálogo premium — Diplomas, Certificados, Cursos, Especializaciones */
export const DEFAULT_PREMIUM_PROGRAM_FILTERS: ProgramPremiumFilter[] = [
  {
    id: "all",
    label: "Todos",
    match: () => true,
  },
  {
    id: "diplomas",
    label: "Diplomas",
    match: (p) => /diploma/i.test(programText(p)),
  },
  {
    id: "certificados",
    label: "Certificados",
    match: (p) => /certificado/i.test(programText(p)),
  },
  {
    id: "cursos",
    label: "Cursos",
    match: (p) => /curso/i.test(programText(p)),
  },
  {
    id: "especializaciones",
    label: "Especializaciones",
    match: (p) => /especializaci[oó]n/i.test(programText(p)),
  },
];

export interface ProgramsHelpCtaConfig {
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}

export const DEFAULT_PROGRAMS_HELP_CTA: ProgramsHelpCtaConfig = {
  title: "¿No sabes qué programa es para ti?",
  description: "Nuestro equipo de admisiones puede orientarte en tu proceso.",
  primaryLabel: "Hablar con admisiones",
  primaryHref: "/contacto",
  secondaryLabel: "Ver guía de programas",
  secondaryHref: "/admision",
};

export interface ProgramsPagePremiumDefaults {
  overline: string;
  title: string;
  description: string;
  cardCtaLabel: string;
  pageSize: number;
  showHelpCta: boolean;
  help: ProgramsHelpCtaConfig;
}

export const DEFAULT_PROGRAMS_PAGE_PREMIUM: ProgramsPagePremiumDefaults = {
  overline: "PROGRAMAS FORMATIVOS",
  title: "Nuestros programas",
  description:
    "Formación bíblica y pastoral 100% online, diseñada para equiparte y fortalecer tu llamado ministerial.",
  cardCtaLabel: "Conocer programa",
  pageSize: 9,
  showHelpCta: true,
  help: DEFAULT_PROGRAMS_HELP_CTA,
};

export const DEFAULT_PROGRAMS_HOME_PREMIUM = {
  pageSize: 3,
  showPagination: true,
  showHelpCta: true,
} as const;
