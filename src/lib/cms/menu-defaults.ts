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
  item({ id: "institution", title: "El Seminario", slug: "/institucion", icon: "building", order: 2 }),
  item({ id: "programs", title: "Programas", slug: "/programas", icon: "book", order: 3 }),
  item({ id: "team", title: "Equipo", slug: "/equipo", icon: "users", order: 4 }),
  item({
    id: "ipn",
    title: "IPN Chile",
    slug: "https://ipnchile.cl",
    type: "external",
    url: "https://ipnchile.cl",
    target: "_blank",
    icon: "globe",
    order: 5,
  }),
  item({ id: "resources", title: "Recursos", slug: "/biblioteca", icon: "book-open", order: 6 }),
  item({ id: "news", title: "Noticias", slug: "/noticias", icon: "newspaper", order: 7 }),
  item({ id: "contact", title: "Contacto", slug: "/contacto", icon: "mail", order: 8 }),
]);

const FOOTER_ITEMS: MenuItem[] = computeItemLevels([
  item({ id: "resources-group", title: "Recursos", slug: "#", order: 1 }),
  item({
    id: "library-footer",
    title: "Biblioteca",
    slug: "/biblioteca",
    icon: "book-open",
    order: 1,
    parent: "resources-group",
  }),
  item({
    id: "news-footer",
    title: "Noticias",
    slug: "/noticias",
    icon: "newspaper",
    order: 2,
    parent: "resources-group",
  }),
  item({
    id: "events-footer",
    title: "Eventos",
    slug: "/eventos",
    icon: "calendar",
    order: 3,
    parent: "resources-group",
  }),
  item({ id: "admission-group", title: "Admisión", slug: "#", order: 2 }),
  item({
    id: "apply-footer",
    title: "Postular",
    slug: "/admision",
    icon: "send",
    order: 1,
    parent: "admission-group",
    highlighted: true,
  }),
  item({
    id: "scholarships-footer",
    title: "Becas",
    slug: "/admision#becas",
    icon: "award",
    order: 2,
    parent: "admission-group",
  }),
  item({
    id: "requirements-footer",
    title: "Requisitos",
    slug: "/admision#requisitos",
    icon: "clipboard-list",
    order: 3,
    parent: "admission-group",
  }),
  item({
    id: "faq-footer",
    title: "Preguntas frecuentes",
    slug: "/admision#faq",
    icon: "help-circle",
    order: 4,
    parent: "admission-group",
  }),
  item({
    id: "campus-footer",
    title: "Aula virtual",
    slug: "https://campus.aprendehoy.cl",
    type: "external",
    url: "https://campus.aprendehoy.cl",
    target: "_blank",
    icon: "monitor",
    order: 5,
    parent: "admission-group",
  }),
]);

const LEGAL_ITEMS: MenuItem[] = computeItemLevels([
  item({ id: "privacy", title: "Política de Privacidad", slug: "/privacidad", icon: "shield", order: 1 }),
  item({ id: "terms", title: "Términos de Uso", slug: "/terminos", icon: "file", order: 2 }),
  item({ id: "sitemap", title: "Mapa del Sitio", slug: "/sitemap", icon: "map", order: 3 }),
]);

const QUICK_LINK_ITEMS: MenuItem[] = computeItemLevels([
  item({
    id: "login",
    title: "Ingresar",
    slug: "/ingresar",
    icon: "log-in",
    order: 1,
  }),
  item({
    id: "apply",
    title: "Postular ahora",
    slug: "/admision",
    icon: "send",
    order: 2,
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
    order: 3,
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
