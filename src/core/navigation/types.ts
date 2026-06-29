export interface NavLink {
  label: string;
  href: string;
  target?: "_self" | "_blank";
  highlighted?: boolean;
}

export interface FooterColumn {
  title: string;
  links: NavLink[];
}

/** Menús estándar de la plataforma — IDs estables, contenido por tenant vía CMS */
export const NAV_MENU_IDS = {
  header: "main",
  footer: "footer",
  mobile: "mobile",
  legal: "legal",
  quickLinks: "quick-links",
} as const;

export type NavMenuId = (typeof NAV_MENU_IDS)[keyof typeof NAV_MENU_IDS];

export interface ResolvedNavigation {
  header: NavLink[];
  footer: FooterColumn[];
  mobile: NavLink[];
  legal: NavLink[];
  quickLinks: NavLink[];
}
