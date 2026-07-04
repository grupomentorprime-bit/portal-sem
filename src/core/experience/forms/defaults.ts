import type { ExperienceFormDefinition } from "@/types/experience-forms";
import {
  TESTIMONIAL_FORM_LIMITS,
  TESTIMONIAL_GENERATION_OPTIONS,
  TESTIMONIAL_ROLE_OPTIONS,
  testimonialFieldHelper,
} from "@/lib/experience/forms/testimonial-limits";

function baseMeta(
  id: string,
  tenant: string,
  partial: Omit<
    ExperienceFormDefinition,
    "_id" | "tenant" | "createdAt" | "updatedAt"
  >
): ExperienceFormDefinition {
  const now = new Date().toISOString();
  return {
    _id: id,
    tenant,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

export function createSemDefaultForms(tenant: string): ExperienceFormDefinition[] {
  return [
    baseMeta("attendance-confirmation", tenant, {
      name: "Confirmación de asistencia a Jornada Presencial",
      description: "Confirma tu participación en la jornada presencial del seminario.",
      successMessage:
        "¡Gracias! Hemos registrado tu confirmación de asistencia. Te esperamos en la jornada.",
      errorMessage: "No fue posible registrar tu confirmación. Intenta nuevamente.",
      destination: "attendance_confirmation",
      postSubmit: {
        type: "message",
        message: "Tu confirmación fue registrada correctamente.",
      },
      active: true,
      visible: true,
      fields: [
        {
          id: "fullName",
          type: "text",
          name: "fullName",
          label: "Nombre completo",
          validation: { required: true, minLength: 2 },
        },
        {
          id: "email",
          type: "email",
          name: "email",
          label: "Correo electrónico",
          validation: { required: true },
        },
        {
          id: "phone",
          type: "phone",
          name: "phone",
          label: "Teléfono",
          validation: { required: true },
        },
        {
          id: "eventDate",
          type: "date",
          name: "eventDate",
          label: "Fecha de la jornada",
          validation: { required: true },
        },
        {
          id: "notes",
          type: "textarea",
          name: "notes",
          label: "Comentarios (opcional)",
          validation: { maxLength: 500 },
        },
      ],
    }),
    baseMeta("absence-justification", tenant, {
      name: "Justificación de inasistencia",
      description: "Informa y justifica tu inasistencia a una actividad programada.",
      successMessage: "Hemos recibido tu justificación. El equipo académico la revisará.",
      errorMessage: "No fue posible enviar la justificación. Intenta nuevamente.",
      destination: "absence_justification",
      postSubmit: { type: "message" },
      active: true,
      visible: true,
      fields: [
        {
          id: "fullName",
          type: "text",
          name: "fullName",
          label: "Nombre completo",
          validation: { required: true },
        },
        {
          id: "email",
          type: "email",
          name: "email",
          label: "Correo electrónico",
          validation: { required: true },
        },
        {
          id: "activityDate",
          type: "date",
          name: "activityDate",
          label: "Fecha de la actividad",
          validation: { required: true },
        },
        {
          id: "reason",
          type: "select",
          name: "reason",
          label: "Motivo",
          validation: { required: true },
          options: [
            { label: "Enfermedad", value: "illness" },
            { label: "Emergencia familiar", value: "family" },
            { label: "Compromiso laboral", value: "work" },
            { label: "Otro", value: "other" },
          ],
        },
        {
          id: "details",
          type: "textarea",
          name: "details",
          label: "Detalle de la justificación",
          validation: { required: true, minLength: 10, maxLength: 1000 },
        },
      ],
    }),
    baseMeta("information-request", tenant, {
      name: "Solicitud de información",
      description: "Solicita información sobre programas, admisión o actividades del seminario.",
      successMessage:
        "¡Gracias por contactarnos! Te responderemos a la brevedad al correo indicado.",
      errorMessage: "No fue posible enviar tu solicitud. Intenta nuevamente.",
      destination: "information_request",
      postSubmit: { type: "message" },
      active: true,
      visible: true,
      fields: [
        {
          id: "fullName",
          type: "text",
          name: "fullName",
          label: "Nombre completo",
          validation: { required: true },
        },
        {
          id: "email",
          type: "email",
          name: "email",
          label: "Correo electrónico",
          validation: { required: true },
        },
        {
          id: "phone",
          type: "phone",
          name: "phone",
          label: "Teléfono (opcional)",
        },
        {
          id: "interest",
          type: "select",
          name: "interest",
          label: "Área de interés",
          validation: { required: true },
          options: [
            { label: "Programas académicos", value: "programs" },
            { label: "Proceso de admisión", value: "admission" },
            { label: "Becas y beneficios", value: "scholarships" },
            { label: "Otro", value: "other" },
          ],
        },
        {
          id: "message",
          type: "textarea",
          name: "message",
          label: "Mensaje",
          validation: { required: true, minLength: 10, maxLength: 2000 },
        },
      ],
    }),
    baseMeta("convocatoria-talca-aurora-jul-2026", tenant, {
      name: "Convocatoria — Jornada Presencial Talca Aurora (4 julio)",
      description:
        "Confirma si asistirás a la jornada presencial del 4 de julio de 2026 en Talca Aurora. Si no podrás asistir, indica el motivo.",
      successMessage:
        "¡Gracias! Hemos registrado tu respuesta. El equipo académico la tendrá en cuenta.",
      errorMessage: "No fue posible registrar tu respuesta. Intenta nuevamente.",
      destination: "attendance_confirmation",
      postSubmit: {
        type: "message",
        message: "Tu respuesta fue registrada correctamente.",
      },
      active: true,
      visible: true,
      fields: [
        {
          id: "eventId",
          type: "hidden",
          name: "eventId",
          label: "Evento",
          defaultValue: "talca-aurora-jul-2026",
        },
        {
          id: "studentId",
          type: "hidden",
          name: "studentId",
          label: "Alumno",
        },
        {
          id: "fullName",
          type: "hidden",
          name: "fullName",
          label: "Nombre completo",
        },
        {
          id: "program",
          type: "hidden",
          name: "program",
          label: "Generación",
        },
        {
          id: "email",
          type: "email",
          name: "email",
          label: "Correo electrónico",
          validation: { required: true },
        },
        {
          id: "phone",
          type: "phone",
          name: "phone",
          label: "Teléfono de contacto",
          placeholder: "+56 9 1234 5678",
          helper: "Formato Chile: +56 9 1234 5678. Actualiza tu número para que el equipo pueda contactarte.",
          validation: { required: true },
        },
        {
          id: "attendance",
          type: "radio",
          name: "attendance",
          label: "¿Asistirás a la jornada del 4 de julio en Talca Aurora?",
          validation: { required: true },
          options: [
            { label: "Sí, asistiré", value: "yes" },
            { label: "No podré asistir", value: "no" },
          ],
        },
        {
          id: "justification",
          type: "textarea",
          name: "justification",
          label: "Motivo de inasistencia",
          helper:
            "Obligatorio si no podrás asistir. Solo procede por causa de fuerza mayor; debes adjuntar respaldo documental.",
          validation: { maxLength: 1000 },
        },
        {
          id: "notes",
          type: "textarea",
          name: "notes",
          label: "Comentarios adicionales (opcional)",
          validation: { maxLength: 500 },
        },
      ],
    }),
    baseMeta("program-application", tenant, {
      name: "Postulación al programa",
      description: "Inicia tu postulación a un programa formativo del seminario.",
      successMessage:
        "Hemos recibido tu postulación. Pronto recibirás instrucciones para continuar el proceso.",
      errorMessage: "No fue posible enviar tu postulación. Intenta nuevamente.",
      destination: "contact",
      postSubmit: {
        type: "redirect",
        action: { type: "url", href: "/admision" },
      },
      active: true,
      visible: true,
      fields: [
        {
          id: "fullName",
          type: "text",
          name: "fullName",
          label: "Nombre completo",
          validation: { required: true },
        },
        {
          id: "email",
          type: "email",
          name: "email",
          label: "Correo electrónico",
          validation: { required: true },
        },
        {
          id: "phone",
          type: "phone",
          name: "phone",
          label: "Teléfono",
          validation: { required: true },
        },
        {
          id: "program",
          type: "select",
          name: "program",
          label: "Programa de interés",
          validation: { required: true },
          options: [
            {
              label: "Diploma en Teología Bíblica Pastoral — G-2023 (Pastores y pastoras)",
              value: "diploma-teologia-biblica-pastoral-g2023",
            },
            {
              label: "Diploma en Teología Bíblica — Generación 2024",
              value: "diploma-teologia-biblica-pastores-g2024",
            },
            {
              label: "Diploma en Teología Bíblica — Generación 2025",
              value: "diploma-teologia-biblica-hermanos-g2025",
            },
            {
              label: "Diploma en Teología Bíblica — Generación 2026",
              value: "diploma-teologia-biblica-hermanos-g2026",
            },
          ],
        },
        {
          id: "church",
          type: "text",
          name: "church",
          label: "Iglesia / Comunidad",
          validation: { required: true },
        },
        {
          id: "motivation",
          type: "textarea",
          name: "motivation",
          label: "Motivación para postular",
          validation: { required: true, minLength: 20, maxLength: 2000 },
        },
      ],
    }),
    baseMeta("testimonial-submission", tenant, {
      name: "Testimonio de alumno",
      description:
        "Comparte tu experiencia formativa en el SEM. El equipo revisará tu respuesta antes de publicarla en el sitio.",
      successMessage:
        "¡Gracias por compartir tu testimonio! Lo revisaremos y, si es aprobado, aparecerá en la sección de voces de nuestra comunidad.",
      errorMessage: "No fue posible enviar tu testimonio. Revisa los campos e intenta nuevamente.",
      destination: "testimonial_submission",
      postSubmit: { type: "message" },
      active: true,
      visible: false,
      private: true,
      fields: [
        {
          id: "quote",
          type: "textarea",
          name: "quote",
          label: "Tu testimonio",
          placeholder:
            "Ej.: La formación del seminario me equipó para responder con excelencia a los desafíos de la Iglesia hoy.",
          helper: testimonialFieldHelper("quote", "Comparte tu experiencia en pocas palabras."),
          validation: { required: true, minLength: 30, maxLength: TESTIMONIAL_FORM_LIMITS.quote },
        },
        {
          id: "honorific",
          type: "select",
          name: "honorific",
          label: "Rol en el ministerio (opcional)",
          helper: "Selecciona cómo te identificas. Aparece antes de tu nombre en la tarjeta pública.",
          options: TESTIMONIAL_ROLE_OPTIONS.map((option) => ({
            label: option.label,
            value: option.value,
          })),
        },
        {
          id: "fullName",
          type: "text",
          name: "fullName",
          label: "Nombre y apellido",
          placeholder: "Ej.: Marco Torres",
          helper: testimonialFieldHelper("fullName"),
          validation: { required: true, minLength: 3, maxLength: TESTIMONIAL_FORM_LIMITS.fullName },
        },
        {
          id: "generation",
          type: "select",
          name: "generation",
          label: "Generación",
          helper:
            "Si no eres alumno, elige «Sin generación». Si aplica, se mostrará como «Generación 20XX».",
          validation: { required: true },
          options: TESTIMONIAL_GENERATION_OPTIONS.map((option) => ({
            label: option.label,
            value: option.value,
          })),
        },
        {
          id: "churchSection",
          type: "text",
          name: "churchSection",
          label: "Iglesia o comunidad",
          placeholder: "Ej.: Iglesia Anglicana",
          helper: testimonialFieldHelper("churchSection", "Sin incluir la ciudad."),
          validation: { required: true, maxLength: TESTIMONIAL_FORM_LIMITS.churchSection },
        },
        {
          id: "city",
          type: "text",
          name: "city",
          label: "Ciudad o comuna",
          placeholder: "Ej.: Concepción",
          helper: testimonialFieldHelper("city", "Se combina con la iglesia: «Iglesia, Ciudad»."),
          validation: { required: true, maxLength: TESTIMONIAL_FORM_LIMITS.city },
        },
        {
          id: "email",
          type: "email",
          name: "email",
          label: "Correo electrónico",
          helper: "Solo para contacto interno; no se publica en el sitio.",
          validation: { required: true },
        },
        {
          id: "consentPublish",
          type: "checkbox",
          name: "consentPublish",
          label: "Autorizo la revisión y posible publicación",
          helper:
            "Entiendo que el equipo del SEM revisará mi testimonio y decidirá qué información se publica en el portal.",
          validation: { required: true },
        },
      ],
    }),
  ];
}

export const SEM_DEFAULT_FORM_IDS = [
  "attendance-confirmation",
  "absence-justification",
  "convocatoria-talca-aurora-jul-2026",
  "information-request",
  "program-application",
  "testimonial-submission",
] as const;
