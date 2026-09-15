/**
 * OT-GROWTH-CORE-007 / 007B — textos humanos para la UI de Growth Core.
 * Vocabulario de producto: Persona, Oportunidad, origen, hechos, qué hacer ahora.
 */

import { GROWTH_OPPORTUNITY_WORKFLOW_TEMPLATE } from "@/core/growth/opportunity-definition";
import {
  GROWTH_DEFAULT_OPPORTUNITY_TYPES,
  type GrowthActivityKind,
  type GrowthNextActionKind,
  type GrowthOpportunityStatus,
  type GrowthOrigin,
  type GrowthOriginKind,
} from "@/core/growth/types";

const ORIGIN_KIND_LABELS: Record<GrowthOriginKind, string> = {
  admission: "Admisión",
  form: "Formulario",
  event: "Evento",
  manual: "Registro manual",
  unknown: "Sin origen claro",
};

const ACTIVITY_KIND_LABELS: Record<GrowthActivityKind, string> = {
  form_submitted: "Formulario enviado",
  application_received: "Postulación recibida",
  opportunity_opened: "Oportunidad abierta",
  opportunity_transitioned: "Cambio de estado",
  next_action_set: "Próxima acción definida",
  note: "Nota",
  contact: "Contacto",
  handoff: "Traspaso",
  identity_updated: "Datos actualizados",
  identity_conflict: "Conflicto de identidad",
};

const NEXT_ACTION_KIND_LABELS: Record<GrowthNextActionKind, string> = {
  contact: "Contactar",
  review: "Revisar",
  handoff: "Traspasar",
  wait: "Esperar",
  other: "Otro",
};

const STATUS_LABELS = Object.fromEntries(
  GROWTH_OPPORTUNITY_WORKFLOW_TEMPLATE.states.map((s) => [s.key, s.label])
) as Record<GrowthOpportunityStatus, string>;

const TYPE_LABELS = Object.fromEntries(
  GROWTH_DEFAULT_OPPORTUNITY_TYPES.map((t) => [t.key, t.label])
) as Record<string, string>;

export function growthOriginKindLabel(kind: GrowthOriginKind | string): string {
  return ORIGIN_KIND_LABELS[kind as GrowthOriginKind] ?? "Origen";
}

/** Texto para la sección «De dónde llegó». */
export function growthOriginArrivalLabel(origin: Pick<GrowthOrigin, "kind" | "channel">): string {
  const base = growthOriginKindLabel(origin.kind);
  const channel = origin.channel?.trim();
  if (!channel) return base;
  return `${base} · ${channel}`;
}

export function growthOpportunityStatusLabel(
  status: GrowthOpportunityStatus | string
): string {
  return STATUS_LABELS[status as GrowthOpportunityStatus] ?? status;
}

export function growthOpportunityTypeLabel(typeKey: string): string {
  return TYPE_LABELS[typeKey] ?? typeKey;
}

export function growthActivityKindLabel(kind: GrowthActivityKind | string): string {
  return ACTIVITY_KIND_LABELS[kind as GrowthActivityKind] ?? "Actividad";
}

export function growthNextActionKindLabel(
  kind: GrowthNextActionKind | string
): string {
  return NEXT_ACTION_KIND_LABELS[kind as GrowthNextActionKind] ?? "Acción";
}

export const GROWTH_NO_NEXT_ACTION_LABEL = "No hay nada pendiente por ahora.";
export const GROWTH_ORIGIN_SECTION_LABEL = "De dónde llegó";
export const GROWTH_TIMELINE_SECTION_LABEL = "Qué ha pasado";
export const GROWTH_NEXT_ACTION_SECTION_LABEL = "Qué hacer ahora";
export const GROWTH_SITUATION_SECTION_LABEL = "Situación";
export const GROWTH_RELATED_HISTORY_LABEL = "Hechos de esta Oportunidad";
export const GROWTH_VIEW_DETAIL_LABEL = "Ver detalle";
export const GROWTH_VIEW_PERSONA_LABEL = "Ver persona";

/** Cabecera del listado Personas. */
export const GROWTH_PERSONAS_PAGE_TITLE = "Personas";
export const GROWTH_PERSONAS_PAGE_DESCRIPTION =
  "Todas las personas que se han relacionado con tu negocio.";

/** Estado vacío real (sin Personas en el Espacio). */
export const GROWTH_PERSONAS_EMPTY_TITLE = "Aún no hay personas";
export const GROWTH_PERSONAS_EMPTY_DESCRIPTION =
  "Aparecerán cuando alguien escriba por WhatsApp, complete un formulario, postule o las registres tú.";

