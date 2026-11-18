import type { SiteConfigPatch } from "@/lib/cms/site-config-patch";
import type { ContactInfo, Institution, SiteConfig, SocialLinks } from "@/types/cms";
import type { SpacePresencePanelId } from "@/lib/desktop/space-settings";

export type EmpresaBlockId = "general" | "contacto" | "ubicacion" | "redes";

export const EMPRESA_BLOCKS: {
  id: EmpresaBlockId;
  title: string;
  lead: string;
}[] = [
  {
    id: "general",
    title: "Información general",
    lead: "Nombre, organización y presencia básica de este Espacio.",
  },
  {
    id: "contacto",
    title: "Contacto institucional",
    lead: "Correo, teléfono y WhatsApp para atender a las personas.",
  },
  {
    id: "ubicacion",
    title: "Ubicación",
    lead: "Dirección y lugar donde opera el Espacio.",
  },
];

const REDES_BLOCK = {
  id: "redes",
  title: "Redes sociales",
  lead: "Perfiles oficiales. También son canales de atención.",
} as const;

/** Mi empresa conserva ficha y lugar. Canales concentra contacto y redes de atención. */
export function presenceBlocks(panel: SpacePresencePanelId): {
  id: EmpresaBlockId;
  title: string;
  lead: string;
}[] {
  if (panel === "canales") {
    const contacto = EMPRESA_BLOCKS.find((block) => block.id === "contacto");
    return contacto ? [contacto, REDES_BLOCK] : [REDES_BLOCK];
  }
  if (panel === "empresa") return EMPRESA_BLOCKS.filter((block) => block.id !== "contacto");
  return [];
}

const GENERAL_KEYS = [
  "name",
  "shortName",
  "organization",
  "website",
  "tagline",
] as const satisfies readonly (keyof Institution)[];

const CONTACTO_KEYS = ["email", "phone", "whatsapp", "hours"] as const satisfies readonly (keyof ContactInfo)[];

const REDES_KEYS = [
  "facebook",
  "instagram",
  "youtube",
  "linkedin",
  "tiktok",
  "spotify",
] as const satisfies readonly (keyof SocialLinks)[];

const UBICACION_KEYS = ["address", "region", "city", "country"] as const satisfies readonly (keyof ContactInfo)[];

function changedKeys<T extends object, K extends keyof T>(
  baseline: T,
  current: T,
  keys: readonly K[]
): Partial<Pick<T, K>> | undefined {
  const patch: Partial<Pick<T, K>> = {};
  let changed = false;
  for (const key of keys) {
    if (JSON.stringify(baseline[key]) !== JSON.stringify(current[key])) {
      patch[key] = current[key];
      changed = true;
    }
  }
  return changed ? patch : undefined;
}

function changedFields<T extends object>(baseline: T, current: T): Partial<T> | undefined {
  const patch: Partial<T> = {};
  let changed = false;
  for (const key of Object.keys(current) as (keyof T)[]) {
    if (JSON.stringify(baseline[key]) !== JSON.stringify(current[key])) {
      patch[key] = current[key];
      changed = true;
    }
  }
  return changed ? patch : undefined;
}

/** Solo los campos del bloque. El resto de la ficha no entra en el PUT. */
export function empresaBlockPatch(
  block: EmpresaBlockId,
  baseline: SiteConfig,
  current: SiteConfig
): SiteConfigPatch {
  if (block === "general") {
    const institution = changedKeys(baseline.institution, current.institution, GENERAL_KEYS);
    return institution ? { institution } : {};
  }
  if (block === "contacto") {
    const contact = changedKeys(baseline.contact, current.contact, CONTACTO_KEYS);
    return contact ? { contact } : {};
  }
  if (block === "ubicacion") {
    const contact = changedKeys(baseline.contact, current.contact, UBICACION_KEYS);
    return contact ? { contact } : {};
  }
  const social = changedKeys(baseline.social, current.social, REDES_KEYS);
  return social ? { social } : {};
}

export function empresaBlockDirty(
  block: EmpresaBlockId,
  baseline: SiteConfig,
  current: SiteConfig
): boolean {
  return Object.keys(empresaBlockPatch(block, baseline, current)).length > 0;
}

export function displayValue(value: string | null | undefined, empty = "Sin dato"): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : empty;
}

/** Campos que esta pantalla puede escribir. El resto de SiteConfig queda fuera del PUT. */
export function presenceConfigPatch(
  panel: SpacePresencePanelId,
  baseline: SiteConfig,
  current: SiteConfig
): SiteConfigPatch {
  if (panel === "empresa") {
    const institution = changedFields(baseline.institution, current.institution);
    const contact = changedFields(baseline.contact, current.contact);
    return {
      ...(institution ? { institution } : {}),
      ...(contact ? { contact } : {}),
    };
  }

  if (panel === "marca") {
    const branding = changedFields(baseline.branding, current.branding);
    return branding ? { branding } : {};
  }

  return {};
}
