export type StudentAffairsOperationsPhase = "on-site" | "follow-up";

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
}

export interface StudentAffairsFormOperations {
  tenant: string;
  formId: string;
  phase: StudentAffairsOperationsPhase;
  onSiteClosedAt?: string;
  onSiteClosedByUserId?: string;
  onSiteClosedByName?: string;
  handoffReport?: StudentAffairsHandoffReport;
  updatedAt: string;
}
