/**
 * Copy humano Campañas V1 — diseño final OT-GROWTH-UX-CAMPAIGNS-004.
 */

import type {
  GrowthCampaignAudienceFilter,
  GrowthCampaignSource,
  GrowthCampaignStatus,
} from "@/core/growth/campaigns";
import {
  growthOpportunityStatusLabel,
  growthOpportunityTypeLabel,
  growthOriginKindLabel,
} from "@/lib/growth/labels";
import { humanizeOriginDisplayLabel } from "@/lib/growth/humanize-origin-display";

export const CAMPAIGN_PAGE_TITLE = "Campañas";
export const CAMPAIGN_PAGE_DESCRIPTION =
  "Organiza cómo atraes personas y acompaña sus resultados.";
export const CAMPAIGN_EMPTY_TITLE = "Crea tu primera campaña";
export const CAMPAIGN_EMPTY_DESCRIPTION =
  "Organiza de dónde llegarán las personas y cómo las acompañarás.";
export const CAMPAIGN_CREATE_CTA = "Crear campaña";
export const CAMPAIGN_NEW_CTA = "Nueva campaña";
export const CAMPAIGN_SAVE_DRAFT_CTA = "Guardar borrador";
export const CAMPAIGN_ACTIVATE_CTA = "Activar";
export const CAMPAIGN_ACTIVATE_CAMPAIGN_CTA = "Activar campaña";
export const CAMPAIGN_END_CTA = "Terminar campaña";
export const CAMPAIGN_EDIT_CTA = "Editar";
export const CAMPAIGN_VIEW_CTA = "Ver campaña";
export const CAMPAIGN_WIZARD_TITLE_CREATE = "Nueva campaña";
export const CAMPAIGN_WIZARD_TITLE_EDIT = "Editar campaña";

export const CAMPAIGN_STEP_1_TITLE = "Qué quieres lograr";
export const CAMPAIGN_STEP_2_TITLE = "De dónde llegarán las personas";
export const CAMPAIGN_STEP_3_TITLE = "Qué seguimiento tendrán";
export const CAMPAIGN_STEP_4_TITLE = "Revisar y activar";

export const CAMPAIGN_SOURCE_FORM_LABEL = "Formulario";
export const CAMPAIGN_SOURCE_NONE_LABEL = "Solo seguimiento";
export const CAMPAIGN_SOURCE_NONE_DETAIL =
  "Esta campaña acompaña personas que ya están en Growth OS.";
export const CAMPAIGN_AUTOMATION_NONE =
  "No hay seguimiento automático.";
export const CAMPAIGN_AUDIENCE_ALL_PREFIX =
  "Personas que cumplen todas estas condiciones";
export const CAMPAIGN_AUDIENCE_EMPTY =
  "Sin filtros de audiencia adicionales.";
export const CAMPAIGN_ACTIVATE_HINT =
  "Al activar, la campaña empezará a atribuir personas y oportunidades según la fuente que elegiste.";
export const CAMPAIGN_FORMS_EMPTY =
  "No hay formularios en este Espacio. Puedes elegir solo seguimiento.";
export const CAMPAIGN_AUTOMATIONS_EMPTY =
  "No hay automatizaciones todavía. Puedes continuar sin seguimiento automático.";

export function campaignStatusLabel(status: GrowthCampaignStatus): string {
  switch (status) {
    case "draft":
      return "Borrador";
    case "active":
      return "Activa";
    case "ended":
      return "Terminada";
    default:
      return status;
  }
}

export function campaignStatusTone(
  status: GrowthCampaignStatus
): "draft" | "active" | "inactive" | "neutral" {
  switch (status) {
    case "draft":
      return "draft";
    case "active":
      return "active";
    case "ended":
      return "inactive";
    default:
      return "neutral";
  }
}

export function campaignSourceLabel(
  source: GrowthCampaignSource,
  formName?: string | null
): string {
  if (source.kind === "form") {
    const name = formName?.trim();
    return name ? name : "Formulario";
  }
  return CAMPAIGN_SOURCE_NONE_LABEL;
}

export function campaignSourceDetailCopy(
  source: GrowthCampaignSource,
  formName?: string | null
): string {
  if (source.kind === "form") {
    const name = formName?.trim() || "Formulario";
    return `Las personas llegan desde:\n${name}`;
  }
  return CAMPAIGN_SOURCE_NONE_DETAIL;
}

export type CampaignAudienceLabelContext = {
  formNameById?: Record<string, string>;
  campaignNameByTrackingKey?: Record<string, string>;
};

/** Filtro técnico → frase humana (sin eq/AND/IDs/origin.*). */
export function campaignAudienceFilterLabel(
  filter: GrowthCampaignAudienceFilter,
  ctx: CampaignAudienceLabelContext = {}
): string {
  switch (filter.field) {
    case "status":
      return `Estado: ${growthOpportunityStatusLabel(filter.value)}`;
    case "typeKey":
      return `Tipo: ${growthOpportunityTypeLabel(filter.value)}`;
    case "origin.kind":
      return `Origen: ${growthOriginKindLabel(filter.value)}`;
    case "origin.channel":
      return `Llegaron por ${humanizeOriginDisplayLabel(filter.value)}`;
    case "origin.formId": {
      const name = ctx.formNameById?.[filter.value]?.trim();
      return name
        ? `Llegaron desde ${name}`
        : "Llegaron desde un formulario";
    }
    case "origin.campaign": {
      const name = ctx.campaignNameByTrackingKey?.[filter.value]?.trim();
      return name
        ? `Llegaron desde ${name}`
        : "Llegaron desde esta campaña";
    }
    default: {
      const _exhaustive: never = filter;
      void _exhaustive;
      return "Condición de audiencia";
    }
  }
}

export function campaignAudienceSummary(
  filters: GrowthCampaignAudienceFilter[],
  ctx: CampaignAudienceLabelContext = {}
): { intro: string | null; labels: string[] } {
  if (filters.length === 0) {
    return { intro: null, labels: [] };
  }
  const labels = filters.map((f) => campaignAudienceFilterLabel(f, ctx));
  return {
    intro: filters.length > 1 ? CAMPAIGN_AUDIENCE_ALL_PREFIX : null,
    labels,
  };
}

/** Códigos técnicos → mensaje operador. */
export function campaignHumanError(
  code: string | undefined,
  fallback?: string
): string {
  switch (code) {
    case "active_form_conflict":
      return "Este formulario ya está siendo usado por otra campaña activa.";
    case "automation_not_found":
      return "No pudimos usar esta automatización.";
    case "form_not_found":
      return "No pudimos usar este formulario.";
    case "tracking_key_taken":
      return "Ya existe una campaña con un nombre muy similar. Prueba otro nombre.";
    case "tracking_key_immutable":
      return "No se puede cambiar la identificación interna tras activar.";
    case "invalid_transition":
      return "Ese cambio de estado no está permitido.";
    case "not_found":
      return "Campaña no encontrada.";
    case "validation":
      return fallback?.trim() || "Revisa los datos e inténtalo de nuevo.";
    case "conflict":
      return "No se pudo guardar por un conflicto de configuración.";
    default:
      return fallback?.trim() || "No pudimos completar la operación.";
  }
}
