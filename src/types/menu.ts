export const MENU_LOCATIONS = [
  "header",
  "footer",
  "mobile",
  "sidebar",
  "legal",
  "quick-links",
  "top",
  "academic",
  "intranet",
  "campus",
  "library",
  "store",
] as const;

export type MenuLocation = (typeof MENU_LOCATIONS)[number] | string;

export const MENU_ITEM_TYPES = [
  "internal",
  "external",
  "cms_page",
  "program",
  "category",
  "news",
  "blog",
  "event",
] as const;

export type MenuItemType = (typeof MENU_ITEM_TYPES)[number];

export const MENU_TARGETS = ["_self", "_blank"] as const;

export type MenuTarget = (typeof MENU_TARGETS)[number];

export interface MenuItem {
  id: string;
  title: string;
  slug: string;
  url: string;
  type: MenuItemType;
  icon: string;
  parent: string | null;
  order: number;
  visible: boolean;
  active: boolean;
  target: MenuTarget;
  nofollow: boolean;
  highlighted: boolean;
  badge: string;
  color: string;
  level: number;
}

export interface CmsMenu {
  _id: string;
  tenant?: string;
  name: string;
  location: MenuLocation;
  active: boolean;
  items: MenuItem[];
  createdAt: string;
  updatedAt: string;
}

export type CmsMenuCreate = Pick<CmsMenu, "name" | "location" | "active" | "items" | "tenant"> & {
  _id: string;
};

export type CmsMenuUpdate = Pick<CmsMenu, "name" | "location" | "active" | "items">;

export interface MenuTreeNode extends MenuItem {
  children: MenuTreeNode[];
}
