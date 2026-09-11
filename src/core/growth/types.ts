/**
 * OT-GROWTH-CORE-002/003/004 / ADR-010 — tipos Growth Core.
 * Persona + Origen (002); Oportunidad + nextAction (003); Actividad (004).
 * No es identity_users, content_people ni portal_interesados.
 */

export const GROWTH_PERSONAS_COLLECTION = "growth_personas" as const;
export const GROWTH_OPORTUNIDADES_COLLECTION = "growth_oportunidades" as const;
export const GROWTH_ACTIVIDADES_COLLECTION = "growth_actividades" as const;
export const GROWTH_SPACE_CONFIG_COLLECTION = "growth_space_config" as const;

export type GrowthPersonaStatus = "active" | "merged" | "archived";

export type GrowthOriginKind =
  | "admission"
  | "form"
  | "event"
  | "manual"
  | "unknown";

/** Snapshot de primer toque / toque de intención. Sin attribution. */
export interface GrowthOrigin {
  kind: GrowthOriginKind;
  channel?: string;
  formId?: string;
  formDestination?: string;
  campaign?: string;
  referrer?: string;
  sourceCollection: string;
  sourceId: string;
  capturedAt: string;
}

export interface GrowthContactAlias {
  value: string;
  normalized: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface GrowthPersona {
  _id: string;
  tenantId: string;
  status: GrowthPersonaStatus;
  displayName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  emailNormalized?: string;
  phone?: string;
  phoneNormalized?: string;
  emails: GrowthContactAlias[];
  phones: GrowthContactAlias[];
  /** Primer Origen — inmutable tras el alta. */
  origin: GrowthOrigin;
  identityUserId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Entrada de Origen al upsert (capturedAt opcional → now). */
export type GrowthOriginInput = Omit<GrowthOrigin, "capturedAt"> & {
  capturedAt?: string;
};

export type GrowthActivityKind =
  | "form_submitted"
  | "application_received"
  | "opportunity_opened"
  | "opportunity_transitioned"
  | "next_action_set"
  | "note"
  | "contact"
  | "handoff"
  | "identity_updated"
  | "identity_conflict";

/**
 * Actividad append-only (ADR-010 §1.4). SSOT del timeline comercial.
 * Solo insert de negocio; `eventId` puede rellenarse tras publicar en core_events.
 */
export interface GrowthActivity {
  _id: string;
  tenantId: string;
  personaId: string;
  oportunidadId?: string;
  kind: GrowthActivityKind;
  summary: string;
  ingestKey?: string;
  sourceCollection?: string;
  sourceId?: string;
  /** Recorte mínimo (ids, estados). No el formulario entero. */
  payload?: Record<string, unknown>;
  /** Operador / actor cuando existe. */
  actorUserId?: string;
  occurredAt: string;
  /** Id en core_events si se publicó; ausencia = bus falló o no se intentó. */
  eventId?: string;
}

/** @deprecated Usar GrowthActivity — alias de compatibilidad CORE-002/003. */
export type GrowthActivityStub = GrowthActivity;

export interface UpsertGrowthPersonaInput {
  tenantId: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  /** Obligatorio en alta; ignorado en rematch (Origen inmutable). */
  origin: GrowthOriginInput;
  identityUserId?: string;
  /** Para ingestKey de conflicto / futura ingestión. */
  sourceCollection?: string;
  sourceId?: string;
  now?: string;
}

export type UpsertGrowthPersonaResult =
  | {
      ok: true;
      outcome: "created" | "matched";
      persona: GrowthPersona;
    }
  | { ok: false; reason: "missing_identity" }
  | {
      ok: false;
      reason: "identity_conflict";
      emailPersonaId: string;
      phonePersonaId: string;
      activity?: GrowthActivity;
    };

export interface UpdateGrowthPersonaContactInput {
  tenantId: string;
  personaId: string;
  email?: string;
  phone?: string;
  sourceCollection?: string;
  sourceId?: string;
  now?: string;
}

export type UpdateGrowthPersonaContactResult =
  | { ok: true; persona: GrowthPersona; changed: boolean }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "missing_identity" }
  | {
      ok: false;
      reason: "identity_conflict";
      emailPersonaId: string;
      phonePersonaId: string;
      activity?: GrowthActivity;
    };

/* ─── Oportunidad (ADR-010 §1.3 / §1.5 / §3) ─── */

export const GROWTH_BASE_OPPORTUNITY_TYPE_KEYS = [
  "inquiry",
  "registration",
  "conversion",
] as const;

export type GrowthBaseOpportunityTypeKey =
  (typeof GROWTH_BASE_OPPORTUNITY_TYPE_KEYS)[number];

export type GrowthOpportunityStatus =
  | "open"
  | "active"
  | "won"
  | "lost"
  | "handed_off"
  | "archived";

export type GrowthOpportunitySubjectType =
  | "program"
  | "form"
  | "event"
  | "topic"
  | "none";

export type GrowthNextActionKind =
  | "contact"
  | "review"
  | "handoff"
  | "wait"
  | "other";

/**
 * Próxima acción vigente (0..1). ADR-010 §1.5.
 * OT brief: what→summary, assigneeId→assigneeUserId; cerrar = null (sin motor de tareas).
 */
export interface GrowthNextAction {
  summary: string;
  dueAt?: string;
  assigneeUserId?: string;
  kind: GrowthNextActionKind;
  setAt: string;
}

export interface GrowthOpportunitySource {
  sourceCollection: string;
  sourceId: string;
}

export interface GrowthOpportunityHandoff {
  interesadoId?: string;
  delivered: boolean;
  externalId?: string;
  adapter?: string;
}

export interface GrowthOportunidad {
  _id: string;
  tenantId: string;
  personaId: string;
  typeKey: string;
  subjectType: GrowthOpportunitySubjectType;
  subjectId?: string;
  subjectLabel?: string;
  /** Origen de esta intención — inmutable al abrir. */
  origin: GrowthOrigin;
  /** Espejo de workflow_instances.currentState. */
  status: GrowthOpportunityStatus;
  workflowInstanceId: string;
  nextAction: GrowthNextAction | null;
  source: GrowthOpportunitySource;
  handoff?: GrowthOpportunityHandoff;
  openedAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface GrowthOpportunityTypeConfig {
  key: string;
  label: string;
}

/** Configuración por Espacio (ADR-010 §1). Defaults de plataforma si no existe. */
export interface GrowthSpaceConfig {
  _id: string;
  tenantId: string;
  opportunityTypes: GrowthOpportunityTypeConfig[];
  createdAt: string;
  updatedAt: string;
}

export const GROWTH_DEFAULT_OPPORTUNITY_TYPES: GrowthOpportunityTypeConfig[] = [
  { key: "inquiry", label: "Consulta" },
  { key: "registration", label: "Registro" },
  { key: "conversion", label: "Conversión" },
];
