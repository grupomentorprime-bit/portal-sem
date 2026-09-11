/**
 * OT-GROWTH-CORE-007 — proyección pura Persona → vista UI (sin I/O).
 */

import { isGrowthOpportunityFinalStatus } from "@/core/growth/opportunity-definition";
import type {
  GrowthActivity,
  GrowthNextAction,
  GrowthOportunidad,
  GrowthPersona,
} from "@/core/growth/types";
import {
  GROWTH_NO_NEXT_ACTION_LABEL,
  growthActivityKindLabel,
  growthNextActionKindLabel,
  growthOpportunityStatusLabel,
  growthOpportunityTypeLabel,
  growthOriginArrivalLabel,
} from "./labels";

export interface GrowthPersonaListItemView {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  originLabel: string;
  opportunityCount: number;
  opportunitySummary?: string;
  nextActionLabel: string;
  updatedAt: string;
}

export interface GrowthNextActionView {
  summary: string;
  dueAt?: string;
  kindLabel: string;
  setAt: string;
  oportunidadId: string;
  oportunidadTypeLabel: string;
}

export interface GrowthActivityView {
  id: string;
  summary: string;
  kindLabel: string;
  occurredAt: string;
  oportunidadId?: string;
}

export interface GrowthOportunidadView {
  id: string;
  typeLabel: string;
  statusLabel: string;
  status: string;
  subjectLabel?: string;
  originLabel: string;
  nextAction: GrowthNextActionView | null;
  openedAt: string;
  updatedAt: string;
  /** Hechos ligados a esta Oportunidad (growth_actividades). */
  relatedActivities: GrowthActivityView[];
}

/** Detalle de Oportunidad en el Espacio (sin superficie CRM nueva). */
export interface GrowthOportunidadDetailView extends GrowthOportunidadView {
  personaId: string;
  personaDisplayName: string;
}

export interface GrowthPersonaDetailView {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  status: string;
  originLabel: string;
  originCapturedAt: string;
  createdAt: string;
  updatedAt: string;
  oportunidades: GrowthOportunidadView[];
  activities: GrowthActivityView[];
  primaryNextAction: GrowthNextActionView | null;
}

/** Actividades internas de identidad no se muestran en la UI V1. */
export function activitiesVisibleInUi(
  activities: GrowthActivity[]
): GrowthActivity[] {
  return activities.filter((a) => a.kind !== "identity_conflict");
}

