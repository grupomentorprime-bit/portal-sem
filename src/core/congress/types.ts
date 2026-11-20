import type {
  CongressAttendanceDay,
  CongressNight,
} from "@/core/congress/constants";

export type CongressRegistrationSource = "form" | "import" | "door";

export type CongressIdentityStatus = "verified" | "provisional";

export interface CongressAttendanceDays {
  saturday: boolean | null;
  sunday: boolean | null;
}

export interface CongressRegistrationIdentity {
  fullName: string;
  rut: string | null;
  email: string | null;
  phone: string | null;
  status: CongressIdentityStatus;
}

export interface CongressRegistration {
  _id: string;
  tenantId: string;
  eventId: string;
  source: CongressRegistrationSource;
  /** Enlace a experience_form_submissions._id cuando source=form. */
  submissionId?: string | null;
  /**
   * Hora del envío del formulario público (ISO).
   * Solo enriquecimiento de API al listar; no se persiste en la inscripción.
   */
  formSubmittedAt?: string | null;
  /** Fila de importación confirmada (nunca auto-merge). */
  importRowId?: string | null;
  /** Huella del lote de importación que creó/vinculó esta ficha. */
  importBatchId?: string | null;
  zoneId: string;
  churchName: string;
  identity: CongressRegistrationIdentity;
  /** Día previsto declarado en Excel; no es asistencia efectiva. */
  expectedDayLabel?: string | null;
  /** Días previstos operativos; independientes de asistencia real. */
  expectedDays?: CongressAttendanceDays;
  /** Necesidad de alojamiento; default operativo unknown. */
  lodgingNeed?: "unknown" | "none" | "requested";
  /**
   * Líder del grupo de la iglesia (máx. 1 por iglesia+zona).
   * Puede coincidir con el jefe zonal.
   */
  isChurchGroupLeader?: boolean;
  /**
   * Jefe zonal (máx. 1 por zona).
   * Puede coincidir con el líder de una iglesia.
   */
  isZoneLeader?: boolean;
  attendance: CongressAttendanceDays;
  /**
   * Correlativo de ficha (1, 2, 3…).
   * Se asigna al crear. Al eliminar una ficha, las demás se renumeran
   * en el mismo orden, sin huecos.
   */
  entryNumber?: number | null;
  /** Primera hora de llegada por día (ISO servidor); no se sobrescribe. */
  attendanceMeta?: {
    saturdayMarkedAt?: string | null;
    sundayMarkedAt?: string | null;
  };
  /** Historial de cambios de asistencia (correcciones incluidas). */
  attendanceHistory?: CongressAttendanceHistoryEntry[];
  /** Cargo en CLP; null si no hay persona identificada. */
  chargeAmountClp: number | null;
  /** Historial de exención / restauración de cargo. */
  chargeHistory?: CongressChargeHistoryEntry[];
  allocatedPaidClp: number;
  needsReview: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type CongressLodgingNeed = NonNullable<CongressRegistration["lodgingNeed"]>;

export interface CongressAttendanceHistoryEntry {
  day: CongressAttendanceDay;
  previousPresent: boolean | null;
  nextPresent: boolean | null;
  previousMarkedAt: string | null;
  reason: string | null;
  at: string;
  actorUserId: string;
}

export type CongressChargeHistoryAction = "exempt" | "restore" | "reduce";

export interface CongressChargeHistoryEntry {
  action: CongressChargeHistoryAction;
  previousChargeAmountClp: number | null;
  nextChargeAmountClp: number | null;
  reason: string;
  at: string;
  actorUserId: string;
}

export interface CongressPaymentAllocation {
  registrationId: string;
  amountClp: number;
}

export type CongressPaymentStatus = "posted" | "voided";

export type CongressPaymentMethod = "cash" | "transfer" | "other";

export interface CongressPayment {
  _id: string;
  tenantId: string;
  eventId: string;
  /** Individuo o iglesia / grupo. */
  payerType: "individual" | "church" | "other";
  payerName: string;
  churchName?: string | null;
  amountClp: number;
  /** Medio de pago. Ausente = legacy (caja: Sin medio). */
  method?: CongressPaymentMethod;
  /** Día del pago YYYY-MM-DD (America/Santiago). Ausente = legacy. */
  paidOn?: string;
  receiptRef?: string | null;
  /** Folio correlativo CV-YYYY-#####. Requerido en pagos nuevos. */
  folio?: string | null;
  note?: string | null;
  allocations: CongressPaymentAllocation[];
  /** Monto del pago no imputado a participantes. */
  unallocatedClp: number;
  status: CongressPaymentStatus;
  voidedAt?: string | null;
  voidedByUserId?: string | null;
  voidReason?: string | null;
  /** Copia de imputaciones al anular (el movimiento original se conserva). */
  voidedAllocations?: CongressPaymentAllocation[] | null;
  createdByUserId: string;
  createdAt: string;
}

export interface CongressLodgingHome {
  _id: string;
  tenantId: string;
  eventId: string;
  name: string;
  contactName?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  notes?: string | null;
  capacityByNight: Record<CongressNight, number>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type CongressLodgingAssignmentStatus = "assigned" | "confirmed" | "cancelled";

export interface CongressLodgingAssignment {
  _id: string;
  tenantId: string;
  eventId: string;
  homeId: string;
  registrationId: string;
  night: CongressNight;
  status: CongressLodgingAssignmentStatus;
  confirmed: boolean;
  cancelledAt?: string | null;
  reassignedFromId?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CongressChurchLodgingRequest {
  _id: string;
  tenantId: string;
  eventId: string;
  zoneId: string;
  churchName: string;
  requestedBeds: number;
  source: "excel" | "manual";
  note?: string | null;
  createdAt: string;
}

/** Catálogo de ILEUs del evento (nómina / alta). No implica alojamiento. */
export interface CongressChurch {
  _id: string;
  tenantId: string;
  eventId: string;
  zoneId: string;
  churchName: string;
  source: "import" | "manual";
  importBatchId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CongressImportBatch {
  _id: string;
  tenantId: string;
  eventId: string;
  fileName: string;
  actorUserId: string;
  createdCount: number;
  churchCount: number;
  skipCount: number;
  createdAt: string;
}

export interface CongressAuditEntry {
  _id: string;
  tenantId: string;
  eventId: string;
  actorUserId: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type { CongressAttendanceDay, CongressNight };
