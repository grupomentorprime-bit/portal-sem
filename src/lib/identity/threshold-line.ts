/**
 * Frases del umbral. Sin IO.
 * La pública es un conteo. La de cruce describe la pantalla en la que la persona se queda.
 */

export const THRESHOLD_BREATH_MS = 700;

const ENTER_SPACE = "Entra a tu Espacio.";
const ENTER_SPACE_NOW = "Entras a tu Espacio.";
const ENTER_DESKTOP = "Entras a tu escritorio.";
const SPACE_CLEAR = "Este Espacio está al día.";
const ENTER_PLATFORM = "Entras a la plataforma.";
const NO_SPACE = "Todavía no tienes un Espacio.";
const ENTER_WORK = "Entras a tu trabajo.";
const NOTHING = "Nada pide atención ahora.";

export function publicThresholdLine(count: number | null): string {
  if (count == null || count < 0) return ENTER_SPACE;
  if (count === 0) return SPACE_CLEAR;
  if (count === 1) return "Hay 1 oportunidad esperando.";
  const formatted = new Intl.NumberFormat("es").format(count);
  return `Hay ${formatted} oportunidades esperando.`;
}

export function redirectPath(redirectTo: string): string {
  const withoutFragment = redirectTo.split("#")[0] ?? "";
  return withoutFragment.split("?")[0] ?? "";
}

export function crossingMayResolveAccess(path: string, hasTenant: boolean): boolean {
  return path === "/admin" && hasTenant;
}

export function crossingNeedsPanel(
  path: string,
  flags: { hasTenant: boolean; studentAffairs: boolean; canSales: boolean }
): boolean {
  return (
    crossingMayResolveAccess(path, flags.hasTenant) &&
    !flags.studentAffairs &&
    flags.canSales
  );
}

export interface ThresholdAttentionRow {
  personaLabel: string;
  band: string | null;
  bandLabel: string;
}

function bandLine(row: ThresholdAttentionRow): string {
  const name = row.personaLabel.trim() || "Persona";
  if (row.band === "overdue") return `${name} está vencida.`;
  if (row.band === "unfollowed") return `${name} está sin seguimiento.`;
  if (row.band === "stale") return `${name} está estancada.`;
  const label = row.bandLabel.trim() || "Atención";
  return `${name} · ${label}.`;
}

export function crossingThresholdLine(input: {
  redirectTo: string;
  hasTenant: boolean;
  studentAffairs: boolean;
  canSales: boolean;
  attentionRows?: ThresholdAttentionRow[];
}): { line: string; announceArrival: boolean } {
  const path = redirectPath(input.redirectTo);
  if (path === "/platform" || path.startsWith("/platform/")) {
    return { line: ENTER_PLATFORM, announceArrival: false };
  }
  if (path === "/admin/sin-espacio") {
    return { line: NO_SPACE, announceArrival: false };
  }
  if (path === "/escritorio") {
    return { line: ENTER_DESKTOP, announceArrival: false };
  }
  if (path === "/admin" && input.studentAffairs) {
    return { line: ENTER_WORK, announceArrival: false };
  }
  if (path === "/admin" && !input.canSales) {
    return { line: ENTER_SPACE_NOW, announceArrival: false };
  }
  if (path === "/admin" && input.canSales) {
    if (!input.attentionRows) {
      return { line: ENTER_SPACE_NOW, announceArrival: false };
    }
    const first = input.attentionRows[0];
    if (!first) return { line: NOTHING, announceArrival: true };
    return { line: bandLine(first), announceArrival: true };
  }
  return { line: ENTER_WORK, announceArrival: false };
}

export function thresholdBreathMs(input: {
  nextLine: string | undefined;
  currentLine: string;
  reduceMotion: boolean;
}): number {
  const next = input.nextLine?.trim() ?? "";
  if (!next || next === input.currentLine || input.reduceMotion) return 0;
  return THRESHOLD_BREATH_MS;
}
