/**
 * Plantillas rápidas de creación de formularios (UX).
 * Reutilizan el modelo ExperienceForm existente: mismos types, destinations y fields.
 * No son un segundo constructor.
 */

import type {
  ExperienceFormDestination,
  ExperienceFormField,
} from "@/types/experience-forms";

export const FORM_QUICK_TEMPLATE_IDS = [
  "information",
  "contact",
  "registration",
  "application",
  "survey",
  "booking",
] as const;

export type FormQuickTemplateId = (typeof FORM_QUICK_TEMPLATE_IDS)[number];

export interface FormQuickTemplate {
  id: FormQuickTemplateId;
  label: string;
  description: string;
  destination: ExperienceFormDestination;
  defaultName: string;
  defaultDescription: string;
  fields: ExperienceFormField[];
}

function field(
  partial: Pick<ExperienceFormField, "id" | "type" | "name" | "label"> &
    Partial<Omit<ExperienceFormField, "id" | "type" | "name" | "label">>
): ExperienceFormField {
  return {
    validation: { required: false },
    ...partial,
  };
}

export const FORM_QUICK_TEMPLATES: FormQuickTemplate[] = [
  {
    id: "information",
    label: "Pedir información",
    description: "Nombre, correo y un mensaje de interés.",
    destination: "information_request",
    defaultName: "Solicita información",
    defaultDescription: "Déjanos tus datos y te contactaremos.",
    fields: [
      field({
        id: "fullName",
        type: "text",
        name: "fullName",
        label: "Nombre completo",
        placeholder: "María López",
        validation: { required: true },
      }),
      field({
        id: "email",
        type: "email",
        name: "email",
        label: "Correo",
        placeholder: "maria@correo.cl",
        validation: { required: true },
      }),
      field({
        id: "phone",
        type: "phone",
        name: "phone",
        label: "Teléfono",
        placeholder: "+56 9…",
      }),
      field({
        id: "interest",
        type: "select",
        name: "interest",
        label: "¿Qué te interesa?",
        options: [
          { label: "Cursos", value: "cursos" },
          { label: "Programas", value: "programas" },
          { label: "Otro", value: "otro" },
        ],
      }),
      field({
        id: "message",
        type: "textarea",
        name: "message",
        label: "Mensaje",
        placeholder: "Cuéntanos en qué podemos ayudarte",
      }),
    ],
  },
  {
    id: "contact",
    label: "Recibir contactos",
    description: "Datos simples para que te escriban.",
    destination: "contact",
    defaultName: "Contáctanos",
    defaultDescription: "Escríbenos y te responderemos pronto.",
    fields: [
      field({
        id: "fullName",
        type: "text",
        name: "fullName",
        label: "Nombre completo",
        placeholder: "María López",
        validation: { required: true },
      }),
      field({
        id: "email",
        type: "email",
        name: "email",
        label: "Correo",
        placeholder: "maria@correo.cl",
        validation: { required: true },
      }),
      field({
        id: "phone",
        type: "phone",
        name: "phone",
        label: "Teléfono",
        placeholder: "+56 9…",
      }),
      field({
        id: "message",
        type: "textarea",
        name: "message",
        label: "Mensaje",
        placeholder: "¿En qué te podemos ayudar?",
        validation: { required: true },
      }),
    ],
  },
  {
    id: "registration",
    label: "Inscripción",
    description: "Para inscribirse a un evento o actividad.",
    destination: "event_registration",
    defaultName: "Inscripción",
    defaultDescription: "Completa tus datos para inscribirte.",
    fields: [
      field({
        id: "fullName",
        type: "text",
        name: "fullName",
        label: "Nombre completo",
        placeholder: "María López",
        validation: { required: true },
      }),
      field({
        id: "email",
        type: "email",
        name: "email",
        label: "Correo",
        placeholder: "maria@correo.cl",
        validation: { required: true },
      }),
      field({
        id: "phone",
        type: "phone",
        name: "phone",
        label: "Teléfono",
        placeholder: "+56 9…",
        validation: { required: true },
      }),
      field({
        id: "notes",
        type: "textarea",
        name: "notes",
        label: "Comentarios",
        placeholder: "Opcional",
      }),
    ],
  },
  {
    id: "application",
    label: "Postulación",
    description: "Recibe postulaciones con datos básicos.",
    destination: "information_request",
    defaultName: "Postulación",
    defaultDescription: "Completa este formulario para postular.",
    fields: [
      field({
        id: "fullName",
        type: "text",
        name: "fullName",
        label: "Nombre completo",
        placeholder: "María López",
        validation: { required: true },
      }),
      field({
        id: "email",
        type: "email",
        name: "email",
        label: "Correo",
        placeholder: "maria@correo.cl",
        validation: { required: true },
      }),
      field({
        id: "phone",
        type: "phone",
        name: "phone",
        label: "Teléfono",
        placeholder: "+56 9…",
        validation: { required: true },
      }),
      field({
        id: "program",
        type: "select",
        name: "program",
        label: "¿A qué postulás?",
        options: [
          { label: "Opción 1", value: "opcion_1" },
          { label: "Opción 2", value: "opcion_2" },
        ],
        validation: { required: true },
      }),
      field({
        id: "motivation",
        type: "textarea",
        name: "motivation",
        label: "¿Por qué te interesa?",
        placeholder: "Cuéntanos un poco sobre ti",
      }),
    ],
  },
  {
    id: "survey",
    label: "Encuesta",
    description: "Preguntas cortas para conocer opiniones.",
    destination: "subscription",
    defaultName: "Encuesta",
    defaultDescription: "Tus respuestas nos ayudan a mejorar.",
    fields: [
      field({
        id: "fullName",
        type: "text",
        name: "fullName",
        label: "Nombre (opcional)",
        placeholder: "María López",
      }),
      field({
        id: "rating",
        type: "radio",
        name: "rating",
        label: "¿Cómo calificarías tu experiencia?",
        options: [
          { label: "Excelente", value: "excelente" },
          { label: "Buena", value: "buena" },
          { label: "Regular", value: "regular" },
          { label: "Mala", value: "mala" },
        ],
        validation: { required: true },
      }),
      field({
        id: "recommend",
        type: "select",
        name: "recommend",
        label: "¿Nos recomendarías?",
        options: [
          { label: "Sí", value: "si" },
          { label: "Tal vez", value: "tal_vez" },
          { label: "No", value: "no" },
        ],
      }),
      field({
        id: "comments",
        type: "textarea",
        name: "comments",
        label: "Comentarios",
        placeholder: "¿Qué mejorarías?",
      }),
    ],
  },
  {
    id: "booking",
    label: "Reserva",
    description: "Agenda una visita o una reunión.",
    destination: "event_registration",
    defaultName: "Reserva",
    defaultDescription: "Elige un momento y te confirmamos.",
    fields: [
      field({
        id: "fullName",
        type: "text",
        name: "fullName",
        label: "Nombre completo",
        placeholder: "María López",
        validation: { required: true },
      }),
      field({
        id: "email",
        type: "email",
        name: "email",
        label: "Correo",
        placeholder: "maria@correo.cl",
        validation: { required: true },
      }),
      field({
        id: "phone",
        type: "phone",
        name: "phone",
        label: "Teléfono",
        placeholder: "+56 9…",
        validation: { required: true },
      }),
      field({
        id: "preferredDate",
        type: "date",
        name: "preferredDate",
        label: "Fecha preferida",
        validation: { required: true },
      }),
      field({
        id: "preferredTime",
        type: "time",
        name: "preferredTime",
        label: "Hora preferida",
      }),
      field({
        id: "notes",
        type: "textarea",
        name: "notes",
        label: "Notas",
        placeholder: "Algo que debamos saber",
      }),
    ],
  },
];

export function getFormQuickTemplate(id: FormQuickTemplateId): FormQuickTemplate {
  const found = FORM_QUICK_TEMPLATES.find((t) => t.id === id);
  if (!found) {
    throw new Error(`Plantilla de formulario desconocida: ${id}`);
  }
  return found;
}

/** Campos mínimos al crear desde cero (mismo motor). */
export const BLANK_FORM_FIELDS: ExperienceFormField[] = [
  field({
    id: "fullName",
    type: "text",
    name: "fullName",
    label: "Nombre completo",
    placeholder: "María López",
    validation: { required: true },
  }),
  field({
    id: "email",
    type: "email",
    name: "email",
    label: "Correo",
    placeholder: "maria@correo.cl",
    validation: { required: true },
  }),
];
