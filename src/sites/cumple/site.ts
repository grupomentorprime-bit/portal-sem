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