/** Estado vacío por búsqueda/filtros sin coincidencias. */
export const GROWTH_PERSONAS_NO_MATCH_TITLE =
  "No encontramos personas con esos filtros.";
export const GROWTH_PERSONAS_NO_MATCH_DESCRIPTION =
  "Prueba con otro nombre, correo o teléfono, o limpia los filtros.";

export const GROWTH_PERSONAS_CREATE_CTA = "Crear persona";
export const GROWTH_PERSONAS_CREATE_TITLE = "Crear persona";
export const GROWTH_PERSONAS_CREATE_DESCRIPTION =
  "Agrega un correo o un teléfono.";
export const GROWTH_PERSONAS_CREATED_MESSAGE = "Persona creada.";
export const GROWTH_PERSONAS_MATCHED_MESSAGE =
  "Esta persona ya estaba registrada.";
export const GROWTH_PERSONAS_CONFLICT_MESSAGE =
  "Encontramos datos que podrían pertenecer a personas distintas.";
export const GROWTH_PERSONAS_VALIDATION_MESSAGE =
  "Necesitamos un correo o un teléfono válido.";
export const GROWTH_PERSONAS_NAME_REQUIRED_MESSAGE = "Indica el nombre.";
export const GROWTH_PERSONAS_CONVERSATIONS_SECTION = "Conversaciones";
export const GROWTH_PERSONAS_CONVERSATIONS_EMPTY_TITLE =
  "Todavía no hay conversaciones";
export const GROWTH_PERSONAS_CONVERSATIONS_EMPTY_DESCRIPTION =
  "Cuando haya mensajes con esta persona, se verán aquí como contexto reciente.";
export const GROWTH_PERSONAS_OPEN_IN_MESSAGES = "Abrir en Mensajes";
export const GROWTH_PERSONAS_OPEN_IN_SALES = "Abrir en Ventas";
export const GROWTH_PERSONAS_OPEN_ACTIVITY = "Ver actividad";
export const GROWTH_PERSONAS_LIMIT_NOTE =
  "Mostramos hasta 100 personas recientes. Usa búsqueda o filtros para acotar.";
export const GROWTH_PERSONAS_OPPORTUNITIES_EMPTY_TITLE =
  "Todavía no hay oportunidades";
export const GROWTH_PERSONAS_OPPORTUNITIES_EMPTY_DESCRIPTION =
  "Cuando esta persona muestre una intención, la verás aquí.";
export const GROWTH_PERSONAS_ACTIVITY_EMPTY_TITLE = "Todavía no hay hechos";
export const GROWTH_PERSONAS_ACTIVITY_EMPTY_DESCRIPTION =
  "Cuando pase algo con esta persona, se contará aquí.";
export const GROWTH_PERSONAS_ARRIVED_PREFIX = "Llegó por";

/** Filtro de origen V1 — tokens resolubles; no inventan GrowthOriginKind. */
export const GROWTH_PERSONA_ORIGIN_FILTER_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "form", label: "Formulario" },
  { value: "admission", label: "Admisión" },
  { value: "manual", label: "Registro manual" },
  { value: "event", label: "Evento" },
  { value: "portal-web", label: "Portal web" },
  { value: "unclear", label: "Sin origen claro" },
] as const;

export type GrowthPersonaOriginFilterToken =
  (typeof GROWTH_PERSONA_ORIGIN_FILTER_OPTIONS)[number]["value"];

export const GROWTH_OPPORTUNITY_STATUS_FILTER_OPTIONS: Array<{
  value: GrowthOpportunityStatus;
  label: string;
}> = GROWTH_OPPORTUNITY_WORKFLOW_TEMPLATE.states.map((s) => ({
  value: s.key as GrowthOpportunityStatus,
  label: s.label,
}));

export const GROWTH_OPPORTUNITY_TYPE_FILTER_OPTIONS =
  GROWTH_DEFAULT_OPPORTUNITY_TYPES.map((t) => ({
    value: t.key,
    label: t.label,
  }));

export const GROWTH_NEXT_ACTION_FILTER_OPTIONS = [
  { value: "", label: "Con o sin próxima acción" },
  { value: "with", label: "Con próxima acción" },
  { value: "without", label: "Sin próxima acción" },
] as const;

export const GROWTH_VENTAS_EMPTY_TITLE = "Aún no hay Oportunidades";
export const GROWTH_VENTAS_EMPTY_DESCRIPTION =
  "Cuando lleguen consultas, registros o postulaciones, aparecerán aquí para darles seguimiento.";
export const GROWTH_VENTAS_NO_MATCH_TITLE = "No encontramos Oportunidades";
export const GROWTH_VENTAS_NO_MATCH_DESCRIPTION =
  "Prueba con otro nombre o quita los filtros.";