/** Escapa caracteres especiales de RegExp para búsqueda literal. */
export function escapeGrowthSearchRegex(raw: string): string {
  return raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function personaMatchesSearch(
  persona: Pick<
    GrowthPersona,
    "displayName" | "email" | "phone" | "emailNormalized" | "phoneNormalized"
  >,
  q: string
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    persona.displayName,
    persona.email,
    persona.phone,
    persona.emailNormalized,
    persona.phoneNormalized,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function sortActivitiesNewestFirst(
  activities: GrowthActivity[]
): GrowthActivity[] {
  return [...activities].sort((a, b) =>
    b.occurredAt.localeCompare(a.occurredAt)
  );
}

function toNextActionView(
  nextAction: GrowthNextAction,
  oportunidad: GrowthOportunidad
): GrowthNextActionView {
  return {
    summary: nextAction.summary,
    dueAt: nextAction.dueAt,
    kindLabel: growthNextActionKindLabel(nextAction.kind),
    setAt: nextAction.setAt,
    oportunidadId: oportunidad._id,
    oportunidadTypeLabel: growthOpportunityTypeLabel(oportunidad.typeKey),
  };
}

/**
 * Elige la próxima acción más relevante entre Oportunidades.
 * Prioriza no finales; luego dueAt más cercano; luego setAt más reciente.
 */
export function pickPrimaryNextAction(
  oportunidades: GrowthOportunidad[]
): GrowthNextActionView | null {
  const withAction = oportunidades
    .filter((o) => o.nextAction != null)
    .map((o) => ({ oportunidad: o, nextAction: o.nextAction! }));

  if (withAction.length === 0) return null;

  withAction.sort((a, b) => {
    const aFinal = isGrowthOpportunityFinalStatus(a.oportunidad.status) ? 1 : 0;
    const bFinal = isGrowthOpportunityFinalStatus(b.oportunidad.status) ? 1 : 0;
    if (aFinal !== bFinal) return aFinal - bFinal;

    const aDue = a.nextAction.dueAt ?? "9999";
    const bDue = b.nextAction.dueAt ?? "9999";
    if (aDue !== bDue) return aDue.localeCompare(bDue);

    return b.nextAction.setAt.localeCompare(a.nextAction.setAt);
  });

  const best = withAction[0];
  return toNextActionView(best.nextAction, best.oportunidad);
}

export function toActivityView(a: GrowthActivity): GrowthActivityView {
  return {
    id: a._id,
    summary: a.summary,
    kindLabel: growthActivityKindLabel(a.kind),
    occurredAt: a.occurredAt,
    oportunidadId: a.oportunidadId,
  };
}

export function toOportunidadView(
  o: GrowthOportunidad,
  relatedActivities: GrowthActivity[] = []
): GrowthOportunidadView {
  const related = sortActivitiesNewestFirst(
    activitiesVisibleInUi(relatedActivities)
  ).map(toActivityView);

  return {
    id: o._id,
    typeLabel: growthOpportunityTypeLabel(o.typeKey),
    statusLabel: growthOpportunityStatusLabel(o.status),
    status: o.status,
    subjectLabel: o.subjectLabel,
    originLabel: growthOriginArrivalLabel(o.origin),
    nextAction: o.nextAction ? toNextActionView(o.nextAction, o) : null,
    openedAt: o.openedAt,
    updatedAt: o.updatedAt,
    relatedActivities: related,
  };
}

export function toOportunidadDetailView(
  o: GrowthOportunidad,
  persona: Pick<GrowthPersona, "_id" | "displayName">,
  relatedActivities: GrowthActivity[] = []
): GrowthOportunidadDetailView {
  return {
    ...toOportunidadView(o, relatedActivities),
    personaId: persona._id,
    personaDisplayName: persona.displayName,
  };
}

export function toPersonaListItemView(
  persona: GrowthPersona,
  oportunidades: GrowthOportunidad[]
): GrowthPersonaListItemView {
  const primary = pickPrimaryNextAction(oportunidades);
  const openish = oportunidades.filter(
    (o) => !isGrowthOpportunityFinalStatus(o.status)
  );
  const focus = openish[0] ?? oportunidades[0];

  return {
    id: persona._id,
    displayName: persona.displayName,
    email: persona.email,
    phone: persona.phone,
    originLabel: growthOriginArrivalLabel(persona.origin),
    opportunityCount: oportunidades.length,
    opportunitySummary: focus
      ? `${growthOpportunityTypeLabel(focus.typeKey)} · ${growthOpportunityStatusLabel(focus.status)}`
      : undefined,
    nextActionLabel: primary?.summary ?? GROWTH_NO_NEXT_ACTION_LABEL,
    updatedAt: persona.updatedAt,
  };
}

export function toPersonaDetailView(
  persona: GrowthPersona,
  oportunidades: GrowthOportunidad[],
  activities: GrowthActivity[]
): GrowthPersonaDetailView {
  const sortedOps = [...oportunidades].sort((a, b) =>
    b.openedAt.localeCompare(a.openedAt)
  );
  const visibleActs = activitiesVisibleInUi(activities);
  const sortedActs = sortActivitiesNewestFirst(visibleActs);

  return {
    id: persona._id,
    displayName: persona.displayName,
    email: persona.email,
    phone: persona.phone,
    firstName: persona.firstName,
    lastName: persona.lastName,
    status: persona.status,
    originLabel: growthOriginArrivalLabel(persona.origin),
    originCapturedAt: persona.origin.capturedAt,
    createdAt: persona.createdAt,
    updatedAt: persona.updatedAt,
    oportunidades: sortedOps.map((o) =>
      toOportunidadView(
        o,
        visibleActs.filter((a) => a.oportunidadId === o._id)
      )
    ),
    activities: sortedActs.map(toActivityView),
    primaryNextAction: pickPrimaryNextAction(sortedOps),
  };
}
