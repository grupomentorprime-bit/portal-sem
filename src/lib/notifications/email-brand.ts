import { IPN_CHILE_VARONES } from "@/core/units/ipn-chile";

export interface DepartmentEmailBrand {
  name: string;
  /** Referencia inline del logo en el HTML (`cid:…`). */
  logoSrc: string;
  /** Ruta dentro de `public/`, sin barra inicial. */
  logoFile: string;
  contentId: string;
}

const VARONES_CONTENT_ID = "varones-nacional";

/**
 * Marca del departamento cuando la invitación es de esa unidad.
 * El Espacio completo, u otra unidad, no usa esta marca.
 */
export function departmentEmailBrand(
  unitIds: readonly string[] | undefined
): DepartmentEmailBrand | null {
  if (!unitIds?.includes(IPN_CHILE_VARONES.unitId)) return null;
  return {
    name: IPN_CHILE_VARONES.name,
    logoSrc: `cid:${VARONES_CONTENT_ID}`,
    logoFile: "branding/ipn-chile/varones-nacional.png",
    contentId: VARONES_CONTENT_ID,
  };
}

export function unitIdsFromAccess(
  access?: { mode: string; unitIds?: readonly string[] } | null
): string[] | undefined {
  if (access?.mode !== "units" || !access.unitIds?.length) return undefined;
  return [...access.unitIds];
}

export function invitationEmailVoice(spaceName: string, departmentName?: string): {
  label: string;
  subject: string;
  preview: string;
  lead: string;
} {
  const department = departmentName?.trim() ?? "";
  if (department) {
    return {
      label: department,
      subject: `Invitación — ${department}`,
      preview: `Crea tu contraseña para acceder al ${department}.`,
      lead: `Te invitaron a administrar el ${department}.`,
    };
  }
  return {
    label: spaceName,
    subject: `Invitación — ${spaceName}`,
    preview: `Crea tu contraseña para acceder a ${spaceName}.`,
    lead: `Te invitaron a administrar el Espacio ${spaceName}.`,
  };
}

export function recoveryEmailVoice(spaceName: string, departmentName?: string): {
  label: string;
  subject: string;
  preview: string;
  lead: string;
} {
  const department = departmentName?.trim() ?? "";
  if (department) {
    return {
      label: department,
      subject: `Recupera tu contraseña — ${department}`,
      preview: `Crea una nueva contraseña para el ${department}.`,
      lead: `Pediste un enlace para crear una nueva contraseña del ${department}.`,
    };
  }
  return {
    label: spaceName,
    subject: `Recupera tu contraseña — ${spaceName}`,
    preview: `Crea una nueva contraseña para ${spaceName}.`,
    lead: `Pediste un enlace para crear una nueva contraseña del Espacio ${spaceName}.`,
  };
}

export function accessEmailVoice(spaceName: string, departmentName?: string): {
  label: string;
  subject: string;
  preview: string;
  lead: string;
} {
  const department = departmentName?.trim() ?? "";
  if (department) {
    return {
      label: department,
      subject: `Tu acceso — ${department}`,
      preview: `Tu acceso al ${department}.`,
      lead: `Te reenviamos el acceso al ${department}.`,
    };
  }
  return {
    label: spaceName,
    subject: `Tu acceso — ${spaceName}`,
    preview: `Tu acceso a ${spaceName}.`,
    lead: `Te reenviamos el acceso al Espacio ${spaceName}.`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Encabezado del correo: logo del departamento, o la pastilla con el nombre. */
export function renderEmailBrandMark(input: {
  name: string;
  logoSrc?: string;
  pillBackground?: string;
  pillColor?: string;
}): string {
  const name = escapeHtml(input.name);
  if (input.logoSrc) {
    return `<img src="${escapeHtml(input.logoSrc)}" alt="${name}" width="220" style="display:block;margin:0 auto;width:220px;max-width:100%;height:auto;border:0;" />`;
  }
  const background = input.pillBackground ?? "#0f172a";
  const color = input.pillColor ?? "#ffffff";
  return `<div style="display:inline-block;padding:10px 18px;border-radius:999px;background:${background};color:${color};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${name}</div>`;
}

const BRAND_PILL =
  /<div style="display:inline-block;padding:10px 18px;border-radius:999px;[^"]*text-transform:uppercase;">[\s\S]*?<\/div>/;

/** Si el correo del departamento salió sin logo, lo pone en el encabezado. */
export function ensureDepartmentLogo(
  html: string,
  brand: { name: string; logoSrc: string }
): string {
  if (html.includes(brand.logoSrc)) return html;
  const mark = renderEmailBrandMark({ name: brand.name, logoSrc: brand.logoSrc });
  if (!BRAND_PILL.test(html)) return html;
  return html.replace(BRAND_PILL, mark);
}
