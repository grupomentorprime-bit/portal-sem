import { ensureSpecializedCapabilities } from "@/lib/desktop/register-specialized";
import { formCatalogFor, generationOverlay } from "@/nelzuri";
import { SEM_CONVOCATORIA_GENERATIONS } from "@/lib/portal/sem-forms";

export interface ConvocatoriaGenerationOption {
  value: string;
  label: string;
}

export { SEM_CONVOCATORIA_GENERATIONS };

/** Catálogo de plataforma — sin cohortes de cliente. */
export const PLATFORM_CONVOCATORIA_GENERATIONS: ConvocatoriaGenerationOption[] = [
  {
    value: "staff",
    label: "Equipo docente / administrativo",
  },
  {
    value: "other",
    label: "Otros",
  },
];

/** @deprecated Preferir getConvocatoriaGenerations(tenant) */
export const CONVOCATORIA_GENERATIONS = SEM_CONVOCATORIA_GENERATIONS;

export function getConvocatoriaGenerations(
  tenantId: string
): ConvocatoriaGenerationOption[] {
  ensureSpecializedCapabilities();
  const catalog = formCatalogFor(tenantId);
  if (!catalog) return PLATFORM_CONVOCATORIA_GENERATIONS.map((item) => ({ ...item }));
  return catalog.generations.map((item) => ({ ...item }));
}

function generationMaps(): { aliases: Record<string, string>; labels: Record<string, string> } {
  ensureSpecializedCapabilities();
  const overlay = generationOverlay();
  const labels = { ...overlay.labels };
  for (const option of PLATFORM_CONVOCATORIA_GENERATIONS) {
    if (!labels[option.value]) labels[option.value] = option.label;
  }
  return { aliases: overlay.aliases, labels };
}

export function normalizeGenerationValue(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const { aliases } = generationMaps();
  const byAlias = aliases[raw.toLowerCase()];
  if (byAlias) return byAlias;

  const yearMatch = raw.match(/\bG[-\s]?(\d{4})\b/i);
  if (yearMatch) return `G-${yearMatch[1]}`;

  if (generationMaps().labels[raw]) return raw;

  return raw;
}

export function formatGenerationDisplay(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";

  const canonical = normalizeGenerationValue(raw);
  return generationMaps().labels[canonical] ?? raw;
}

/** Código corto de generación para informes y tablas (p. ej. G-2023). */
export function formatGenerationCode(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";

  const canonical = normalizeGenerationValue(raw);
  const labels = generationMaps().labels;
  if (canonical === "staff") return "Equipo";
  if (canonical === "other") return "Otros";
  if (canonical && labels[canonical]) return canonical;

  const codeInRaw = raw.match(/\bG-(\d{4})\b/i);
  if (codeInRaw) return `G-${codeInRaw[1]}`;

  const yearOnly = raw.match(/\b(20\d{2})\b/);
  if (yearOnly) return `G-${yearOnly[1]}`;

  for (const [code, label] of Object.entries(labels)) {
    if (raw.toLowerCase() === label.toLowerCase()) return code;
    const codeInLabel = label.match(/\bG-(\d{4})\b/);
    if (codeInLabel && label.toLowerCase().includes(raw.toLowerCase()) && raw.length >= 6) {
      return code;
    }
  }

  if (canonical) {
    const codeInCanonical = canonical.match(/\bG-(\d{4})\b/i);
    if (codeInCanonical) return `G-${codeInCanonical[1]}`;
    return canonical;
  }

  return raw;
}

export function isKnownGeneration(value: unknown): boolean {
  const canonical = normalizeGenerationValue(value);
  return Boolean(canonical && generationMaps().labels[canonical]);
}
