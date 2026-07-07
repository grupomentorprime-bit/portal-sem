export type StudentAffairsOperationsPhase = "on-site" | "follow-up";

export type HandoffValidationStatus = "pending" | "validated";

export interface HandoffNominee {
  fullName: string;
  rut?: string;
  generation?: string;
  email?: string;
  phone?: string;
  note?: string;
}

export interface HandoffNominations {
  /** Confirmaron asistencia pero no registraron check-in presencial. */
  noAttendance: HandoffNominee[];
  /** Inasistencias sin justificación válida o sin registro en formulario. */
  unjustified: HandoffNominee[];
}

export interface StudentAffairsHandoffReport {
  generatedAt: string;
  /** Operador que cerró la jornada y entregó el informe. */
  closedByName: string;
  closedByUserId?: string;
  closedAt: string;
  respondieron: number;
  confirmaron: number;
  asistieron: number;
  sinAsistir: number;
  inasistencias: number;
  porRevisar: number;
  sinRegistrarNiJustificar: number;
  pendienteContacto: number;
  plazoJustificacion: number;
  nominations?: HandoffNominations;
}

export interface StudentAffairsFormOperations {
  tenant: string;
  formId: string;
  phase: StudentAffairsOperationsPhase;
  onSiteClosedAt?: string;
  onSiteClosedByUserId?: string;
  onSiteClosedByName?: string;
  handoffReport?: StudentAffairsHandoffReport;
  /** Pendiente de validación por encargado de gestión. */
  handoffValidationStatus?: HandoffValidationStatus;
  handoffValidatedAt?: string;
  handoffValidatedByUserId?: string;
  handoffValidatedByName?: string;
  updatedAt: string;
}
