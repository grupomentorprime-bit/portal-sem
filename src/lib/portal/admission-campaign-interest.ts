import { isSemTenant } from "@/core/tenant/is-sem";

/**
 * Interés de /admision/2027.
 *
 * El catálogo `academy_programs` solo guarda cohortes (G-2023…G-2026).
 * No existe un documento «Programa de Formación Teológica» ni una G-2027.
 * La línea vive en la página y el menú `/formacion/educacion-teologica`.
 * El programa de interés usa los campos ya existentes `programId` / `programLabel`.
 * La convocatoria usa `origin.campaign`, que ya existe en Growth.
 * No crea colecciones, documentos de catálogo ni migraciones.
 */
export const SEM_THEOLOGICAL_LINE_LABEL = "Educación Teológica";
export const SEM_THEOLOGICAL_PROGRAM_ID = "programa-formacion-teologica";
export const SEM_THEOLOGICAL_PROGRAM_LABEL = "Programa de Formación Teológica";
export const SEM_ADMISSION_2027_CAMPAIGN = "admision-2027";

export function isAdmission2027Campaign(value: unknown): boolean {
  return String(value ?? "").trim() === SEM_ADMISSION_2027_CAMPAIGN;
}

export function campaignForTheologicalAdmissionProgram(programId: string): string | undefined {
  return programId.trim() === SEM_THEOLOGICAL_PROGRAM_ID
    ? SEM_ADMISSION_2027_CAMPAIGN
    : undefined;
}

export interface SemAdmission2027Interest {
  programId: string;
  programLabel: string;
  lineLabel: string;
  campaign: string;
}

/** Una entrada de la campaña 2027 no puede quedar asociada a una cohorte. */
export function resolveSemAdmission2027Interest(input: {
  tenantId: string;
  campaign?: string;
}): SemAdmission2027Interest | null {
  if (!isSemTenant(input.tenantId) || !isAdmission2027Campaign(input.campaign)) return null;
  return {
    programId: SEM_THEOLOGICAL_PROGRAM_ID,
    programLabel: SEM_THEOLOGICAL_PROGRAM_LABEL,
    lineLabel: SEM_THEOLOGICAL_LINE_LABEL,
    campaign: SEM_ADMISSION_2027_CAMPAIGN,
  };
}
