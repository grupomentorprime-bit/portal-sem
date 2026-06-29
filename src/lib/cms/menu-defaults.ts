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
  item({ id: "news", title: "Noticias", slug: "/noticias", icon: "newspaper", order: 3 }),
  item({ id: "events", title: "Eventos", slug: "/eventos", icon: "calendar", order: 4 }),
  item({ id: "team", title: "Equipo", slug: "/equipo", icon: "users", order: 5 }),
  item({ id: "contact", title: "Contacto", slug: "/contacto", icon: "mail", order: 6 }),
]);

const FOOTER_ITEMS: MenuItem[] = computeItemLevels([
  item({ id: "programs-footer", title: "Programas", slug: "/programas", order: 1 }),
  item({ id: "news-footer", title: "Noticias", slug: "/noticias", order: 2 }),
  item({ id: "events-footer", title: "Eventos", slug: "/eventos", order: 3 }),
  item({ id: "team-footer", title: "Equipo", slug: "/equipo", order: 4 }),
  item({ id: "about-footer", title: "Institución", slug: "/institucion", order: 5 }),
  item({ id: "contact-footer", title: "Contacto", slug: "/contacto", order: 6 }),
]);

const LEGAL_ITEMS: MenuItem[] = computeItemLevels([
  item({ id: "privacy", title: "Privacidad", slug: "/privacidad", icon: "shield", order: 1 }),
  item({ id: "terms", title: "Términos", slug: "/terminos", icon: "file", order: 2 }),
]);

const QUICK_LINK_ITEMS: MenuItem[] = computeItemLevels([
  item({
    id: "apply",
    title: "Postular",
    slug: "/contacto",
    icon: "send",
    order: 1,
    highlighted: true,
  }),
  item({
    id: "campus",
    title: "Aula virtual",
    slug: "https://campus.aprendehoy.cl",
    type: "external",
    url: "https://campus.aprendehoy.cl",
    target: "_blank",
    icon: "monitor",
    order: 2,
  }),
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
  {
    _id: "legal",
    name: "Menú Legal",
    location: "legal",
    active: true,
    items: LEGAL_ITEMS,
    createdAt: "",
    updatedAt: "",
  },
  {
    _id: "quick-links",
    name: "Enlaces rápidos",
    location: "quick-links",
    active: true,
    items: QUICK_LINK_ITEMS,
    createdAt: "",
    updatedAt: "",
  },
];
