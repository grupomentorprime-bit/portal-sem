import type { CohortRosterStat } from "@/lib/student-affairs/cohort-stats";

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
  /** Declararon inasistencia y presentaron excusa (por revisar, aceptada o en plazo). */
  withJustification: HandoffNominee[];
  /** Sin excusa válida: sin justificar, pendiente contacto o sin registro en formulario. */
  withoutJustification: HandoffNominee[];
  /** @deprecated Usar withoutJustification. */
  unjustified?: HandoffNominee[];
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
  /** Confirmación por programa/generación (nominados vs. confirmados). */
  cohortStats?: CohortRosterStat[];
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
