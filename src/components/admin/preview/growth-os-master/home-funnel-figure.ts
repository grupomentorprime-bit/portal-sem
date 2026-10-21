/**
 * Figura del embudo en Inicio.
 * Las etapas son stock abierto actual. Ganadas del período, si entra, es un
 * resultado comercial aparte (no etapa ni secuencia). El ancho es silueta:
 * no sigue el conteo y no convierte el stock en una cohorte histórica.
 */

import type { GrowthOsHomeFunnel } from "./project-home";

export interface GrowthOsHomeFunnelFigureRow {
  key: string;
  label: string;
  count: number;
  /**
   * Etapa: participación del stock activo.
   * Resultado: siempre null (la tasa de cohorte vive en el indicador del título).
   */
  percent: number | null;
  role: "stage" | "result";
}

export interface GrowthOsHomeFunnelFigure {
  funnelLabel: string;
  stockDenominator: string;
  rows: GrowthOsHomeFunnelFigureRow[];
}

/** Progresión de la maqueta. El verde final queda reservado a Ganadas. */
export const FUNNEL_OPEN_STAGE_COLORS = [
  "#5B2DE0",
  "#8278FB",
  "#4E9FFF",
  "#52C3EF",
  "#5FD09C",
] as const;

export const FUNNEL_RESULT_COLOR = "#3AAA4C";

export function buildHomeFunnelFigure(
  funnel: GrowthOsHomeFunnel | null
): GrowthOsHomeFunnelFigure | null {
  if (!funnel || funnel.stages.length === 0 || funnel.stockTotal <= 0) return null;

  const rows: GrowthOsHomeFunnelFigureRow[] = funnel.stages.map((stage) => ({
    key: stage.key,
    label: stage.label,
    count: stage.count,
    percent: stage.shareOfStock,
    role: "stage",
  }));

  if (funnel.periodWon > 0) {
    rows.push({
      key: "period-won",
      label: "Ganadas del período",
      count: funnel.periodWon,
      percent: null,
      role: "result",
    });
  }

  return {
    funnelLabel: funnel.funnelLabel,
    stockDenominator: funnel.stockDenominator,
    rows,
  };
}

/** Corte de la silueta, de arriba (100) hacia la boca. Independiente del conteo. */
export function funnelSilhouetteEdge(
  index: number,
  segments: number,
  endPercent: number
): number {
  const start = 100;
  const end = segments <= 1 ? 72 : endPercent;
  if (segments <= 0) return start;
  const t = Math.min(1, Math.max(0, index / segments));
  return start - (start - end) * Math.pow(t, 0.8);
}

/** Boca mínima para que la cantidad de la última franja siga dentro del color. */
export function funnelSilhouetteEnd(lastCount: number): number {
  const glyphs = new Intl.NumberFormat("es").format(lastCount).length;
  if (glyphs <= 1) return 18;
  if (glyphs === 2) return 20;
  if (glyphs === 3) return 30;
  if (glyphs === 4) return 38;
  return 46;
}

function mixHex(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    const n = Number.parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, (n >> 0) & 255] as const;
  };
  const from = parse(a);
  const to = parse(b);
  const mixed = from.map((channel, i) =>
    Math.round(channel + (to[i]! - channel) * t)
  );
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

export function funnelSegmentColor(
  index: number,
  stageCount: number,
  role: GrowthOsHomeFunnelFigureRow["role"]
): string {
  if (role === "result") return FUNNEL_RESULT_COLOR;
  const scale = FUNNEL_OPEN_STAGE_COLORS;
  if (stageCount <= 1) return scale[0];
  const clamped = Math.min(Math.max(index, 0), stageCount - 1);
  if (stageCount <= scale.length) {
    return scale[clamped]!;
  }
  const scaled = (clamped / (stageCount - 1)) * (scale.length - 1);
  const i = Math.min(scale.length - 2, Math.floor(scaled));
  return mixHex(scale[i]!, scale[i + 1]!, scaled - i);
}
