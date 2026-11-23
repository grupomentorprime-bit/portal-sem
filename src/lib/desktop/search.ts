import {
  desktopDock,
  desktopUtilities,
  dockAppBlurb,
  dockAppLabel,
  type DockAppId,
} from "@/lib/desktop/catalog";
import type { SpecializedAppId } from "@/nelzuri";

export type DesktopSearchHit =
  | { kind: "app"; id: DockAppId; title: string; detail: string }
  | { kind: "space"; id: string; title: string; detail: string };

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function matches(haystack: string, query: string): boolean {
  const folded = fold(haystack);
  const words = fold(query).split(/\s+/).filter(Boolean);
  return words.every((word) => folded.includes(word));
}

function appHit(appId: DockAppId, owner: boolean): DesktopSearchHit {
  return {
    kind: "app",
    id: appId,
    title: dockAppLabel(appId),
    detail: dockAppBlurb(appId, owner),
  };
}

/** Aplicaciones del dock. Con texto, también Ajustes (si aplica) y las organizaciones cuyo nombre coincide. */
export function desktopSearch(input: {
  query: string;
  owner: boolean;
  spaces: readonly { tenantId: string; name: string }[];
  /** Sin ajustes de empresa, no aparece Ajustes en la búsqueda. */
  companySettings?: boolean;
  /** Capacidades que esta persona ya puede ver. No se buscan si no están. */
  specialized?: readonly SpecializedAppId[];
}): DesktopSearchHit[] {
  const apps = [
    ...desktopDock(input.owner),
    ...(input.specialized ?? []),
  ].map((appId) => appHit(appId, input.owner));
  const query = input.query.trim();
  if (!query) return apps;

  const showAjustes = input.owner || input.companySettings !== false;
  const utilities = desktopUtilities(input.owner)
    .filter((appId) => appId !== "ajustes" || showAjustes)
    .map((appId) => appHit(appId, input.owner));
  const spaces: DesktopSearchHit[] = input.spaces.map((space) => ({
    kind: "space",
    id: space.tenantId,
    title: space.name,
    detail: input.owner ? "Cliente" : "Espacio",
  }));

  return [...apps, ...utilities, ...spaces]
    .filter((hit) => matches(`${hit.title} ${hit.detail}`, query))
    .slice(0, 8);
}
