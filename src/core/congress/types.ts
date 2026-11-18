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
  attendance: CongressAttendanceDays;
  /** Primera hora de llegada por día (ISO servidor); no se sobrescribe. */
  attendanceMeta?: {
    saturdayMarkedAt?: string | null;
    sundayMarkedAt?: string | null;
  };
  /** Historial de cambios de asistencia (correcciones incluidas). */
  attendanceHistory?: CongressAttendanceHistoryEntry[];
  /** Cargo en CLP; null si no hay persona identificada. */
  chargeAmountClp: number | null;
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

export interface CongressPaymentAllocation {
  registrationId: string;
  amountClp: number;
}

export type CongressPaymentStatus = "posted" | "voided";

export interface CongressPayment {
  _id: string;
  tenantId: string;
  eventId: string;
  /** Individuo o iglesia / grupo. */
  payerType: "individual" | "church" | "other";
  payerName: string;
  churchName?: string | null;
  amountClp: number;
  receiptRef?: string | null;
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
