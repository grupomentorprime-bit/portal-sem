/**
 * Valores económicos de programas — visibles solo en fase de admisiones.
 * Activar cuando matrícula y mensualidad estén publicadas oficialmente.
 */
export const SEM_PROGRAM_PRICING_VISIBLE = false;

export function isSemProgramPricingVisible(): boolean {
  return SEM_PROGRAM_PRICING_VISIBLE;
}
