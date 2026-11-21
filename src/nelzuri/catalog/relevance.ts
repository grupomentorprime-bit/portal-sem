import type { MentorAppId } from "@/nelzuri/catalog/manifests";
import { MENTOR_APPS } from "@/nelzuri/catalog/manifests";
import { manifestById } from "@/nelzuri/catalog/registry";
import { resolveAuthorizedApps } from "@/nelzuri/contracts/authorization";

export interface DesktopBands {
  /** Techo ∩ llave. El rubro no las filtra. */
  mine: MentorAppId[];
  /** Pertinentes al rubro, operativas y todavía no contratadas. */
  recommended: MentorAppId[];
  /** Otras operativas que el cliente puede pedir. Pedir no contrata. */
  explore: MentorAppId[];
}

function spaceTypeOf(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

/** Perfil del Espacio → aplicaciones pertinentes, en el orden del catálogo. No escribe nada. */
export function relevance(spaceType: string | null | undefined): MentorAppId[] {
  const type = spaceTypeOf(spaceType);
  if (!type) return [];
  return MENTOR_APPS.filter((id) => operational(id) && (manifestById(id).sectors ?? []).includes(type));
}

function operational(id: MentorAppId): boolean {
  const manifest = manifestById(id);
  return manifest.contractable && manifest.integration !== "pending";
}

/**
 * Tres bandas de la mesa.
 * Lo habilitado sale solo del contrato y de la llave.
 * Sin rubro no hay recomendación. Lo pendiente no aparece como operativo.
 */
export function desktopBands(input: {
  spaceType: string | null | undefined;
  contracted: readonly MentorAppId[];
  authorizedApps?: readonly MentorAppId[] | null;
  canRequestPlan: boolean;
}): DesktopBands {
  const mine = resolveAuthorizedApps({
    contracted: input.contracted,
    authorizedApps: input.authorizedApps,
  });
  if (!input.canRequestPlan) {
    return { mine, recommended: [], explore: [] };
  }
  const contracted = new Set(MENTOR_APPS.filter((id) => input.contracted.includes(id)));
  const pertinent = new Set(relevance(input.spaceType));
  const open = MENTOR_APPS.filter((id) => operational(id) && !contracted.has(id));
  return {
    mine,
    recommended: open.filter((id) => pertinent.has(id)),
    explore: open.filter((id) => !pertinent.has(id)),
  };
}
