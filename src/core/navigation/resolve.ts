import { buildMenuTree, resolveMenuItemHref } from "@/lib/cms/menu-utils";
import { filterLinksByFeatures } from "@/lib/portal/feature-flags";
import type { FeatureFlags } from "@/types/cms";
import type { MenuItem } from "@/types/menu";
import type { FooterColumn, NavLink, ResolvedNavigation } from "./types";

function mapItemsToLinks(items: MenuItem[], features?: FeatureFlags): NavLink[] {
  const seen = new Set<string>();
  const links = items
    .filter((item) => item.visible && item.active)
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      label: item.title,
      href: resolveMenuItemHref(item),
      target: item.target,
      highlighted: item.highlighted,
    }))
    .filter((link) => {
      if (seen.has(link.href)) return false;
      seen.add(link.href);
      return true;
    });

  return features ? filterLinksByFeatures(links, features) : links;
}

export function mapFooterColumns(
  items: MenuItem[],
  features?: FeatureFlags
): FooterColumn[] {
  const tree = buildMenuTree(items);

  if (tree.some((node) => node.children.length > 0)) {
    return tree
      .map((node) => ({
        title: node.title,
        links: node.children.length
          ? mapItemsToLinks(node.children, features)
          : [{ label: node.title, href: resolveMenuItemHref(node) }],
      }))
      .filter((column) => column.links.length > 0);
  }

  const links = mapItemsToLinks(items, features);
  if (links.length === 0) return [];

  const midpoint = Math.ceil(links.length / 2);
  return [
    { title: "Portal", links: links.slice(0, midpoint) },
    { title: "Institución", links: links.slice(midpoint) },
  ].filter((col) => col.links.length > 0);
}

interface NavigationMenusInput {
  header?: MenuItem[];
  footer?: MenuItem[];
  mobile?: MenuItem[];
  legal?: MenuItem[];
  quickLinks?: MenuItem[];
}

export function resolveNavigation(
  menus: NavigationMenusInput,
  features?: FeatureFlags
): ResolvedNavigation {
  const filter = (links: NavLink[]) =>
    features ? filterLinksByFeatures(links, features) : links;

  const header = filter(mapItemsToLinks(menus.header ?? []));
  const mobileSource = menus.mobile?.length ? menus.mobile : menus.header ?? [];

  return {
    header,
    footer: mapFooterColumns(menus.footer ?? [], features),
    mobile: filter(mapItemsToLinks(mobileSource)),
    legal: filter(mapItemsToLinks(menus.legal ?? [])),
    quickLinks: filter(mapItemsToLinks(menus.quickLinks ?? [])),
  };
}
