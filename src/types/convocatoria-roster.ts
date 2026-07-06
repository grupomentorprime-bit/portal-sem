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

export interface ConvocatoriaRoster {
  tenant: string;
  convocatoriaSlug: string;
  formId: string;
  students: ConvocatoriaRosterStudent[];
  updatedAt: string;
}
