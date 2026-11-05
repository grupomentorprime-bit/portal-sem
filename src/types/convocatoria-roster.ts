import type { AbsenceContactLogEntry } from "@/types/experience-forms";

export interface ConvocatoriaRosterStudent {
  id: string;
  rut?: string;
  fullName: string;
  generation: string;
  phone?: string;
  /** Correo registrado por operador (nómina sin respuesta al formulario). */
  email?: string;
  /** Gestiones de contacto antes de crear registro de inasistencia. */
  outreachLog?: AbsenceContactLogEntry[];
}

/** Alumno fuera de la nómina pública: no puede marcar asistencia por sí mismo. */
export interface ConvocatoriaExcludedStudent extends ConvocatoriaRosterStudent {
  reason: string;
  excludedAt: string;
  sourceFormId?: string;
}

export interface ConvocatoriaRoster {
  tenant: string;
  convocatoriaSlug: string;
  formId: string;
  students: ConvocatoriaRosterStudent[];
  /**
   * Desertores u otros bloqueados.
   * Solo Asuntos Estudiantiles / Soporte / Administración pueden reincorporarlos.
   */
  excludedStudents?: ConvocatoriaExcludedStudent[];
  updatedAt: string;
}