export const GROWTH_VENTAS_PAGE_TITLE = "Ventas";
export const GROWTH_VENTAS_PAGE_DESCRIPTION =
  "Cola de Oportunidades del Espacio activo.";
export const GROWTH_VENTAS_OPERATE_TITLE = "Oportunidad";
export const GROWTH_VENTAS_LAST_ACTIVITY_LABEL = "Última actividad";
export const GROWTH_VENTAS_FOLLOW_UP_LABEL = "Registrar seguimiento";
export const GROWTH_VENTAS_CHANGE_STATUS_LABEL = "Cambiar estado";
export const GROWTH_VENTAS_CURRENT_STATUS_LABEL = "Estado actual";
export const GROWTH_VENTAS_OPEN_PERSONA_LABEL = "Abrir Persona";
export const GROWTH_VENTAS_CLEAR_NEXT_ACTION_LABEL = "Quitar acción";
export const GROWTH_VENTAS_SET_NEXT_ACTION_LABEL = "Qué hacer ahora";
export const GROWTH_VENTAS_SAVE_NOTE_LABEL = "Guardar nota";
export const GROWTH_VENTAS_REGISTER_CONTACT_LABEL = "Registrar contacto";
export const GROWTH_VENTAS_NOTE_KIND_LABEL = "Nota";
export const GROWTH_VENTAS_CONTACT_KIND_LABEL = "Contacto";
export const GROWTH_VENTAS_FOLLOW_UP_PLACEHOLDER =
  "Conversé con María. Quiere matricularse la próxima semana.";

/** OT-GROWTH-MESSAGING-004 — bandeja de mensajes. */
export const GROWTH_MENSAJES_PAGE_TITLE = "Mensajes";
export const GROWTH_MENSAJES_PAGE_DESCRIPTION =
  "Conversaciones del Espacio activo.";
export const GROWTH_MENSAJES_EMPTY_TITLE = "Aún no hay conversaciones";
export const GROWTH_MENSAJES_EMPTY_DESCRIPTION =
  "Cuando lleguen mensajes, aparecerán aquí para leerlos y responder.";
export const GROWTH_MENSAJES_NO_MATCH_TITLE = "No encontramos conversaciones";
export const GROWTH_MENSAJES_NO_MATCH_DESCRIPTION =
  "Prueba con otro nombre o quita la búsqueda.";
export const GROWTH_MENSAJES_SELECT_TITLE = "Elegí una conversación";
export const GROWTH_MENSAJES_SELECT_DESCRIPTION =
  "Seleccioná un hilo a la izquierda para ver los mensajes y responder.";
export const GROWTH_MENSAJES_REPLY_PLACEHOLDER = "Escribe una respuesta…";
export const GROWTH_MENSAJES_SEND_LABEL = "Enviar";
export const GROWTH_MENSAJES_VIEW_PERSONA_LABEL = "Ver persona";
export const GROWTH_MENSAJES_VIEW_OPPORTUNITY_LABEL = "Ver oportunidad";
/** OT-GROWTH-E2E-FIX-003 — contexto comercial mínimo en el hilo. */
export const GROWTH_MENSAJES_OPPORTUNITY_FIELD_LABEL = "Oportunidad";
export const GROWTH_MENSAJES_STATUS_FIELD_LABEL = "Estado";
export const GROWTH_MENSAJES_BACK_LABEL = "Conversaciones";
export const GROWTH_MENSAJES_SEND_FAILED_LABEL = "No se pudo enviar";
export const GROWTH_MENSAJES_REPLY_ERROR_GENERIC =
  "No se pudo enviar la respuesta. Intentalo de nuevo.";

/** OT-GROWTH-ACTIVITY-001 / UX-002 — historial comercial del Espacio. */
export const GROWTH_ACTIVIDAD_PAGE_TITLE = "Actividad";
export const GROWTH_ACTIVIDAD_PAGE_DESCRIPTION =
  "Todo lo que ha pasado en tu negocio, en un solo lugar.";
export const GROWTH_ACTIVIDAD_EMPTY_TITLE = "Aún no hay actividad";
export const GROWTH_ACTIVIDAD_EMPTY_DESCRIPTION =
  "Cuando lleguen personas, mensajes o avances en ventas, los verás aquí.";
export const GROWTH_ACTIVIDAD_NO_MATCH_TITLE = "No hay actividad en este filtro";
export const GROWTH_ACTIVIDAD_NO_MATCH_DESCRIPTION =
  "Prueba con otro filtro o vuelve a Todos.";
