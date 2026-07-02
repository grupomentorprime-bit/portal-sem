import type { ProgramItem } from "@/types/content";
import { PROGRAM_CARD_FALLBACKS } from "@/lib/portal/program-demo-assets";
import { isSemProgramPricingVisible } from "@/lib/portal/sem-program-pricing";

export type ProgramBadgeTone =
  | "institutional"
  | "generation"
  | "online"
  | "admission"
  | "continuing"
  | "coming-soon"
  | "default";

export interface ProgramEconomics {
  enrollmentFee: string;
  monthlyFee: string;
  paymentNote: string;
}

const DEFAULT_ECONOMICS: ProgramEconomics = {
  enrollmentFee: "$20.000",
  monthlyFee: "$15.000",
  paymentNote: "4 cuotas semestrales",
};

export function resolveProgramImage(program: ProgramItem, index = 0): string {
  if (program.image?.trim()) return program.image.trim();
  return PROGRAM_CARD_FALLBACKS[index % PROGRAM_CARD_FALLBACKS.length];
}

/** Badges semánticos: online, admisión, generación, nuevo */
export function resolveProgramBadges(program: ProgramItem): Array<{
  label: string;
  tone: ProgramBadgeTone;
}> {
  const badges: Array<{ label: string; tone: ProgramBadgeTone }> = [];

  if (program.status === "coming_soon") {
    return [{ label: "Próximamente", tone: "coming-soon" }];
  }

  if (/online|100%/i.test(program.modality ?? "")) {
    badges.push({ label: "Online", tone: "online" });
  }

  const category = program.category?.trim();
  if (category && /generaci[oó]n/i.test(category)) {
    badges.push({ label: category, tone: "generation" });
  } else {
    const idMatch = program.id.match(/g(\d{4})/i);
    if (idMatch) {
      badges.push({ label: `Generación ${idMatch[1]}`, tone: "generation" });
    }
  }

  if (program.status === "admission_open") {
    badges.push({ label: "Admisión abierta", tone: "admission" });
  }

  return badges.slice(0, 3);
}

/** @deprecated Usar resolveProgramBadges */
export function resolveGenerationBadge(program: ProgramItem): {
  label: string;
  tone: ProgramBadgeTone;
} | null {
  if (program.status === "coming_soon") {
    return { label: "Próximamente", tone: "coming-soon" };
  }

  const category = program.category?.trim();
  if (category && /generaci[oó]n/i.test(category)) {
    return { label: category, tone: "generation" };
  }

  const idMatch = program.id.match(/g(\d{4})/i);
  if (idMatch) {
    return { label: `Generación ${idMatch[1]}`, tone: "generation" };
  }

  const badge = program.badge?.trim();
  if (badge && /generaci[oó]n|g[- ]?\d{4}/i.test(badge)) {
    return { label: badge.replace(/^generaci[oó]n\s*/i, "Generación "), tone: "generation" };
  }

  if (program.status === "admission_open") {
    const yearMatch = program.id.match(/g20(\d{2})/i);
    if (yearMatch) {
      return { label: `Admisión 20${yearMatch[1]}`, tone: "institutional" };
    }
  }

  return null;
}

export function resolveProgramEconomics(program: ProgramItem): ProgramEconomics | null {
  if (!isSemProgramPricingVisible() || program.showPrice === false) return null;

  const enrollment = program.enrollmentFee?.trim();
  const monthly = program.monthlyFee?.trim();
  const note = program.paymentNote?.trim();

  if (enrollment || monthly) {
    return {
      enrollmentFee: enrollment || DEFAULT_ECONOMICS.enrollmentFee,
      monthlyFee: monthly || DEFAULT_ECONOMICS.monthlyFee,
      paymentNote: note || DEFAULT_ECONOMICS.paymentNote,
    };
  }

  if (program.price?.trim()) {
    return DEFAULT_ECONOMICS;
  }

  return DEFAULT_ECONOMICS;
}

export function resolveProgramCtaLabel(
  program: ProgramItem,
  fallback: string
): string {
  const label = program.ctaPrimaryLabel?.trim() || fallback;
  if (/m[aá]s informaci[oó]n|ver programa/i.test(label)) return "Conocer programa";
  return label;
}

/** Divide títulos largos en dos líneas editoriales — evita cortes */
export function formatProgramTitleLines(title: string): [string, string] | null {
  const trimmed = title.trim();
  const diplomaEn = trimmed.match(/^(Diploma en)\s+(.+)$/i);
  if (diplomaEn) return [diplomaEn[1], diplomaEn[2]];

  const diploma = trimmed.match(/^(Diploma)\s+(.+)$/i);
  if (diploma) return [diploma[1], diploma[2]];

  const words = trimmed.split(/\s+/);
  if (words.length >= 4) {
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
  }

  return null;
}

export function resolveModalityDisplay(modality?: string): string {
  const trimmed = modality?.trim();
  if (!trimmed) return "";
  if (/100%|online/i.test(trimmed)) return "100% Online";
  return trimmed;
}

export function resolveStartDateDisplay(startDate?: string): string {
  return startDate?.trim() || "";
}

/** Badge opcional sobre la imagen (Más elegido, Nuevo, etc.) — solo desde CMS */
export function resolveProgramImageBadge(program: ProgramItem): {
  label: string;
  tone: ProgramBadgeTone;
} | null {
  const badge = program.badge?.trim();
  if (!badge) return null;

  if (/generaci[oó]n|g[- ]?\d{4}/i.test(badge)) return null;

  if (/m[aá]s elegido|destacado/i.test(badge)) {
    return { label: badge, tone: "institutional" };
  }
  if (/nuevo/i.test(badge)) {
    return { label: badge, tone: "admission" };
  }
  if (/admisi[oó]n/i.test(badge)) {
    return { label: badge, tone: "admission" };
  }

  return { label: badge, tone: "default" };
}
