export interface ConvocatoriaGenerationOption {
  value: string;
  label: string;
}

/** Catálogo institucional de generaciones / programas para convocatorias. */
export const CONVOCATORIA_GENERATIONS: ConvocatoriaGenerationOption[] = [
  {
    value: "G-2023",
    label: "Diploma Teología Bíblica — G-2023 (Pastores(as))",
  },
  {
    value: "G-2024",
    label: "Diploma Teología Bíblica — G-2024",
  },
  {
    value: "G-2025",
    label: "Diploma Teología Bíblica — G-2025",
  },
  {
    value: "G-2026",
    label: "Diploma Teología Bíblica — G-2026",
  },
  {
    value: "staff",
    label: "Equipo docente / administrativo",
  },
  {
    value: "other",
    label: "Otros",
  },
];

const GENERATION_ALIASES: Record<string, string> = {
  g2023: "G-2023",
  "g-2023": "G-2023",
  "g2023-pastoral": "G-2023",
  "diploma-teologia-biblica-pastoral-g2023": "G-2023",
  g2024: "G-2024",
  "g-2024": "G-2024",
  "diploma-teologia-biblica-pastores-g2024": "G-2024",
  g2025: "G-2025",
  "g-2025": "G-2025",
  "diploma-teologia-biblica-hermanos-g2025": "G-2025",
  g2026: "G-2026",
  "g-2026": "G-2026",
  "diploma-teologia-biblica-hermanos-g2026": "G-2026",
  staff: "staff",
  "equipo docente / administrativo": "staff",
  "equipo docente": "staff",
  other: "other",
  otro: "other",
};

const GENERATION_LABELS = Object.fromEntries(
  CONVOCATORIA_GENERATIONS.map((option) => [option.value, option.label])
) as Record<string, string>;

export function normalizeGenerationValue(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const byAlias = GENERATION_ALIASES[raw.toLowerCase()];
  if (byAlias) return byAlias;

  const yearMatch = raw.match(/\bG[-\s]?(\d{4})\b/i);
  if (yearMatch) return `G-${yearMatch[1]}`;

  if (GENERATION_LABELS[raw]) return raw;

  return raw;
}

export function formatGenerationDisplay(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";

  const canonical = normalizeGenerationValue(raw);
  return GENERATION_LABELS[canonical] ?? raw;
}

/** Código corto de generación para informes y tablas (p. ej. G-2023). */
export function formatGenerationCode(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";

  const canonical = normalizeGenerationValue(raw);
  if (canonical === "staff") return "Equipo";
  if (canonical === "other") return "Otros";
  if (canonical && GENERATION_LABELS[canonical]) return canonical;

  const codeInRaw = raw.match(/\bG-(\d{4})\b/i);
  if (codeInRaw) return `G-${codeInRaw[1]}`;

  const yearOnly = raw.match(/\b(20\d{2})\b/);
  if (yearOnly) return `G-${yearOnly[1]}`;

  for (const [code, label] of Object.entries(GENERATION_LABELS)) {
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
  return Boolean(canonical && GENERATION_LABELS[canonical]);
}