export const GROWTH_ACTIVIDAD_LOAD_MORE_LABEL = "Cargar más";
export const GROWTH_ACTIVIDAD_LOADING_LABEL = "Cargando actividad…";
export const GROWTH_ACTIVIDAD_ERROR_TITLE = "No pudimos cargar la actividad";
export const GROWTH_ACTIVIDAD_ERROR_DESCRIPTION =
  "Revisa tu conexión e inténtalo de nuevo.";
export const GROWTH_ACTIVIDAD_RETRY_LABEL = "Reintentar";
export const GROWTH_ACTIVIDAD_VIEW_PERSONA_LABEL = "Ver persona";
export const GROWTH_ACTIVIDAD_VIEW_OPPORTUNITY_LABEL = "Ver oportunidad";
export const GROWTH_ACTIVIDAD_FILTER_ALL_LABEL = "Todos";
export const GROWTH_ACTIVIDAD_FILTER_PERSONAS_LABEL = "Personas";
export const GROWTH_ACTIVIDAD_FILTER_VENTAS_LABEL = "Ventas";
export const GROWTH_ACTIVIDAD_FILTER_MENSAJES_LABEL = "Mensajes";
export const GROWTH_ACTIVIDAD_FILTER_AUTOMATIZACIONES_LABEL = "Automatizaciones";

/** OT-GROWTH-MESSAGING-005 — Ajustes → Canales. */
export const GROWTH_CHANNELS_PAGE_TITLE = "Canales";
export const GROWTH_CHANNELS_PAGE_DESCRIPTION =
  "Conecta los medios que usa tu organización para hablar con las personas.";
export const GROWTH_CHANNELS_WHATSAPP_LABEL = "WhatsApp";
export const GROWTH_CHANNELS_VIEW_MESSAGES_LABEL = "Ver mensajes";
export const GROWTH_CHANNELS_CONNECT_LABEL = "Conectar";
export const GROWTH_CHANNELS_COMPLETE_CONNECTION_LABEL = "Completar conexión";
export const GROWTH_CHANNELS_MANAGE_LABEL = "Administrar";
export const GROWTH_CHANNELS_TEST_LABEL = "Probar conexión";
export const GROWTH_CHANNELS_PAUSE_LABEL = "Pausar";
export const GROWTH_CHANNELS_RESUME_LABEL = "Reanudar";
export const GROWTH_CHANNELS_RECEIVES_LABEL = "Recibe mensajes";
export const GROWTH_CHANNELS_CAN_REPLY_LABEL = "Puedes responder desde Mensajes";
export const GROWTH_CHANNELS_NUMBER_LABEL = "Número";
export const GROWTH_CHANNELS_TEST_OK = "Conexión correcta";
export const GROWTH_CHANNELS_TEST_FAIL =
  "No pudimos conectar. Revisa la configuración.";
export const GROWTH_CHANNELS_COMING_SOON = "Disponible más adelante";
export const GROWTH_CHANNELS_UPDATED_LABEL = "Última actualización";

/** OT-GROWTH-UX-ANALYTICS-004 — copy humano Analítica V1. */
export const GROWTH_ANALITICA_PAGE_TITLE = "Analítica";
export const GROWTH_ANALITICA_PAGE_DESCRIPTION =
  "Entiende cómo está funcionando tu negocio.";
export const GROWTH_ANALITICA_LOADING_LABEL = "Cargando analítica…";
export const GROWTH_ANALITICA_ERROR_TITLE = "No pudimos cargar la analítica.";
export const GROWTH_ANALITICA_ERROR_DESCRIPTION =
  "Revisa tu conexión e inténtalo de nuevo.";
export const GROWTH_ANALITICA_RETRY_LABEL = "Intentar nuevamente";
export const GROWTH_ANALITICA_EMPTY_DESCRIPTION =
  "Aún no hay datos en este período.";
export const GROWTH_ANALITICA_EMPTY_OPPORTUNITIES =
  "Aún no hay oportunidades en este período.";
export const GROWTH_ANALITICA_EMPTY_CAMPAIGNS =
  "No hay campañas con actividad en este período.";
export const GROWTH_ANALITICA_EMPTY_MESSAGES =
  "Aún no hay mensajes en este período.";
export const GROWTH_ANALITICA_EMPTY_LOSSES =
  "No hay pérdidas en este período.";
export const GROWTH_ANALITICA_EMPTY_ORIGINS =
  "Aún no hay personas nuevas en este período.";
export const GROWTH_ANALITICA_PERIOD_LABELS = {
  last_7d: "Últimos 7 días",
  last_30d: "Últimos 30 días",
  this_month: "Este mes",
  previous_month: "Mes anterior",
  custom: "Personalizado",
} as const;
