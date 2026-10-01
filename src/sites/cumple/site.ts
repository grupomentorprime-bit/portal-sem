import type { CodedSite } from "@/sites/types";
import { organizaciones } from "@/sites/cumple/content";

export const CUMPLE_TENANT_ID = "cumple";
export const CUMPLE_FORM_ID = "cumple-diagnostico";
export const CUMPLE_SEO = {
  title: "Cumple | Cumplimiento empresarial",
  description:
    "Mentor Prime Cumple identifica sus obligaciones, detecta brechas y le ayuda a implementar, documentar y demostrar su cumplimiento.",
} as const;

const organizationOptions = organizaciones.map((item) => ({
  label: item.title,
  value: item.title,
}));

export const cumpleSite: CodedSite = {
  tenantId: CUMPLE_TENANT_ID,
  pages: [
    {
      path: "/",
      title: CUMPLE_SEO.title,
      navLabel: "Inicio",
    },
    {
      path: "/materias/ley-karin",
      title: "Ley Karin: protocolos y control para la empresa | Mentor Prime Cumple",
      navLabel: "Ley Karin",
      description:
        "Qué exige la Ley Karin a la organización, qué implica para el empleador y cómo Mentor Prime Cumple ordena protocolos, investigación y evidencia.",
    },
    {
      path: "/materias/seguridad-salud-trabajo",
      title: "Seguridad y Salud en el Trabajo: gestión preventiva | Mentor Prime Cumple",
      navLabel: "Seguridad y Salud",
      description:
        "Qué exige el marco de SST en Chile, qué implica para el empleador y cómo Mentor Prime Cumple ordena riesgos, medidas y evidencia de cumplimiento.",
    },
    {
      path: "/materias/laboral-rrhh",
      title: "Laboral y RR.HH.: obligaciones y registros al día | Mentor Prime Cumple",
      navLabel: "Laboral y RR.HH.",
      description:
        "Contratos, jornada, registros y vencimientos laborales: qué debe controlar la organización y cómo Mentor Prime Cumple lo centraliza y documenta.",
    },
    {
      path: "/materias/proteccion-datos",
      title: "Protección de datos personales: políticas y controles | Mentor Prime Cumple",
      navLabel: "Protección de datos",
      description:
        "Qué exige la normativa de datos a la empresa, riesgos de un tratamiento desordenado y cómo Mentor Prime Cumple ordena políticas, bases legales y evidencia.",
    },
    {
      path: "/materias/inclusion-laboral",
      title: "Inclusión laboral: obligaciones y documentación | Mentor Prime Cumple",
      navLabel: "Inclusión laboral",
      description:
        "Marco de inclusión laboral en Chile, implicancias para el empleador y cómo Mentor Prime Cumple ayuda a documentar cumplimiento y seguimiento.",
    },
    {
      path: "/materias/contratistas-terceros",
      title: "Contratistas y terceros: control documental | Mentor Prime Cumple",
      navLabel: "Contratistas y terceros",
      description:
        "Requisitos y documentos de contratistas y subcontratos, responsabilidad del mandante y cómo Mentor Prime Cumple ordena el control y la evidencia.",
    },
    {
      path: "/como-funciona",
      title: "Cómo funciona Mentor Prime Cumple | Diagnóstico y control",
      navLabel: "Cómo funciona",
      description:
        "Método en cuatro pasos: diagnóstico, plan, implementación y control permanente. Cómo la plataforma y el acompañamiento ordenan el cumplimiento empresarial.",
    },
    {
      path: "/preguntas-frecuentes",
      title: "Preguntas frecuentes | Mentor Prime Cumple",
      navLabel: "Preguntas frecuentes",
      description:
        "Respuestas sobre alcance, plazos, cambios de norma y qué puede esperar la empresa del diagnóstico y del acompañamiento de cumplimiento.",
    },
    {
      path: "/evaluar",
      title: "Evaluar mi empresa | Diagnóstico de cumplimiento | Mentor Prime Cumple",
      navLabel: "Evaluar mi empresa",
      description:
        "Solicite un diagnóstico preliminar de cumplimiento. Indique su organización y materias prioritarias; el equipo revisará el caso y orientará los siguientes pasos.",
    },
    {
      path: "/nosotros",
      title: "Nosotros | Mentor Prime Cumple",
      navLabel: "Nosotros",
      description:
        "Quién es Mentor Prime Cumple, para qué tipo de organizaciones trabaja y cómo combina consultoría, plataforma y acompañamiento en cumplimiento empresarial.",
    },
    {
      path: "/contacto",
      title: "Contacto | Mentor Prime Cumple",
      navLabel: "Contacto",
      description:
        "Canales de contacto del espacio Cumple y acceso al diagnóstico. La organización encuentra aquí cómo escribir al equipo y evaluar su cumplimiento.",
    },
  ],
  forms: [
    {
      _id: CUMPLE_FORM_ID,
      name: "Diagnóstico",
      description: "Solicitud de diagnóstico de cumplimiento.",
      successMessage:
        "Gracias. El diagnóstico queda en curso. Revisaremos el tipo de organización y las materias que conviene mirar primero.",
      errorMessage: "No pudimos guardar la solicitud. Revise los datos e intente de nuevo.",
      destination: "information_request",
      fields: [
        {
          id: "fullName",
          type: "text",
          name: "fullName",
          label: "Nombre",
          validation: { required: true },
        },
        {
          id: "email",
          type: "email",
          name: "email",
          label: "Correo",
          validation: { required: true },
        },
        {
          id: "company",
          type: "text",
          name: "company",
          label: "Empresa",
          validation: { required: true },
        },
        {
          id: "organizationType",
          type: "select",
          name: "organizationType",
          label: "Tipo de organización",
          options: organizationOptions,
          validation: { required: true },
        },
      ],
    },
  ],
};
