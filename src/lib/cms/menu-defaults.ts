import { computeItemLevels } from "@/lib/cms/menu-utils";
import type { CmsMenu, MenuItem } from "@/types/menu";

function item(
  partial: Pick<MenuItem, "id" | "title" | "slug"> &
    Partial<Omit<MenuItem, "id" | "title" | "slug">>
): MenuItem {
  return {
    url: "",
    type: "internal",
    icon: "circle",
    parent: null,
    order: 1,
    visible: true,
    active: true,
    target: "_self",
    nofollow: false,
    highlighted: false,
    badge: "",
    color: "",
    level: 0,
    ...partial,
  };
}

const MAIN_ITEMS: MenuItem[] = computeItemLevels([
  item({ id: "home", title: "Inicio", slug: "/", icon: "house", order: 1 }),
  item({ id: "programs", title: "Programas", slug: "/programas", icon: "book", order: 2 }),
  item({ id: "team", title: "Equipo", slug: "/equipo", icon: "users", order: 3 }),
  item({ id: "news", title: "Noticias", slug: "/noticias", icon: "newspaper", order: 4 }),
  item({ id: "library", title: "Biblioteca", slug: "/biblioteca", icon: "library", order: 5 }),
  item({ id: "contact", title: "Contacto", slug: "/contacto", icon: "mail", order: 6 }),
]);

const FOOTER_ITEMS: MenuItem[] = computeItemLevels([
  item({ id: "privacy", title: "Privacidad", slug: "/privacidad", icon: "shield", order: 1 }),
  item({ id: "terms", title: "Términos", slug: "/terminos", icon: "file", order: 2 }),
  item({ id: "contact-footer", title: "Contacto", slug: "/contacto", icon: "mail", order: 3 }),
]);

const MOBILE_ITEMS: MenuItem[] = [...MAIN_ITEMS];

export const DEFAULT_MENUS: CmsMenu[] = [
  {
    _id: "main",
    name: "Menú Principal",
    location: "header",
    active: true,
    items: MAIN_ITEMS,
    createdAt: "",
    updatedAt: "",
  },
  {
    _id: "footer",
    name: "Menú Footer",
    location: "footer",
    active: true,
    items: FOOTER_ITEMS,
    createdAt: "",
    updatedAt: "",
  },
  {
    _id: "mobile",
    name: "Menú Mobile",
    location: "mobile",
    active: true,
    items: MOBILE_ITEMS,
    createdAt: "",
    updatedAt: "",
  },
];
